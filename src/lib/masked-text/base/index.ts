import type {
  MaskCharacter,
  MaskDefinition,
  MaskDerivedState,
  MaskSectionDerivedState,
  MaskSectionFixedDefinition,
  MaskSectionFixedDerivedState,
  MaskSectionInputDefinition,
  MaskSectionInputDerivedState,
  MaskState,
} from './types';

import { compareSpaceCoordinates, splitStringIntoGraphemes } from './helper';

// local types
type InputHTMLStringPart = {
  cls: string;
  attrs?: { [key: string]: string };
  dataAttrs?: { [key: string]: string };
  value?: string;
};

export const MaskSectionFixed = (mask: string, skipKeys?: string[]): MaskSectionFixedDefinition => ({
  type: 'fixed',
  mask,
  skipKeys,
});

export const MaskSectionInput = (
  slug: string,
  options: {
    maskingFn: (sectionValue: string[]) => MaskCharacter[];

    inputBehavior?: 'replace' | 'insert';
    alignment?: 'left' | 'right';

    inputCharacterFilterFn?: (inputCharacter: string) => boolean;
    inputCharacterSubstitutionFn?: (inputCharacter: string) => string;

    syntacticValidationFn?: (sectionValue: string) => boolean;
    semanticValidationFn?: (values: Record<string, string[]>, sectionSlug: string) => boolean | string;

    spinUpFn?: (
      values: Record<string, string[]>,
      sectionSlug: string,
      metaPressed: boolean,
      shiftPressed: boolean,
      altPressed: boolean,
    ) => Record<string, string[]>;
    spinDownFn?: (
      values: Record<string, string[]>,
      sectionSlug: string,
      metaPressed: boolean,
      shiftPressed: boolean,
      altPressed: boolean,
    ) => Record<string, string[]>;

    sectionCommitValueTransformation?: (sectionValue: string[]) => string;

    maxLength?: number;
  },
): MaskSectionInputDefinition => ({
  type: 'input',
  slug,
  maskingFn: options.maskingFn,

  inputBehavior: options.inputBehavior ?? 'insert',
  alignment: options.alignment ?? 'left',

  inputCharacterFilterFn: options.inputCharacterFilterFn,
  inputCharacterSubstitutionFn: options.inputCharacterSubstitutionFn,

  syntacticValidationFn: options.syntacticValidationFn,

  spinUpFn: options.spinUpFn,
  spinDownFn: options.spinDownFn,

  sectionCommitValueTransformation: options.sectionCommitValueTransformation,

  maxLength: options.maxLength,
});

export const getInitialMaskState = (values: Record<string, string[]> | Record<string, string>): MaskState => {
  const convertedValues: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      convertedValues[key] = value;
    } else {
      convertedValues[key] = splitStringIntoGraphemes(value);
    }
  }

  return {
    values: convertedValues,

    caretPositionInValueSpace: '0:0',
    selectionEndPositionInValueSpace: '0:0',
  };
};

const getFixedSectionDerivedState = (
  maskState: MaskState,
  sectionDefinition: MaskSectionFixedDefinition,
  index: number,
): MaskSectionFixedDerivedState => {
  const localDisplaySpace: string[] = [`${index}:0`];

  const chars: string[] = splitStringIntoGraphemes(sectionDefinition.mask);

  let posDisplaySpace = 0;

  for (const [i, char] of chars.entries()) {
    posDisplaySpace += char.length;

    localDisplaySpace.push(`${index}:${posDisplaySpace}`);
  }

  return {
    type: 'fixed',
    index,

    textInputDisplayString: sectionDefinition.mask,

    displaySpace: localDisplaySpace,
  };
};

