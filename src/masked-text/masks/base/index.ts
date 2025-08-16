import type {
  MaskCharacter,
  MaskDefinition,
  MaskDerivedState,
  MaskSectionDefinition,
  MaskSectionDerivedState,
  MaskSectionFixedDefinition,
  MaskSectionFixedDerivedState,
  MaskSectionInputDefinition,
  MaskSectionInputDerivedState,
  MaskState,
} from './types';
import { compareSpaceCoordinates, splitStringIntoGraphemes } from '@/masked-text/masks/base/helper.ts';

export type {
  MaskSectionFixedDefinition,
  MaskSectionInputDefinition,
  MaskCharacter,
  MaskSectionFixedDerivedState,
  MaskSectionInputDerivedState,
  MaskSectionDefinition,
  MaskSectionDerivedState,
  MaskDefinition,
  MaskState,
  MaskDerivedState,
};

// local types
type InputHTMLStringPart = {
  cls: string;
  dataAttrs?: { [key: string]: string };
  value: string;
};

export const MaskSectionFixed = (mask: string, skipKeys?: string[]): MaskSectionFixedDefinition => ({
  type: 'fixed',
  mask,
  skipKeys,
});

export const MaskSectionInput = (
  slug: string,
  options: {
    maskingFn: (sectionValue: string) => MaskCharacter[];

    inputBehavior?: 'replace' | 'insert';
    alignment?: 'left' | 'right';

    inputCharacterFilterFn?: (inputCharacter: string) => boolean;
    inputCharacterSubstitutionFn?: (inputCharacter: string) => string;

    syntacticValidationFn?: (sectionValue: string) => boolean;
    semanticValidationFn?: (values: Record<string, string>, sectionSlug: string) => boolean | string;

    spinUpFn?: (values: Record<string, string>, sectionSlug: string, metaPressed: boolean, shiftPressed: boolean, altPressed: boolean) => string;
    spinDownFn?: (values: Record<string, string>, sectionSlug: string, metaPressed: boolean, shiftPressed: boolean, altPressed: boolean) => string;

    sectionCommitValueTransformation?: (sectionValue: string) => string;

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

export const getInitialMaskState = (values: Record<string, string>): MaskState => {
  return {
    values,

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
): [string, string] => {
  const caretPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(maskState.caretPositionInValueSpace);
  const selectionEndPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(maskState.selectionEndPositionInValueSpace);

  const caretRelativePosition = compareSpaceCoordinates(`${maskSection.index}:0`, caretPositionInDisplaySpace) || -1;
  const selectionEndRelativePosition = compareSpaceCoordinates(`${maskSection.index}:0`, selectionEndPositionInDisplaySpace) || -1;

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

  return [isBeforeCursor ? htmlString : '', !isBeforeCursor ? htmlString : ''];
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
  const value = maskState.values[sectionDefinition.slug] || '';
  const syntacticValidationStatus = sectionDefinition.syntacticValidationFn ? sectionDefinition.syntacticValidationFn(value) : undefined;

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

      posValueSpace += maskChar.char.length;

      const currentValueSpaceCoordinates = `${valueIndex}:${posValueSpace}`;

      valueSpace.push(currentValueSpaceCoordinates);
      valueSpaceToDisplaySpaceMap.set(currentValueSpaceCoordinates, currentDisplaySpaceCoordinates);
      displaySpaceToValueSpaceMap.set(currentDisplaySpaceCoordinates, currentValueSpaceCoordinates);
    }
  }

  if (value === '') {
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
  const { cls, dataAttrs, value } = inputHTMLStringPart;

  const dataAttrsStringString = inputHTMLStringPart.dataAttrs
    ? Object.entries(inputHTMLStringPart.dataAttrs)
        .map(([key, value]) => ` data-${key}="${value}"`)
        .join('')
    : '';
  const clsStringString = cls.length > 0 ? ` class="${cls}"` : '';

  return `<span${dataAttrsStringString}${clsStringString}>${value}</span>`;
};

const getInputSectionHTMLStrings = (
  maskState: MaskState,
  maskSection: MaskSectionInputDerivedState,
  valueSpaceToDisplaySpaceMap: Map<string, string>,
  displaySpaceToValueSpaceMap: Map<string, string>,
  semanticValidationStatus: boolean | undefined,
): [string, string, string[]] => {
  const preInputHTMLStringParts: InputHTMLStringPart[] = [];
  const postInputHTMLStringParts: InputHTMLStringPart[] = [];
  const inputFieldClasses: string[] = [];

  const caretPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(maskState.caretPositionInValueSpace);
  const selectionEndPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(maskState.selectionEndPositionInValueSpace);

  let posDisplaySpace = 0;

  for (const [i, maskChar] of maskSection.maskCharacters.entries()) {
    const currentDisplaySpaceCoordinatesLeft = `${maskSection.index}:${posDisplaySpace}`;
    const currentValueSpaceCoordinatesLeft = displaySpaceToValueSpaceMap.get(currentDisplaySpaceCoordinatesLeft);

    posDisplaySpace += maskChar.char.length;

    const currentDisplaySpaceCoordinatesRight = `${maskSection.index}:${posDisplaySpace}`;
    const currentValueSpaceCoordinatesRight = displaySpaceToValueSpaceMap.get(currentDisplaySpaceCoordinatesRight);

    const caretRelativePosition = compareSpaceCoordinates(currentDisplaySpaceCoordinatesRight, caretPositionInDisplaySpace) || -1;
    const selectionEndRelativePosition = compareSpaceCoordinates(currentDisplaySpaceCoordinatesRight, selectionEndPositionInDisplaySpace) || -1;

    const isBeforeCursor: boolean = caretRelativePosition <= 0;
    const isBeforeSelectionEnd: boolean = selectionEndRelativePosition <= 0;

    const htmlStringParts = isBeforeCursor ? preInputHTMLStringParts : postInputHTMLStringParts;
    const htmlStringPartClass =
      (maskChar.type === 'mask' ? 'mask-char-mask' : 'mask-char-value') + (isBeforeCursor !== isBeforeSelectionEnd ? ' selected' : '');

    const dataAttrs: { [key: string]: string } = {};

    if (currentValueSpaceCoordinatesLeft) {
      dataAttrs['value-pos-left'] = currentValueSpaceCoordinatesLeft;
    }

    if (currentValueSpaceCoordinatesRight) {
      dataAttrs['value-pos-right'] = currentValueSpaceCoordinatesRight;
    }

    htmlStringParts.push({
      cls: htmlStringPartClass,
      dataAttrs,
      value: maskChar.char,
    });
  }

  const caretPositionInDisplayState = valueSpaceToDisplaySpaceMap.get(maskState.caretPositionInValueSpace) || '-1:-1';
  const [caretPositionInDisplayStateSectionIndex, caretPositionInDisplayStatePosition] = caretPositionInDisplayState
    .split(':')
    .map((x) => Number.parseInt(x));

  const isActiveSection = caretPositionInDisplayStateSectionIndex === maskSection.index;

  const classes: string[] = ['section-input'];

  if (isActiveSection) {
    classes.push('active');
    inputFieldClasses.push('active');
  }

  if (semanticValidationStatus === false) {
    classes.push('semantic-error');
    inputFieldClasses.push('semantic-error');
  }

  if (maskSection.syntacticValidationStatus === false) {
    classes.push('syntax-error');
    inputFieldClasses.push('syntax-error');
  }

  const preInputHTMLString =
    preInputHTMLStringParts.length > 0
      ? `<div class="${classes.join(' ')}">${preInputHTMLStringParts.map((inputHTMLStringPart) => inputHTMLStringPartToHTML(inputHTMLStringPart)).join('')}</div>`
      : '';

  const postInputHTMLString =
    postInputHTMLStringParts.length > 0
      ? `<div class="${classes.join(' ')}"">${postInputHTMLStringParts.map((inputHTMLStringPart) => inputHTMLStringPartToHTML(inputHTMLStringPart)).join('')}</div>`
      : '';

  return [preInputHTMLString, postInputHTMLString, inputFieldClasses];
};

export const getDerivedState = (maskState: MaskState, maskDefinition: MaskDefinition): MaskDerivedState => {
  const sectionsDeriveState: MaskSectionDerivedState[] = [];

  let valueIndex = -1;

  const preInputHTMLStringParts = [];
  const postInputHTMLStringParts = [];
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

  const inputFieldClasses: Set<string> = new Set();
  const [semanticValidationStatus, semanticValidationMessage] = maskDefinition.semanticValidationFn
    ? maskDefinition.semanticValidationFn(maskState.values)
    : [undefined, ''];

  const validatedStringEncodedValue = maskDefinition.encodeValidatedValue(maskState.values);

  for (const sectionDeriveState of sectionsDeriveState) {
    if (sectionDeriveState.type === 'fixed') {
      const sectionFixedDerivedState = sectionDeriveState as MaskSectionFixedDerivedState;

      const [preInputHTMLString, postInputHTMLString] = getFixedSectionHTMLStrings(
        maskState,
        sectionFixedDerivedState,
        valueSpaceToDisplaySpaceMap,
        semanticValidationStatus,
      );

      preInputHTMLStringParts.push(preInputHTMLString);
      postInputHTMLStringParts.push(postInputHTMLString);
    } else {
      valueIndex += 1;

      const sectionInputDerivedState = sectionDeriveState as MaskSectionInputDerivedState;

      const [sectionPreInputHTMLString, sectionPostInputHTMLString, sectionInputFieldClasses] = getInputSectionHTMLStrings(
        maskState,
        sectionInputDerivedState,
        valueSpaceToDisplaySpaceMap,
        displaySpaceToValueSpaceMap,
        semanticValidationStatus,
      );

      preInputHTMLStringParts.push(sectionPreInputHTMLString);
      postInputHTMLStringParts.push(sectionPostInputHTMLString);
      sectionInputFieldClasses.forEach((inputFieldClass) => inputFieldClasses.add(inputFieldClass));
    }
  }

  const encodedState = encodeState(maskState, maskDefinition);
  const textInputDisplayString = sectionsDeriveState.map((section) => section.textInputDisplayString).join('');
  const textInputDisplayStringWithSelection = getTextInputDisplayStringWithSelection(maskState, sectionsDeriveState, valueSpaceToDisplaySpaceMap);

  const [caretValueSpaceIndex, caretValueSpacePosition] = maskState.caretPositionInValueSpace.split(':').map((x) => Number.parseInt(x));
  const [caretDisplaySpaceIndex, caretDisplaySpacePosition] = (valueSpaceToDisplaySpaceMap.get(maskState.caretPositionInValueSpace) || '-1:-1')
    .split(':')
    .map((x) => Number.parseInt(x));

  return {
    encodedState,
    textInputDisplayString,
    textInputDisplayStringWithSelection,

    inputFieldClasses: [...inputFieldClasses.values()],
    syntacticValidationStatus,
    semanticValidationStatus,
    semanticValidationMessage,

    valueSpace,
    displaySpace,
    valueSpaceToDisplaySpaceMap,
    displaySpaceToValueSpaceMap,

    caretValueSpaceIndex,
    caretValueSpacePosition,

    caretDisplaySpaceIndex,
    caretDisplaySpacePosition,

    preInputHTMLString: preInputHTMLStringParts.join(''),
    postInputHTMLString: postInputHTMLStringParts.join(''),

    sections: sectionsDeriveState,

    validatedStringEncodedValue,
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

export const updateMaskStateValues = (lastState: MaskState, values: Record<string, string>): MaskState => {
  return setMaskStateCaretAndSelection(getInitialMaskState(values), lastState.caretPositionInValueSpace, lastState.selectionEndPositionInValueSpace);
};

export const updateMaskStateCaretAndSelection = (lastState: MaskState, caretPosition: string, selectionEndPosition?: string): MaskState => {
  return setMaskStateCaretAndSelection(lastState, caretPosition, selectionEndPosition);
};

export function encodeState(state: MaskState, maskDefinition: MaskDefinition): string {
  const encodedStateParts: string[] = [];

  const [caretSectionIndex, caretPosition] = state.caretPositionInValueSpace.split(':').map((x) => Number.parseInt(x));
  const [selectionEndSectionIndex, selectionEndPosition] = state.selectionEndPositionInValueSpace.split(':').map((x) => Number.parseInt(x));

  for (const [i, section] of maskDefinition.sections.entries()) {
    if (section.type !== 'input') {
      continue;
    }

    const value = state.values[section.slug] || '';

    if (i !== caretSectionIndex && i !== selectionEndSectionIndex) {
      encodedStateParts.push(value);
    } else if (i === caretSectionIndex && i !== selectionEndSectionIndex) {
      encodedStateParts.push(value.substring(0, caretPosition) + '[' + value.substring(caretPosition));
    } else if (i !== caretSectionIndex && i === selectionEndSectionIndex) {
      encodedStateParts.push(value.substring(0, selectionEndPosition) + ']' + value.substring(selectionEndPosition));
    } else if (caretPosition <= selectionEndPosition) {
      encodedStateParts.push(
        value.substring(0, caretPosition) + '[' + value.substring(caretPosition, selectionEndPosition) + ']' + value.substring(selectionEndPosition),
      );
    } else if (caretPosition > selectionEndPosition) {
      encodedStateParts.push(
        value.substring(0, selectionEndPosition) + ']' + value.substring(selectionEndPosition, caretPosition) + '[' + value.substring(caretPosition),
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

  const caretPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(state.caretPositionInValueSpace) || '-1:-1';
  const selectionEndPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(state.selectionEndPositionInValueSpace) || '-1:-1';

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
