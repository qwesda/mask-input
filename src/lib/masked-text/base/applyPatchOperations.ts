import type {
  MaskDefinition,
  MaskDerivedState,
  MaskSectionInputDefinition,
  MaskSectionInputDerivedState,
  MaskState,
  PatchOperation,
  PatchOperationClearSelection,
  PatchOperationDeleteBackwards,
  PatchOperationDeleteForwards,
  PatchOperationDeleteSelection,
  PatchOperationInsertCharacter,
  PatchOperationMoveCursor,
  PatchOperationSelectAll,
  PatchOperationSelectNextSection,
  PatchOperationSetCursorPosition,
  PatchOperationSpin,
} from './types';
import { compareSpaceCoordinates, findSection } from './helper';
import { getDerivedState } from './index';

export const applyPatchOperationMoveCursor = (
  patchOperation: PatchOperationMoveCursor,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  const currentCaretPositionInValueSpace = currentState.caretPositionInValueSpace;
  const currentIndexInValueSpace = currentDerivedState.valueSpace.indexOf(currentCaretPositionInValueSpace);
  const currentSection = currentDerivedState.sections[currentDerivedState.caretDisplaySpaceIndex] as MaskSectionInputDerivedState;

  let newCaretPosition = currentCaretPositionInValueSpace;

  if (currentIndexInValueSpace === -1) {
    return currentState;
  }

  if (patchOperation.level === 'character') {
    if (patchOperation.direction === 'left' && currentIndexInValueSpace > 0) {
      newCaretPosition = currentDerivedState.valueSpace[currentIndexInValueSpace - 1];
    } else if (patchOperation.direction === 'right' && currentIndexInValueSpace < currentDerivedState.valueSpace.length - 1) {
      newCaretPosition = currentDerivedState.valueSpace[currentIndexInValueSpace + 1];
    }
  } else if (patchOperation.level === 'section') {
    if (patchOperation.direction === 'left') {
      const isAtSectionStart = currentState.caretPositionInValueSpace === currentSection.valueSpace[0];

      if (!isAtSectionStart && patchOperation.keepSelectionEnd) {
        newCaretPosition = currentSection.valueSpace[0];
      } else {
        const prevSection = findSection(currentDerivedState, {
          startIndex: currentDerivedState.caretDisplaySpaceIndex,
          direction: 'left',
          type: 'input',
          includeStartIndex: false,
        }) as MaskSectionInputDerivedState | undefined;

        if (prevSection) {
          newCaretPosition = prevSection.valueSpace[prevSection.valueSpace.length - 1];
        } else {
          newCaretPosition = currentSection.valueSpace[0];
        }
      }
    } else if (patchOperation.direction === 'right') {
      const isAtSectionEnd = currentState.caretPositionInValueSpace === currentSection.valueSpace[currentSection.valueSpace.length - 1];

      if (!isAtSectionEnd && patchOperation.keepSelectionEnd) {
        newCaretPosition = currentSection.valueSpace[currentSection.valueSpace.length - 1];
      } else {
        const nextSection = findSection(currentDerivedState, {
          startIndex: currentDerivedState.caretDisplaySpaceIndex,
          direction: 'right',
          type: 'input',
          includeStartIndex: false,
        }) as MaskSectionInputDerivedState | undefined;

        if (nextSection) {
          newCaretPosition = nextSection.valueSpace[0];
        } else {
          newCaretPosition = currentSection.valueSpace[currentSection.valueSpace.length - 1];
        }
      }
    }
  } else if (patchOperation.level === 'line') {
    if (patchOperation.direction === 'left') {
      newCaretPosition = currentDerivedState.valueSpace[0];
    } else if (patchOperation.direction === 'right') {
      newCaretPosition = currentDerivedState.valueSpace[currentDerivedState.valueSpace.length - 1];
    }
  }

  const newState: MaskState = {
    ...currentState,
    caretPositionInValueSpace: newCaretPosition,
    selectionEndPositionInValueSpace: patchOperation.keepSelectionEnd ? currentState.selectionEndPositionInValueSpace : newCaretPosition,
  };

  return newState;
};

export const applyPatchOperationSetCursorPosition = (
  patchOperation: PatchOperationSetCursorPosition,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  const newState: MaskState = {
    ...currentState,
    selectionEndPositionInValueSpace: patchOperation.keepSelectionEnd
      ? currentState.selectionEndPositionInValueSpace
      : currentState.caretPositionInValueSpace,
  };

  return newState;
};

