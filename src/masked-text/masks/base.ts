import type { Ref } from 'vue';

export interface MaskSectionFixedDefinition {
  type: 'fixed';
  mask: string;
  skipKeys?: string[];
}

export const MaskSectionFixed = (mask: string, skipKeys?: string[]): MaskSectionFixedDefinition => ({
  type: 'fixed',
  mask,
  skipKeys,
});

export interface MaskSectionInputDefinition {
  type: 'input';
  inputBehavior: 'replace' | 'insert';
  alignment: 'left' | 'right';
  maskingFn: (sectionValue: string) => MaskCharacter[];
  validationFn: (sectionValue: string) => boolean;
  maxLength: number;
}

export const MaskSectionInput = (
  inputBehavior: 'replace' | 'insert',
  alignment: 'left' | 'right',
  maskingFn: (sectionValue: string) => MaskCharacter[],
  validationFn: (sectionValue: string) => boolean,
  maxLength: number,
): MaskSectionInputDefinition => ({
  type: 'input',
  inputBehavior,
  alignment,
  maskingFn,
  validationFn,
  maxLength,
});

export interface MaskSectionInput extends MaskSectionInputDefinition {
  valueIndex: number;
}

export type MaskCharacter = {
  char: string;
  type: 'mask' | 'value';
};

export type MaskSectionFixedDerivedState = {
  type: 'fixed';
  index: number;

  textInputDisplayString: string;

  displaySpace: string[];
};

export type MaskSectionInputDerivedState = {
  type: 'input';
  alignment: 'left' | 'right';
  index: number;
  value: string;
  valueIndex: number;

  maskCharacters: MaskCharacter[];
  textInputDisplayString: string;

  valueSpace: string[];
  displaySpace: string[];

  valueSpaceToDisplaySpaceMap: Map<string, string>;
  displaySpaceToValueSpaceMap: Map<string, string>;
};

export type MaskSectionDefinition = MaskSectionFixedDefinition | MaskSectionInputDefinition;
export type MaskSectionDerivedState = MaskSectionFixedDerivedState | MaskSectionInputDerivedState;

export type MaskDefinition = {
  sections: MaskSectionDefinition[];
};

export type MaskState = {
  values: string[];

  caretPositionInValueSpace: string;
  selectionEndPositionInValueSpace: string;
};

export const getInitialMaskState = (values: string[]): MaskState => {
  return {
    values,

    caretPositionInValueSpace: '0:0',
    selectionEndPositionInValueSpace: '0:0',
  };
};

export type MaskDerivedState = {
  encodedState: string;

  valueSpace: string[];
  displaySpace: string[];
  valueSpaceToDisplaySpaceMap: Map<string, string>;
  displaySpaceToValueSpaceMap: Map<string, string>;

  textInputDisplayString: string;

  preInputHTMLString: string;
  postInputHTMLString: string;

  sections: MaskSectionDerivedState[];
};

const compareSpaceCoordinates = (a: string | undefined, b: string | undefined): number | undefined => {
  if (a === undefined || b === undefined) {
    return undefined;
  }

  const [aSection, aPosition] = a.split(':').map((x) => Number.parseInt(x));
  const [bSection, bPosition] = b.split(':').map((x) => Number.parseInt(x));

  if (aSection < bSection) {
    return -1;
  } else if (aSection > bSection) {
    return 1;
  } else {
    return aPosition - bPosition;
  }
};

const getFixedSectionDerivedState = (
  maskState: MaskState,
  sectionDefinition: MaskSectionFixedDefinition,
  index: number,
): MaskSectionFixedDerivedState => {
  const localDisplaySpace: string[] = [`${index}:0`];

  const chars: string[] = [...sectionDefinition.mask];

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
): [string, string] => {
  const caretPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(maskState.caretPositionInValueSpace);
  const selectionEndPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(maskState.selectionEndPositionInValueSpace);

  const caretRelativePosition = compareSpaceCoordinates(`${maskSection.index}:0`, caretPositionInDisplaySpace) || -1;
  const selectionEndRelativePosition = compareSpaceCoordinates(`${maskSection.index}:0`, selectionEndPositionInDisplaySpace) || -1;

  const isBeforeCursor: boolean = caretRelativePosition < 0;
  const isBeforeSelectionEnd: boolean = selectionEndRelativePosition < 0;

  const htmlString: string = `<span class="fixed-mask ${isBeforeCursor !== isBeforeSelectionEnd ? 'selected' : ''}">${maskSection.textInputDisplayString}</span>`;

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
  const value = maskState.values[valueIndex];

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

  return {
    type: 'input',
    alignment: sectionDefinition.alignment,
    index,
    valueIndex,
    value,

    maskCharacters,
    textInputDisplayString: maskCharacters.map((maskChar: MaskCharacter) => maskChar.char).join(''),

    valueSpace: valueSpace,
    displaySpace: displaySpace,

    valueSpaceToDisplaySpaceMap,
    displaySpaceToValueSpaceMap,
  };
};