const getFixedSectionHTMLStrings = (
  maskState: MaskState,
  maskSection: MaskSectionFixedDerivedState,
  valueSpaceToDisplaySpaceMap: Map<string, string>,
  semanticValidationStatus: boolean | undefined,
): string => {
  const caretPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(maskState.caretPositionInValueSpace);
  const selectionEndPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(maskState.selectionEndPositionInValueSpace);

  const caretRelativePosition = compareSpaceCoordinates(`${maskSection.index}:0`, caretPositionInDisplaySpace) ?? -1;
  const selectionEndRelativePosition = compareSpaceCoordinates(`${maskSection.index}:0`, selectionEndPositionInDisplaySpace) ?? -1;

  const isBeforeCursor: boolean = caretRelativePosition < 0;
  const isBeforeSelectionEnd: boolean = selectionEndRelativePosition < 0;

  const classes: string[] = ['fixed-mask-input'];

  if (semanticValidationStatus === false) {
    classes.push('semantic-error');
  }

  if (isBeforeCursor !== isBeforeSelectionEnd) {
    classes.push('selected');
  }

  const htmlString: string = `<div class="${classes.join(' ')}">${maskSection.textInputDisplayString}</div>`;

  return htmlString;
};

const getInputSectionDerivedState = (
  maskState: MaskState,
  sectionDefinition: MaskSectionInputDefinition,
  index: number,
  valueIndex: number,
): MaskSectionInputDerivedState => {
  const valueSpace: string[] = [`${valueIndex}:0`];
  const displaySpace: string[] = [`${index}:0`];

  const valueSpaceToDisplaySpaceMap: Map<string, string> = new Map();
  const displaySpaceToValueSpaceMap: Map<string, string> = new Map();
  const value = maskState.values[sectionDefinition.slug] ?? [];
  const valueString = value.join('');
  const syntacticValidationStatus = sectionDefinition.syntacticValidationFn ? sectionDefinition.syntacticValidationFn(valueString) : undefined;

  const maskCharacters: MaskCharacter[] = sectionDefinition.maskingFn(value);

  let posValueSpace = 0;
  let posDisplaySpace = 0;

  for (const [i, maskChar] of maskCharacters.entries()) {
    posDisplaySpace += maskChar.char.length;

    const currentDisplaySpaceCoordinates = `${index}:${posDisplaySpace}`;

    displaySpace.push(currentDisplaySpaceCoordinates);

    if (maskChar.type === 'value') {
      if (valueSpace.length === 1 && displaySpace.length >= 2) {
        valueSpaceToDisplaySpaceMap.set(`${valueIndex}:0`, displaySpace[displaySpace.length - 2]);
        displaySpaceToValueSpaceMap.set(displaySpace[displaySpace.length - 2], `${valueIndex}:0`);
      }

      posValueSpace += 1;

      const currentValueSpaceCoordinates = `${valueIndex}:${posValueSpace}`;

      valueSpace.push(currentValueSpaceCoordinates);
      valueSpaceToDisplaySpaceMap.set(currentValueSpaceCoordinates, currentDisplaySpaceCoordinates);
      displaySpaceToValueSpaceMap.set(currentDisplaySpaceCoordinates, currentValueSpaceCoordinates);
    }
  }

  if (value.length === 0) {
    if (sectionDefinition.alignment === 'left') {
      valueSpaceToDisplaySpaceMap.set(valueSpace[0], displaySpace[0]);
      displaySpaceToValueSpaceMap.set(displaySpace[0], valueSpace[0]);
    } else {
      valueSpaceToDisplaySpaceMap.set(valueSpace[0], displaySpace[displaySpace.length - 1]);
      displaySpaceToValueSpaceMap.set(displaySpace[displaySpace.length - 1], valueSpace[0]);
    }
  }

  return {
    type: 'input',
    alignment: sectionDefinition.alignment,
    index,
    slug: sectionDefinition.slug,
    valueIndex,
    value,
    valueString,
    syntacticValidationStatus,

    maskCharacters,
    textInputDisplayString: maskCharacters.map((maskChar: MaskCharacter) => maskChar.char).join(''),

    valueSpace: valueSpace,
    displaySpace: displaySpace,

    valueSpaceToDisplaySpaceMap,
    displaySpaceToValueSpaceMap,
  };
};

const inputHTMLStringPartToHTML = (inputHTMLStringPart: InputHTMLStringPart) => {
  const { cls, attrs, dataAttrs, value } = inputHTMLStringPart;

  const attrsStringString = inputHTMLStringPart.attrs
    ? Object.entries(inputHTMLStringPart.attrs)
        .map(([key, value]) => ` ${key}="${value}"`)
        .join('')
    : '';

  const dataAttrsStringString = inputHTMLStringPart.dataAttrs
    ? Object.entries(inputHTMLStringPart.dataAttrs)
        .map(([key, value]) => ` data-${key}="${value}"`)
        .join('')
    : '';

  const clsStringString = cls.length > 0 ? ` class="${cls}"` : '';

  return `<span${clsStringString}${attrsStringString}${dataAttrsStringString}>${value ?? ''}</span>`;
};