export const applyPatchOperationSelectNextSection = (
  patchOperation: PatchOperationSelectNextSection,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  const targetSection = findSection(currentDerivedState, {
    startIndex: currentDerivedState.caretDisplaySpaceIndex,
    direction: patchOperation.direction,
    type: 'input',
    includeStartIndex: false,
  }) as MaskSectionInputDerivedState | undefined;

  if (!targetSection) {
    return currentState;
  }

  const newCaretPositionInValueSpace = targetSection.valueSpace[targetSection.valueSpace.length - 1];
  const newSelectionEndPositionInValueSpace = targetSection.valueSpace[0];

  const newState: MaskState = {
    ...currentState,
    caretPositionInValueSpace: newCaretPositionInValueSpace,
    selectionEndPositionInValueSpace: newSelectionEndPositionInValueSpace,
  };

  return newState;
};

export const applyPatchOperationSelectAll = (
  patchOperation: PatchOperationSelectAll,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  const newCaretPositionInValueSpace = currentDerivedState.valueSpace[currentDerivedState.valueSpace.length - 1];
  const newSelectionEndPositionInValueSpace = currentDerivedState.valueSpace[0];

  const newState: MaskState = {
    ...currentState,
    caretPositionInValueSpace: newCaretPositionInValueSpace,
    selectionEndPositionInValueSpace: newSelectionEndPositionInValueSpace,
  };

  return newState;
};

export const applyPatchOperationClearSelection = (
  patchOperation: PatchOperationClearSelection,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  const comparison = compareSpaceCoordinates(currentState.caretPositionInValueSpace, currentState.selectionEndPositionInValueSpace) ?? 0;

  if (patchOperation.direction === 'left') {
    const lowerSelectionCoordinates = comparison < 0 ? currentState.caretPositionInValueSpace : currentState.selectionEndPositionInValueSpace;

    return {
      ...currentState,
      caretPositionInValueSpace: lowerSelectionCoordinates,
      selectionEndPositionInValueSpace: lowerSelectionCoordinates,
    };
  } else {
    const upperSelectionCoordinates = comparison > 0 ? currentState.caretPositionInValueSpace : currentState.selectionEndPositionInValueSpace;

    return {
      ...currentState,
      caretPositionInValueSpace: upperSelectionCoordinates,
      selectionEndPositionInValueSpace: upperSelectionCoordinates,
    };
  }
};