const getInputSectionHTMLStrings = (
  maskState: MaskState,
  maskSection: MaskSectionInputDerivedState,
  valueSpaceToDisplaySpaceMap: Map<string, string>,
): [string, string] => {
  const preInputHTMLStringParts: {
    cls: string;
    value: string;
  }[] = [];

  const postInputHTMLStringParts: {
    cls: string;
    value: string;
  }[] = [];

  const caretPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(maskState.caretPositionInValueSpace);
  const selectionEndPositionInDisplaySpace = valueSpaceToDisplaySpaceMap.get(maskState.selectionEndPositionInValueSpace);

  let posDisplaySpace = 0;

  for (const [i, maskChar] of maskSection.maskCharacters.entries()) {
    posDisplaySpace += maskChar.char.length;

    const caretRelativePosition = compareSpaceCoordinates(`${maskSection.index}:${posDisplaySpace}`, caretPositionInDisplaySpace) || -1;
    const selectionEndRelativePosition = compareSpaceCoordinates(`${maskSection.index}:${posDisplaySpace}`, selectionEndPositionInDisplaySpace) || -1;

    const isBeforeCursor: boolean = caretRelativePosition <= 0;
    const isBeforeSelectionEnd: boolean = selectionEndRelativePosition <= 0;

    const htmlStringParts = isBeforeCursor ? preInputHTMLStringParts : postInputHTMLStringParts;
    const htmlStringPartClassPrev = htmlStringParts.length === 0 ? '' : htmlStringParts[htmlStringParts.length - 1].cls;
    const htmlStringPartClass =
      maskChar.type === 'mask' ? 'mask-char-mask' : 'mask-char-value' + (isBeforeCursor !== isBeforeSelectionEnd ? ' selected' : '');

    if (htmlStringPartClass !== htmlStringPartClassPrev) {
      htmlStringParts.push({
        cls: htmlStringPartClass,
        value: maskChar.char,
      });
    } else {
      htmlStringParts[htmlStringParts.length - 1].value += maskChar.char;
    }
  }

  const isActiveSection = maskState.caretPositionInValueSpace.startsWith(maskSection.index.toString());
  const preInputHTMLString =
    preInputHTMLStringParts.length > 0
      ? `<span class="section-input ${isActiveSection ? 'active' : ''}">${preInputHTMLStringParts.map(({ cls, value }) => `<span class="${cls}">${value}</span>`).join('')}</span>`
      : '';
  const postInputHTMLString =
    postInputHTMLStringParts.length > 0
      ? `<span class="section-input ${isActiveSection ? 'active' : ''}">${postInputHTMLStringParts.map(({ cls, value }) => `<span class="${cls}">${value}</span>`).join('')}</span>`
      : '';

  return [preInputHTMLString, postInputHTMLString];
};