const getInputSectionHTMLStrings = (
  maskState: MaskState,
  maskSection: MaskSectionInputDerivedState,
  valueSpaceToDisplaySpaceMap: Map<string, string>,
  displaySpaceToValueSpaceMap: Map<string, string>,
  semanticValidationStatus: boolean | undefined,
): string => {
  const inputHTMLStringParts: InputHTMLStringPart[] = [];

  const caretPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(maskState.caretPositionInValueSpace) ?? '-1:-1';
  const selectionEndPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(maskState.selectionEndPositionInValueSpace) ?? '-1:-1';

  const [caretPositionInDisplaySpaceIndex, caretPositionInDisplaySpacePosition] = caretPositionInDisplaySpace
    .split(':')
    .map((x) => Number.parseInt(x));
  const [selectionEndPositionInDisplaySpaceIndex, selectionEndPositionInDisplaySpacePosition] = selectionEndPositionInDisplaySpace
    .split(':')
    .map((x) => Number.parseInt(x));

  const caretIsInsideSection = caretPositionInDisplaySpaceIndex === maskSection.index;
  const selectionEndIsInsideSection = selectionEndPositionInDisplaySpaceIndex === maskSection.index;

  let posDisplaySpace = 0;

  let caretPlaced = false;
  let selectionEndPlaced = false;

  const firstValueSpaceCoordinates: string | undefined = maskSection.valueSpace.length > 0 ? maskSection.valueSpace[0] : undefined;
  const lastValueSpaceCoordinates: string | undefined =
    maskSection.valueSpace.length > 0 ? maskSection.valueSpace[maskSection.valueSpace.length - 1] : undefined;

  for (const [i, maskChar] of maskSection.maskCharacters.entries()) {
    const currentDisplaySpaceCoordinatesLeft = `${maskSection.index}:${posDisplaySpace}`;
    const currentValueSpaceCoordinatesLeft = displaySpaceToValueSpaceMap.get(currentDisplaySpaceCoordinatesLeft);
    const caretRelativePositionLeft = compareSpaceCoordinates(currentDisplaySpaceCoordinatesLeft, caretPositionInDisplaySpace) ?? -1;
    const selectionEndRelativePositionLeft = compareSpaceCoordinates(currentDisplaySpaceCoordinatesLeft, selectionEndPositionInDisplaySpace) ?? -1;

    posDisplaySpace += maskChar.char.length;

    const currentDisplaySpaceCoordinatesRight = `${maskSection.index}:${posDisplaySpace}`;
    const currentValueSpaceCoordinatesRight = displaySpaceToValueSpaceMap.get(currentDisplaySpaceCoordinatesRight);
    const caretRelativePositionRight = compareSpaceCoordinates(currentDisplaySpaceCoordinatesRight, caretPositionInDisplaySpace) ?? -1;
    const selectionEndRelativePositionRight = compareSpaceCoordinates(currentDisplaySpaceCoordinatesRight, selectionEndPositionInDisplaySpace) ?? -1;

    if (!caretPlaced && caretRelativePositionLeft == 0) {
      caretPlaced = true;

      inputHTMLStringParts.push({ cls: 'placeholder-caret', attrs: { contenteditable: 'true' } });
    }

    if (!selectionEndPlaced && selectionEndRelativePositionLeft == 0 && caretPositionInDisplaySpace !== selectionEndPositionInDisplaySpace) {
      selectionEndPlaced = true;

      inputHTMLStringParts.push({ cls: 'placeholder-selection-end' });
    }

    const dataAttrs: { [key: string]: string } = {};

    if (currentValueSpaceCoordinatesLeft) {
      dataAttrs['value-pos-left'] = currentValueSpaceCoordinatesLeft;
    } else if (i === 0 && firstValueSpaceCoordinates) {
      dataAttrs['value-pos-left'] = firstValueSpaceCoordinates;
    }

    if (currentValueSpaceCoordinatesRight) {
      dataAttrs['value-pos-right'] = currentValueSpaceCoordinatesRight;
    } else if (i === maskSection.maskCharacters.length - 1 && lastValueSpaceCoordinates) {
      dataAttrs['value-pos-right'] = lastValueSpaceCoordinates;
    }

    inputHTMLStringParts.push({
      cls: maskChar.type === 'mask' ? 'mask-char-mask' : 'mask-char-value',
      dataAttrs,
      value: maskChar.char,
    });

    if (!caretPlaced && caretRelativePositionRight == 0) {
      caretPlaced = true;

      inputHTMLStringParts.push({ cls: 'placeholder-caret', attrs: { contenteditable: 'true' } });
    }

    if (!selectionEndPlaced && selectionEndRelativePositionRight == 0 && caretPositionInDisplaySpace !== selectionEndPositionInDisplaySpace) {
      selectionEndPlaced = true;

      inputHTMLStringParts.push({ cls: 'placeholder-selection-end' });
    }
  }

  const caretPositionInDisplayState = valueSpaceToDisplaySpaceMap.get(maskState.caretPositionInValueSpace) ?? '-1:-1';
  const [caretPositionInDisplayStateSectionIndex, caretPositionInDisplayStatePosition] = caretPositionInDisplayState
    .split(':')
    .map((x) => Number.parseInt(x));

  const isActiveSection = caretPositionInDisplayStateSectionIndex === maskSection.index;

  const classes: string[] = ['section-input'];

  if (isActiveSection) {
    classes.push('active');
  }

  if (semanticValidationStatus === false) {
    classes.push('semantic-error');
  }

  if (maskSection.syntacticValidationStatus === false) {
    classes.push('syntax-error');
  }

  if (inputHTMLStringParts.length === 0) {
    inputHTMLStringParts.push({
      cls: 'mask-char-mask',
      dataAttrs: { 'value-pos-right': `${maskSection.index}:0` },
      value: '&nbsp;',
    });

    if (caretIsInsideSection && !caretPlaced) {
      inputHTMLStringParts.push({ cls: 'placeholder-caret', attrs: { contenteditable: 'true' } });
    }

    if (selectionEndIsInsideSection && !selectionEndPlaced) {
      inputHTMLStringParts.push({ cls: 'placeholder-selection-end' });
    }
  }

  return `<div class="${classes.join(' ')}">${inputHTMLStringParts.map((inputHTMLStringPart) => inputHTMLStringPartToHTML(inputHTMLStringPart)).join('')}</div>`;
};