export const applyPatchOperationDeleteSelection = (
  patchOperation: PatchOperationDeleteSelection,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
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

  const newValues = { ...currentState.values };

  for (const [i, sectionDefinition] of maskDefinition.sections.filter((x) => x.type === 'input').entries()) {
    if (i < lowerSelectionIndex || i > upperSelectionIndex) {
      continue;
    }

    const oldSectionValue = newValues[sectionDefinition.slug] ?? [];

    if (i === lowerSelectionIndex && i === upperSelectionIndex) {
      newValues[sectionDefinition.slug] = [...oldSectionValue.slice(0, lowerSelectionPosition), ...oldSectionValue.slice(upperSelectionPosition)];
      newCaretPosition = `${i}:${lowerSelectionPosition}`;
    } else if (i === lowerSelectionIndex && i !== upperSelectionIndex) {
      newValues[sectionDefinition.slug] = oldSectionValue.slice(0, lowerSelectionPosition);

      if (lowerSelectionCoordinates === currentState.caretPositionInValueSpace) {
        newCaretPosition = `${i}:${lowerSelectionPosition}`;
      }
    } else if (i !== lowerSelectionIndex && i === upperSelectionIndex) {
      newValues[sectionDefinition.slug] = oldSectionValue.slice(upperSelectionPosition);

      if (upperSelectionCoordinates === currentState.caretPositionInValueSpace) {
        newCaretPosition = `${i}:0`;
      }
    } else if (i !== lowerSelectionIndex && i !== upperSelectionIndex) {
      newValues[sectionDefinition.slug] = [''];
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

export const applyPatchOperationSpin = (
  patchOperation: PatchOperationSpin,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  const sectionDefinition = maskDefinition.sections[currentDerivedState.caretDisplaySpaceIndex] as MaskSectionInputDefinition;
  const spinFn = patchOperation.direction === 'up' ? sectionDefinition.spinUpFn : sectionDefinition.spinDownFn;

  if (!spinFn) {
    return currentState;
  }

  const newValues = spinFn(
    currentState.values,
    sectionDefinition.slug,
    patchOperation.metaPressed,
    patchOperation.shiftPressed,
    patchOperation.altPressed,
  );
  const newSectionValue = newValues[sectionDefinition.slug] ?? [];
  const newCaretPosition = `${currentDerivedState.caretValueSpaceIndex}:${[...newSectionValue].length}`;
  const newSelectionEndPosition = newCaretPosition;

  const newState: MaskState = {
    ...currentState,
    values: newValues,
    caretPositionInValueSpace: newCaretPosition,
    selectionEndPositionInValueSpace: newSelectionEndPosition,
  };

  return newState;
};

export const applyPatchOperationDeleteBackwards = (
  patchOperation: PatchOperationDeleteBackwards,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  if (currentState.caretPositionInValueSpace === '0:0') {
    return currentState;
  }

  const sectionDefinition = maskDefinition.sections[currentDerivedState.caretDisplaySpaceIndex] as MaskSectionInputDefinition;
  const newValues = { ...currentState.values };
  let newCaretPosition: string;

  if (currentDerivedState.caretValueSpacePosition > 0) {
    const currentSectionValue = newValues[sectionDefinition.slug] ?? [];

    newValues[sectionDefinition.slug] = [
      ...currentSectionValue.slice(0, currentDerivedState.caretValueSpacePosition - 1),
      ...currentSectionValue.slice(currentDerivedState.caretValueSpacePosition),
    ];

    newCaretPosition = `${currentDerivedState.caretValueSpaceIndex}:${currentDerivedState.caretValueSpacePosition - 1}`;
  } else {
    const targetSection = findSection(currentDerivedState, {
      startIndex: currentDerivedState.caretDisplaySpaceIndex,
      direction: 'left',
      type: 'input',
      includeStartIndex: false,
    }) as MaskSectionInputDerivedState | undefined;

    if (targetSection) {
      const targetSectionValue = newValues[targetSection.slug];

      if (targetSectionValue.length > 0) {
        newValues[targetSection.slug] = targetSectionValue.slice(0, targetSectionValue.length - 1);
        newCaretPosition = `${targetSection.valueIndex}:${targetSectionValue.length - 1}`;
      } else {
        newCaretPosition = `${targetSection.valueIndex}:0`;
      }
    } else {
      return currentState;
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

export const applyPatchOperationDeleteForwards = (
  patchOperation: PatchOperationDeleteForwards,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  const sectionDefinition = maskDefinition.sections[currentDerivedState.caretDisplaySpaceIndex] as MaskSectionInputDefinition;
  const currentSectionValue = currentState.values[sectionDefinition.slug] ?? [];

  const newValues = { ...currentState.values };
  let newCaretPosition: string;

  if (currentDerivedState.caretValueSpacePosition < currentSectionValue.length) {
    newValues[sectionDefinition.slug] = [
      ...currentSectionValue.slice(0, currentDerivedState.caretValueSpacePosition),
      ...currentSectionValue.slice(currentDerivedState.caretValueSpacePosition + 1),
    ];
    newCaretPosition = `${currentDerivedState.caretValueSpaceIndex}:${currentDerivedState.caretValueSpacePosition}`;
  } else {
    const targetSection = findSection(currentDerivedState, {
      startIndex: currentDerivedState.caretDisplaySpaceIndex,
      direction: 'right',
      type: 'input',
      includeStartIndex: false,
    }) as MaskSectionInputDerivedState | undefined;

    if (targetSection) {
      const targetSectionValue = newValues[targetSection.slug];

      if (targetSectionValue.length > 0) {
        newValues[targetSection.slug] = targetSectionValue.slice(1);
      }

      newCaretPosition = `${targetSection.valueIndex}:0`;
    } else {
      return currentState;
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

export const applyPatchOperationInsert = (
  patchOperation: PatchOperationInsertCharacter,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  const sectionDefinition = maskDefinition.sections[currentDerivedState.caretDisplaySpaceIndex] as MaskSectionInputDefinition;
  const currentSectionValue = currentState.values[sectionDefinition.slug] ?? [];
  const inputBehavior = patchOperation.inputBehavior ?? sectionDefinition.inputBehavior;

  const atSectionMaxLengthLimit =
    sectionDefinition.maxLength &&
    ((inputBehavior === 'insert' && currentSectionValue.length >= sectionDefinition.maxLength) ||
      (inputBehavior === 'replace' && currentDerivedState.caretValueSpacePosition >= sectionDefinition.maxLength));

  if (atSectionMaxLengthLimit) {
    return currentState;
  }

  const character = sectionDefinition.inputCharacterSubstitutionFn
    ? sectionDefinition.inputCharacterSubstitutionFn(patchOperation.character)
    : patchOperation.character;

  if (sectionDefinition.inputCharacterFilterFn && !sectionDefinition.inputCharacterFilterFn(patchOperation.character)) {
    return currentState;
  }

  let newSectionValue: string[];
  let newCaretPosition: string;

  if (inputBehavior === 'replace') {
    if (currentDerivedState.caretValueSpacePosition < currentSectionValue.length) {
      newSectionValue = [
        ...currentSectionValue.slice(0, currentDerivedState.caretValueSpacePosition),
        character,
        ...currentSectionValue.slice(currentDerivedState.caretValueSpacePosition + 1),
      ];
    } else {
      newSectionValue = [...currentSectionValue, character];
    }

    newCaretPosition = `${currentDerivedState.caretValueSpaceIndex}:${currentDerivedState.caretValueSpacePosition + 1}`;
  } else {
    if (sectionDefinition.maxLength && currentSectionValue.length + 1 > sectionDefinition.maxLength) {
      return currentState;
    }

    newSectionValue = [
      ...currentSectionValue.slice(0, currentDerivedState.caretValueSpacePosition),
      character,
      ...currentSectionValue.slice(currentDerivedState.caretValueSpacePosition),
    ];
    newCaretPosition = `${currentDerivedState.caretValueSpaceIndex}:${currentDerivedState.caretValueSpacePosition + 1}`;
  }

  // if (sectionDefinition.syntacticValidationFn && !sectionDefinition.syntacticValidationFn(newSectionValue)) {
  //   return currentState;
  // }

  const newValues = { ...currentState.values };

  newValues[sectionDefinition.slug] = newSectionValue;

  if (sectionDefinition.maxLength && currentDerivedState.caretValueSpacePosition + 1 >= sectionDefinition.maxLength) {
    const nextInputSection = findSection(currentDerivedState, {
      startIndex: currentDerivedState.caretDisplaySpaceIndex,
      direction: 'right',
      type: 'input',
      includeStartIndex: false,
    }) as MaskSectionInputDerivedState | undefined;

    if (nextInputSection) {
      newCaretPosition = `${nextInputSection.valueIndex}:0`;
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
      currentState = applyPatchOperationMoveCursor(patchOperation, currentState, currentDerivedState, maskDefinition);
      currentDerivedState = getDerivedState(currentState, maskDefinition);
    } else if (patchOperation.op === 'set-cursor-position') {
      currentState = applyPatchOperationSetCursorPosition(patchOperation, currentState, currentDerivedState, maskDefinition);
      currentDerivedState = getDerivedState(currentState, maskDefinition);
    } else if (patchOperation.op === 'clear-selection') {
      currentState = applyPatchOperationClearSelection(patchOperation, currentState, currentDerivedState, maskDefinition);
      currentDerivedState = getDerivedState(currentState, maskDefinition);
    } else if (patchOperation.op === 'delete-selection') {
      currentState = applyPatchOperationDeleteSelection(patchOperation, currentState, currentDerivedState, maskDefinition);
      currentDerivedState = getDerivedState(currentState, maskDefinition);
    } else if (patchOperation.op === 'insert-character') {
      currentState = applyPatchOperationInsert(patchOperation, currentState, currentDerivedState, maskDefinition);
      currentDerivedState = getDerivedState(currentState, maskDefinition);
    } else if (patchOperation.op === 'delete-backwards') {
      currentState = applyPatchOperationDeleteBackwards(patchOperation, currentState, currentDerivedState, maskDefinition);
      currentDerivedState = getDerivedState(currentState, maskDefinition);
    } else if (patchOperation.op === 'delete-forwards') {
      currentState = applyPatchOperationDeleteForwards(patchOperation, currentState, currentDerivedState, maskDefinition);
      currentDerivedState = getDerivedState(currentState, maskDefinition);
    } else if (patchOperation.op === 'spin') {
      currentState = applyPatchOperationSpin(patchOperation, currentState, currentDerivedState, maskDefinition);
      currentDerivedState = getDerivedState(currentState, maskDefinition);
    } else if (patchOperation.op === 'select-next-section') {
      currentState = applyPatchOperationSelectNextSection(patchOperation, currentState, currentDerivedState, maskDefinition);
      currentDerivedState = getDerivedState(currentState, maskDefinition);
    } else if (patchOperation.op === 'select-all') {
      currentState = applyPatchOperationSelectAll(patchOperation, currentState, currentDerivedState, maskDefinition);
      currentDerivedState = getDerivedState(currentState, maskDefinition);
    }
  }

  return [currentState, currentDerivedState];
};
