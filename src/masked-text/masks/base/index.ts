import type {
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
  PatchOperation,
  PatchOperationMoveCursor,
  PatchOperationSetCursorPosition,
  PatchOperationClearSelection,
  PatchOperationDeleteSelection,
} from './types';

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

export const getInitialMaskState = (values: string[]): MaskState => {
  return {
    values,

    caretPositionInValueSpace: '0:0',
    selectionEndPositionInValueSpace: '0:0',
  };
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

  const htmlString: string = `<div class="fixed-mask ${isBeforeCursor !== isBeforeSelectionEnd ? 'selected' : ''}">${maskSection.textInputDisplayString}</div>`;

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
): [string, string] => {
  const preInputHTMLStringParts: InputHTMLStringPart[] = [];
  const postInputHTMLStringParts: InputHTMLStringPart[] = [];

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
  const preInputHTMLString =
    preInputHTMLStringParts.length > 0
      ? `<div class="section-input ${isActiveSection ? 'active' : ''}">${preInputHTMLStringParts.map((inputHTMLStringPart) => inputHTMLStringPartToHTML(inputHTMLStringPart)).join('')}</div>`
      : '';
  const postInputHTMLString =
    postInputHTMLStringParts.length > 0
      ? `<div class="section-input ${isActiveSection ? 'active' : ''}">${postInputHTMLStringParts.map((inputHTMLStringPart) => inputHTMLStringPartToHTML(inputHTMLStringPart)).join('')}</div>`
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

      const [preInputHTMLString, postInputHTMLString] = getInputSectionHTMLStrings(
        maskState,
        sectionInputDerivedState,
        valueSpaceToDisplaySpaceMap,
        displaySpaceToValueSpaceMap,
      );

      preInputHTMLStringParts.push(preInputHTMLString);
      postInputHTMLStringParts.push(postInputHTMLString);
    }
  }

  const encodedState = encodeState(maskState);
  const textInputDisplayString = sectionsDeriveState.map((section) => section.textInputDisplayString).join('');
  const textInputDisplayStringWithSelection = getTextInputDisplayStringWithSelection(maskState, sectionsDeriveState, valueSpaceToDisplaySpaceMap);

  return {
    encodedState,
    textInputDisplayString,
    textInputDisplayStringWithSelection,

    valueSpace,
    displaySpace,
    valueSpaceToDisplaySpaceMap,
    displaySpaceToValueSpaceMap,

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

export const determinePatchOperationFromKeyboardEvent = (
  type: 'keydown' | 'keyup ',
  event: KeyboardEvent,
  state: MaskState,
  maskDefinition: MaskDefinition,
  currentDerivedState?: MaskDerivedState,
): PatchOperation[] | undefined => {
  // returns array of patch operations to apply to state. Special return values:
  // - `[]` - no change, but stop event propagation
  // - `undefined` - no change, but let event propagate

  if (!currentDerivedState) {
    currentDerivedState = getDerivedState(state, maskDefinition);
  }

  const maintainSelectionKeyPressed = event.shiftKey;
  const skipSectionLevelKeyPressed = !navigator.userAgent.includes('Mac') ? event.ctrlKey : event.altKey;
  const skipLineLevelKeyPressed = !navigator.userAgent.includes('Mac') ? false : event.metaKey;
  const selectionIsPresent = state.selectionEndPositionInValueSpace !== state.caretPositionInValueSpace;

  if (type === 'keydown') {
    if (event.key === 'Backspace') {
      if (selectionIsPresent) {
        return [{ op: 'delete-selection' }];
      }
    }

    if (event.key === 'Delete') {
      if (selectionIsPresent) {
        return [{ op: 'delete-selection' }];
      }
    }

    if (event.key === 'ArrowLeft') {
      if (selectionIsPresent && !maintainSelectionKeyPressed) {
        return [{ op: 'clear-selection' }];
      } else if (skipLineLevelKeyPressed) {
        return [{ op: 'move-cursor', direction: 'left', level: 'line', keepSelectionEnd: maintainSelectionKeyPressed }];
      } else if (skipSectionLevelKeyPressed) {
        return [{ op: 'move-cursor', direction: 'left', level: 'section', keepSelectionEnd: maintainSelectionKeyPressed }];
      } else {
        return [{ op: 'move-cursor', direction: 'left', level: 'character', keepSelectionEnd: maintainSelectionKeyPressed }];
      }
    }

    if (event.key === 'ArrowRight') {
      if (selectionIsPresent && !maintainSelectionKeyPressed) {
        return [{ op: 'clear-selection' }];
      } else if (skipLineLevelKeyPressed) {
        return [{ op: 'move-cursor', direction: 'right', level: 'line', keepSelectionEnd: maintainSelectionKeyPressed }];
      } else if (skipSectionLevelKeyPressed) {
        return [{ op: 'move-cursor', direction: 'right', level: 'section', keepSelectionEnd: maintainSelectionKeyPressed }];
      } else {
        return [{ op: 'move-cursor', direction: 'right', level: 'character', keepSelectionEnd: maintainSelectionKeyPressed }];
      }
    }
  }

  return undefined;
};

export const applyPatchOperationMoveCursor = (
  patchOperation: PatchOperationMoveCursor,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
): MaskState => {
  // todo: AI generated - human validation pending
  const { direction, level, keepSelectionEnd } = patchOperation;
  const { valueSpace } = currentDerivedState;

  // Get current cursor position
  const currentCaretPosition = currentState.caretPositionInValueSpace;
  let newCaretPosition = currentCaretPosition;

  // Find current position index in valueSpace
  const currentIndex = valueSpace.indexOf(currentCaretPosition);

  if (currentIndex === -1) {
    // If current position is not found, don't move
    return currentState;
  }

  // Calculate new position based on direction and level
  if (level === 'character') {
    // Move one character at a time
    if (direction === 'left' && currentIndex > 0) {
      newCaretPosition = valueSpace[currentIndex - 1];
    } else if (direction === 'right' && currentIndex < valueSpace.length - 1) {
      newCaretPosition = valueSpace[currentIndex + 1];
    }
  } else if (level === 'section') {
    // Move to beginning/end of current section or to adjacent section
    const [currentSectionIndex, currentPosition] = currentCaretPosition.split(':').map((x) => parseInt(x));

    if (direction === 'left') {
      // Find the first position of current section or move to previous section's end
      const targetSectionIndex = currentPosition === 0 ? currentSectionIndex - 1 : currentSectionIndex;
      const targetPosition = currentPosition === 0 ? undefined : 0;

      if (targetSectionIndex >= 0) {
        if (targetPosition !== undefined) {
          newCaretPosition = `${currentSectionIndex}:${targetPosition}`;
        } else {
          // Find last position of previous section
          const previousSectionPositions = valueSpace.filter((pos) => pos.startsWith(`${targetSectionIndex}:`));
          if (previousSectionPositions.length > 0) {
            newCaretPosition = previousSectionPositions[previousSectionPositions.length - 1];
          }
        }
      }
    } else if (direction === 'right') {
      // Find the last position of current section or move to next section's beginning
      const currentSectionPositions = valueSpace.filter((pos) => pos.startsWith(`${currentSectionIndex}:`));
      const isAtSectionEnd = currentIndex === valueSpace.indexOf(currentSectionPositions[currentSectionPositions.length - 1]);

      if (isAtSectionEnd) {
        // Move to next section's beginning
        const nextSectionPosition = valueSpace.find((pos) => pos.startsWith(`${currentSectionIndex + 1}:`));
        if (nextSectionPosition) {
          newCaretPosition = nextSectionPosition;
        }
      } else {
        // Move to current section's end
        newCaretPosition = currentSectionPositions[currentSectionPositions.length - 1];
      }
    }
  } else if (level === 'line') {
    // Move to beginning or end of entire line
    if (direction === 'left') {
      newCaretPosition = valueSpace[0];
    } else if (direction === 'right') {
      newCaretPosition = valueSpace[valueSpace.length - 1];
    }
  }

  // Create new state with updated cursor position
  const newState: MaskState = {
    ...currentState,
    caretPositionInValueSpace: newCaretPosition,
    selectionEndPositionInValueSpace: keepSelectionEnd ? currentState.selectionEndPositionInValueSpace : newCaretPosition,
  };

  return newState;
};

export const applyPatchOperationSetCursorPosition = (
  patchOperation: PatchOperationSetCursorPosition,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
): MaskState => {
  const newState: MaskState = {
    ...currentState,
    selectionEndPositionInValueSpace: patchOperation.keepSelectionEnd
      ? currentState.selectionEndPositionInValueSpace
      : currentState.caretPositionInValueSpace,
  };

  return newState;
};

export const applyPatchOperationClearSelection = (
  patchOperation: PatchOperationClearSelection,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
): MaskState => {
  const newState: MaskState = {
    ...currentState,
    selectionEndPositionInValueSpace: currentState.caretPositionInValueSpace,
  };

  return newState;
};

export const applyPatchOperationDeleteSelection = (
  patchOperation: PatchOperationDeleteSelection,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
): MaskState => {
  const comparison = compareSpaceCoordinates(currentState.caretPositionInValueSpace, currentState.selectionEndPositionInValueSpace);

  if (comparison === 0 || comparison === undefined) {
    return currentState;
  }

  const lowerSelectionCoordinates = comparison < 0 ? currentState.caretPositionInValueSpace : currentState.selectionEndPositionInValueSpace;
  const upperSelectionCoordinates = comparison < 0 ? currentState.selectionEndPositionInValueSpace : currentState.caretPositionInValueSpace;

  const [lowerSelectionIndex, lowerSelectionPosition] = lowerSelectionCoordinates.split(':').map((x) => parseInt(x));
  const [upperSelectionIndex, upperSelectionPosition] = upperSelectionCoordinates.split(':').map((x) => parseInt(x));
  let newCaretPosition = '0:0';

  const newValues = [...currentState.values];

  for (let i = lowerSelectionIndex; i <= upperSelectionIndex; i++) {
    const oldSectionValue = newValues[i];

    if (i === lowerSelectionIndex && i === upperSelectionIndex) {
      newValues[i] = oldSectionValue.substring(0, lowerSelectionPosition) + oldSectionValue.substring(upperSelectionPosition);
      newCaretPosition = `${i}:${lowerSelectionPosition}`;
    } else if (i === lowerSelectionIndex && i !== upperSelectionIndex) {
      newValues[i] = oldSectionValue.substring(0, lowerSelectionPosition);

      if (lowerSelectionCoordinates === currentState.caretPositionInValueSpace) {
        newCaretPosition = `${i}:${lowerSelectionPosition}`;
      }
    } else if (i !== lowerSelectionIndex && i === upperSelectionIndex) {
      newValues[i] = oldSectionValue.substring(upperSelectionPosition);

      if (upperSelectionCoordinates === currentState.caretPositionInValueSpace) {
        newCaretPosition = `${i}:0`;
      }
    } else if (i !== lowerSelectionIndex && i !== upperSelectionIndex) {
      newValues[i] = '';
    }
  }

  const newState: MaskState = {
    ...currentState,
    values: newValues,
    caretPositionInValueSpace: newCaretPosition,
    selectionEndPositionInValueSpace: newCaretPosition,
  };

  return newState;
};

export const applyPatchOperations = (
  patchOperations: PatchOperation[],
  currentState: MaskState,
  maskDefinition: MaskDefinition,
  currentDerivedState?: MaskDerivedState,
): [MaskState, MaskDerivedState] => {
  if (!currentDerivedState) {
    currentDerivedState = getDerivedState(currentState, maskDefinition);
  }

  for (const patchOperation of patchOperations) {
    if (patchOperation.op === 'move-cursor') {
      currentState = applyPatchOperationMoveCursor(patchOperation, currentState, currentDerivedState);
      currentDerivedState = getDerivedState(currentState, maskDefinition);
    } else if (patchOperation.op === 'set-cursor-position') {
      currentState = applyPatchOperationSetCursorPosition(patchOperation, currentState, currentDerivedState);
      currentDerivedState = getDerivedState(currentState, maskDefinition);
    } else if (patchOperation.op === 'clear-selection') {
      currentState = applyPatchOperationClearSelection(patchOperation, currentState, currentDerivedState);
      currentDerivedState = getDerivedState(currentState, maskDefinition);
    } else if (patchOperation.op === 'delete-selection') {
      currentState = applyPatchOperationDeleteSelection(patchOperation, currentState, currentDerivedState);
      currentDerivedState = getDerivedState(currentState, maskDefinition);
    }
  }

  return [currentState, currentDerivedState];
};