export const getDerivedState = (maskState: MaskState, maskDefinition: MaskDefinition): MaskDerivedState => {
  const sectionsDeriveState: MaskSectionDerivedState[] = [];

  let valueIndex = -1;

  const inputHTMLStringParts = [];
  const valueSpace: string[] = [];
  const displaySpace: string[] = [];
  const valueSpaceToDisplaySpaceMap: Map<string, string> = new Map();
  const displaySpaceToValueSpaceMap: Map<string, string> = new Map();
  const syntacticValidationStatus: Record<string, boolean | undefined> = {};

  for (const sectionDefinition of maskDefinition.sections) {
    if (sectionDefinition.type === 'fixed') {
      const sectionFixedDefinition = sectionDefinition as MaskSectionFixedDefinition;
      const sectionFixedDerivedState = getFixedSectionDerivedState(maskState, sectionFixedDefinition, sectionsDeriveState.length);
      sectionsDeriveState.push(sectionFixedDerivedState);

      displaySpace.push(...sectionFixedDerivedState.displaySpace);
    } else {
      valueIndex += 1;

      const sectionInputDefinition = sectionDefinition as MaskSectionInputDefinition;
      const sectionInputDerivedState = getInputSectionDerivedState(maskState, sectionInputDefinition, sectionsDeriveState.length, valueIndex);
      sectionsDeriveState.push(sectionInputDerivedState);

      syntacticValidationStatus[sectionDefinition.slug] = sectionInputDerivedState.syntacticValidationStatus;

      valueSpace.push(...sectionInputDerivedState.valueSpace);
      displaySpace.push(...sectionInputDerivedState.displaySpace);

      for (const [valueSpaceCoordinates, displaySpaceCoordinates] of sectionInputDerivedState.valueSpaceToDisplaySpaceMap) {
        valueSpaceToDisplaySpaceMap.set(valueSpaceCoordinates, displaySpaceCoordinates);
      }

      for (const [displaySpaceCoordinates, valueSpaceCoordinates] of sectionInputDerivedState.displaySpaceToValueSpaceMap) {
        displaySpaceToValueSpaceMap.set(displaySpaceCoordinates, valueSpaceCoordinates);
      }
    }
  }

  const [semanticValidationStatus, semanticValidationMessage] = maskDefinition.semanticValidationFn
    ? maskDefinition.semanticValidationFn(maskState.values)
    : [undefined, ''];

  const validatedStringEncodedValue = maskDefinition.encodeValidatedValue(maskState.values);

  for (const sectionDeriveState of sectionsDeriveState) {
    if (sectionDeriveState.type === 'fixed') {
      const sectionFixedDerivedState = sectionDeriveState as MaskSectionFixedDerivedState;

      const sectionInputHTMLString = getFixedSectionHTMLStrings(
        maskState,
        sectionFixedDerivedState,
        valueSpaceToDisplaySpaceMap,
        semanticValidationStatus,
      );

      inputHTMLStringParts.push(sectionInputHTMLString);
    } else {
      valueIndex += 1;

      const sectionInputDerivedState = sectionDeriveState as MaskSectionInputDerivedState;

      const sectionInputHTMLString = getInputSectionHTMLStrings(
        maskState,
        sectionInputDerivedState,
        valueSpaceToDisplaySpaceMap,
        displaySpaceToValueSpaceMap,
        semanticValidationStatus,
      );

      inputHTMLStringParts.push(sectionInputHTMLString);
    }
  }

  const encodedState = encodeState(maskState, maskDefinition);
  const textInputDisplayString = sectionsDeriveState.map((section) => section.textInputDisplayString).join('');
  const textInputDisplayStringWithSelection = getTextInputDisplayStringWithSelection(maskState, sectionsDeriveState, valueSpaceToDisplaySpaceMap);

  const [caretValueSpaceIndex, caretValueSpacePosition] = maskState.caretPositionInValueSpace.split(':').map((x) => Number.parseInt(x));
  const [caretDisplaySpaceIndex, caretDisplaySpacePosition] = (valueSpaceToDisplaySpaceMap.get(maskState.caretPositionInValueSpace) ?? '-1:-1')
    .split(':')
    .map((x) => Number.parseInt(x));

  return {
    validatedStringEncodedValue,
    encodedState,
    textInputDisplayString,
    textInputDisplayStringWithSelection,

    caretValueSpaceIndex,
    caretValueSpacePosition,

    caretDisplaySpaceIndex,
    caretDisplaySpacePosition,

    syntacticValidationStatus,
    semanticValidationStatus,
    semanticValidationMessage,

    valueSpace,
    displaySpace,
    valueSpaceToDisplaySpaceMap,
    displaySpaceToValueSpaceMap,

    inputHTMLString: inputHTMLStringParts.join(''),

    sections: sectionsDeriveState,
  };
};