export const getDerivedState = (maskState: MaskState, maskDefinition: MaskDefinition): MaskDerivedState => {
  const sectionsDeriveState: MaskSectionDerivedState[] = [];

  let valueIndex = -1;

  const preInputHTMLStringParts = [];
  const postInputHTMLStringParts = [];
  const valueSpace: string[] = [];
  const displaySpace: string[] = [];
  const valueSpaceToDisplaySpaceMap = new Map();
  const displaySpaceToValueSpaceMap = new Map();

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

  for (const sectionDeriveState of sectionsDeriveState) {
    if (sectionDeriveState.type === 'fixed') {
      const sectionFixedDerivedState = sectionDeriveState as MaskSectionFixedDerivedState;

      const [preInputHTMLString, postInputHTMLString] = getFixedSectionHTMLStrings(maskState, sectionFixedDerivedState, valueSpaceToDisplaySpaceMap);

      preInputHTMLStringParts.push(preInputHTMLString);
      postInputHTMLStringParts.push(postInputHTMLString);
    } else {
      valueIndex += 1;

      const sectionInputDerivedState = sectionDeriveState as MaskSectionInputDerivedState;

      const [preInputHTMLString, postInputHTMLString] = getInputSectionHTMLStrings(maskState, sectionInputDerivedState, valueSpaceToDisplaySpaceMap);
      preInputHTMLStringParts.push(preInputHTMLString);
      postInputHTMLStringParts.push(postInputHTMLString);
    }
  }

  const encodedState = encodeState(maskState);

  return {
    encodedState,

    valueSpace,
    displaySpace,
    valueSpaceToDisplaySpaceMap,
    displaySpaceToValueSpaceMap,

    textInputDisplayString: sectionsDeriveState.map((section) => section.textInputDisplayString).join(),
    preInputHTMLString: preInputHTMLStringParts.join(''),
    postInputHTMLString: postInputHTMLStringParts.join(''),

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

export const updateMaskStateValues = (lastState: MaskState, values: string[]): MaskState => {
  return setMaskStateCaretAndSelection(getInitialMaskState(values), lastState.caretPositionInValueSpace, lastState.selectionEndPositionInValueSpace);
};

export const updateMaskStateCaretAndSelection = (lastState: MaskState, caretPosition: string, selectionEndPosition?: string): MaskState => {
  return setMaskStateCaretAndSelection(lastState, caretPosition, selectionEndPosition);
};

const findSection = (
  derivedState: MaskDerivedState,
  options: {
    startIndex: number;
    direction: 'left' | 'right';
    alignment?: 'left' | 'right';
    type?: 'input' | 'fixed';
    includeStartIndex?: boolean;
  },
): MaskSectionDerivedState | undefined => {
  const includeStartIndex = options.includeStartIndex ?? false;
  const searchStartIndex =
    options.direction === 'right' ? options.startIndex + (includeStartIndex ? 0 : 1) : options.startIndex - (includeStartIndex ? 0 : 1);

  if (
    options.startIndex < 0 ||
    options.startIndex >= derivedState.sections.length ||
    searchStartIndex < 0 ||
    searchStartIndex >= derivedState.sections.length
  ) {
    return undefined;
  }

  const needleSection = derivedState.sections[options.startIndex];

  if (options.direction === 'right') {
    for (let i = searchStartIndex; i < derivedState.sections.length; i++) {
      const candidateSection = derivedState.sections[i];

      if (
        (!options.type || candidateSection.type === options.type) &&
        (!options.alignment || (candidateSection.type === 'input' && candidateSection.alignment === options.alignment))
      ) {
        return { ...candidateSection };
      }
    }
  } else {
    for (let i = searchStartIndex; i >= 0; i--) {
      const candidateSection = derivedState.sections[i];

      if (
        (!options.type || candidateSection.type === options.type) &&
        (!options.alignment || (candidateSection.type === 'input' && candidateSection.alignment === options.alignment))
      ) {
        return { ...candidateSection };
      }
    }
  }

  return undefined;
};

export const findClosestValidValueSpaceCoordinates = (derivedState: MaskDerivedState, searchCoordinates: string): string | undefined => {
  const [searchCoordinatesSectionIndex, searchCoordinatesPosition] = searchCoordinates.split(':').map((x) => Number.parseInt(x));

  if (searchCoordinatesSectionIndex >= 0 && searchCoordinatesSectionIndex < derivedState.sections.length) {
    const section = derivedState.sections[searchCoordinatesSectionIndex];

    if (section.type === 'input') {
      const validValueSpaceSortedByDistance = section.valueSpace
        .map((x) => x.split(':').map((y) => Number.parseInt(y)))
        .sort((a, b) => Math.abs(a[1] - searchCoordinatesPosition) - Math.abs(b[1] - searchCoordinatesPosition));

      if (validValueSpaceSortedByDistance) {
        return `${searchCoordinatesSectionIndex}:${validValueSpaceSortedByDistance[0]}`;
      }
    } else {
      const firstLeftInputSection = findSection(derivedState, {
        startIndex: searchCoordinatesSectionIndex,
        direction: 'left',
        type: 'input',
        includeStartIndex: true,
      });

      const firstRightInputSection = findSection(derivedState, {
        startIndex: searchCoordinatesSectionIndex,
        direction: 'right',
        type: 'input',
        includeStartIndex: true,
      });

      if (firstLeftInputSection && firstLeftInputSection.type === 'input') {
        return firstLeftInputSection.valueSpace[firstLeftInputSection.valueSpace.length - 1];
      }

      if (firstRightInputSection && firstRightInputSection.type === 'input') {
        return firstRightInputSection.valueSpace[0];
      }
    }
  }

  return undefined;
};

export function encodeState(state: MaskState): string {
  const encodedStateParts: string[] = [];

  const [caretSectionIndex, caretPosition] = state.caretPositionInValueSpace.split(':').map((x) => Number.parseInt(x));
  const [selectionEndSectionIndex, selectionEndPosition] = state.selectionEndPositionInValueSpace.split(':').map((x) => Number.parseInt(x));

  for (const [i, value] of state.values.entries()) {
    if (i !== caretSectionIndex && i !== selectionEndSectionIndex) {
      encodedStateParts.push(value);
    } else if (i === caretSectionIndex && i !== selectionEndSectionIndex) {
      encodedStateParts.push(value.substring(0, caretPosition) + '[' + value.substring(caretPosition));
    } else if (i !== caretSectionIndex && i === selectionEndSectionIndex) {
      encodedStateParts.push(value.substring(0, caretPosition) + '[' + value.substring(caretPosition));
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

  return encodedStateParts.join('.');
}