export const validationFnFromRegexString = (regexString: string): ((sectionValue: string) => boolean) => {
  const regex = new RegExp(regexString);

  return (sectionValue: string) => regex.test(sectionValue);
};

const setMaskStateCaretAndSelection = (maskState: MaskState, caretPosition: string, selectionEndPosition?: string): MaskState => {
  return {
    ...maskState,
    caretPositionInValueSpace: caretPosition,
    selectionEndPositionInValueSpace: selectionEndPosition ?? caretPosition,
  };
};

export const updateMaskStateValues = (lastState: MaskState, values: Record<string, string[]>): MaskState => {
  return setMaskStateCaretAndSelection(getInitialMaskState(values), lastState.caretPositionInValueSpace, lastState.selectionEndPositionInValueSpace);
};

export const updateMaskStateCaretAndSelection = (lastState: MaskState, caretPosition: string, selectionEndPosition?: string): MaskState => {
  return setMaskStateCaretAndSelection(lastState, caretPosition, selectionEndPosition);
};

export function encodeState(state: MaskState, maskDefinition: MaskDefinition): string {
  const encodedStateParts: string[] = [];

  const [caretSectionIndex, caretPosition] = state.caretPositionInValueSpace.split(':').map((x) => Number.parseInt(x));
  const [selectionEndSectionIndex, selectionEndPosition] = state.selectionEndPositionInValueSpace.split(':').map((x) => Number.parseInt(x));

  let i = -1;

  for (const section of maskDefinition.sections.values()) {
    if (section.type !== 'input') {
      continue;
    } else {
      i += 1;
    }

    const sectionCharacters = state.values[section.slug] ?? [];

    if (i !== caretSectionIndex && i !== selectionEndSectionIndex) {
      encodedStateParts.push(sectionCharacters.join(''));
    } else if (i === caretSectionIndex && i !== selectionEndSectionIndex) {
      encodedStateParts.push([...sectionCharacters.slice(0, caretPosition), '[', ...sectionCharacters.slice(caretPosition)].join(''));
    } else if (i !== caretSectionIndex && i === selectionEndSectionIndex) {
      encodedStateParts.push([...sectionCharacters.slice(0, selectionEndPosition), ']', ...sectionCharacters.slice(selectionEndPosition)].join(''));
    } else if (caretPosition <= selectionEndPosition) {
      encodedStateParts.push(
        [
          ...sectionCharacters.slice(0, caretPosition),
          '[',
          ...sectionCharacters.slice(caretPosition, selectionEndPosition),
          ']',
          ...sectionCharacters.slice(selectionEndPosition),
        ].join(''),
      );
    } else if (caretPosition > selectionEndPosition) {
      encodedStateParts.push(
        [
          ...sectionCharacters.slice(0, selectionEndPosition),
          ']',
          ...sectionCharacters.slice(selectionEndPosition, caretPosition),
          '[',
          ...sectionCharacters.slice(caretPosition),
        ].join(''),
      );
    }
  }

  return encodedStateParts.join('|');
}

export function getTextInputDisplayStringWithSelection(
  state: MaskState,
  sectionsDeriveState: MaskSectionDerivedState[],
  valueSpaceToDisplaySpaceMap: Map<string, string>,
): string {
  const textInputDisplayStringWithSelectionParts: string[] = [];

  const caretPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(state.caretPositionInValueSpace) ?? '-1:-1';
  const selectionEndPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(state.selectionEndPositionInValueSpace) ?? '-1:-1';

  const [caretSectionIndex, caretPosition] = caretPositionInDisplaySpace.split(':').map((x) => Number.parseInt(x));
  const [selectionEndSectionIndex, selectionEndPosition] = selectionEndPositionInDisplaySpace.split(':').map((x) => Number.parseInt(x));

  for (const [i, section] of sectionsDeriveState.entries()) {
    if (i !== caretSectionIndex && i !== selectionEndSectionIndex) {
      textInputDisplayStringWithSelectionParts.push(section.textInputDisplayString);
    } else if (i === caretSectionIndex && i !== selectionEndSectionIndex) {
      textInputDisplayStringWithSelectionParts.push(
        section.textInputDisplayString.substring(0, caretPosition) + '[' + section.textInputDisplayString.substring(caretPosition),
      );
    } else if (i !== caretSectionIndex && i === selectionEndSectionIndex) {
      textInputDisplayStringWithSelectionParts.push(
        section.textInputDisplayString.substring(0, caretPosition) + '[' + section.textInputDisplayString.substring(caretPosition),
      );
    } else if (caretPosition <= selectionEndPosition) {
      textInputDisplayStringWithSelectionParts.push(
        section.textInputDisplayString.substring(0, caretPosition) +
          '[' +
          section.textInputDisplayString.substring(caretPosition, selectionEndPosition) +
          ']' +
          section.textInputDisplayString.substring(selectionEndPosition),
      );
    } else if (caretPosition > selectionEndPosition) {
      textInputDisplayStringWithSelectionParts.push(
        section.textInputDisplayString.substring(0, selectionEndPosition) +
          ']' +
          section.textInputDisplayString.substring(selectionEndPosition, caretPosition) +
          '[' +
          section.textInputDisplayString.substring(caretPosition),
      );
    }
  }

  return textInputDisplayStringWithSelectionParts.join('|');
}
