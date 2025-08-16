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
  PatchOperationSelectNextSection,
  PatchOperationSetCursorPosition,
  PatchOperationSpin,
} from '@/masked-text/masks/base/types.ts';
import { compareSpaceCoordinates, findSection } from '@/masked-text/masks/base/helper.ts';
import { getDerivedState } from '@/masked-text/masks/base/index.ts';

export const applyPatchOperationMoveCursor = (
  patchOperation: PatchOperationMoveCursor,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
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

export const applyPatchOperationClearSelection = (
  patchOperation: PatchOperationClearSelection,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  const comparison = compareSpaceCoordinates(currentState.caretPositionInValueSpace, currentState.selectionEndPositionInValueSpace) || 0;

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

    const oldSectionValue = newValues[sectionDefinition.slug];

    if (i === lowerSelectionIndex && i === upperSelectionIndex) {
      newValues[sectionDefinition.slug] = oldSectionValue.substring(0, lowerSelectionPosition) + oldSectionValue.substring(upperSelectionPosition);
      newCaretPosition = `${i}:${lowerSelectionPosition}`;
    } else if (i === lowerSelectionIndex && i !== upperSelectionIndex) {
      newValues[sectionDefinition.slug] = oldSectionValue.substring(0, lowerSelectionPosition);

      if (lowerSelectionCoordinates === currentState.caretPositionInValueSpace) {
        newCaretPosition = `${i}:${lowerSelectionPosition}`;
      }
    } else if (i !== lowerSelectionIndex && i === upperSelectionIndex) {
      newValues[sectionDefinition.slug] = oldSectionValue.substring(upperSelectionPosition);

      if (upperSelectionCoordinates === currentState.caretPositionInValueSpace) {
        newCaretPosition = `${i}:0`;
      }
    } else if (i !== lowerSelectionIndex && i !== upperSelectionIndex) {
      newValues[sectionDefinition.slug] = '';
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

  const currentSectionValue = currentState.values[sectionDefinition.slug];
  const newSectionValue = spinFn(
    currentState.values,
    sectionDefinition.slug,
    patchOperation.metaPressed,
    patchOperation.shiftPressed,
    patchOperation.altPressed,
  );

  if (newSectionValue === undefined || newSectionValue === null || newSectionValue === currentSectionValue) {
    return currentState;
  }

  // if (sectionDefinition.syntacticValidationFn && !sectionDefinition.syntacticValidationFn(newSectionValue)) {
  //   return currentState;
  // }

  const newValues = { ...currentState.values };
  newValues[sectionDefinition.slug] = newSectionValue;

  const newCaretPosition = `${currentDerivedState.caretValueSpaceIndex}:${[...newSectionValue].length}`;
  const newSelectionEndPosition = `${currentDerivedState.caretValueSpaceIndex}:0`;

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
    const currentSectionValue = newValues[sectionDefinition.slug];

    newValues[sectionDefinition.slug] =
      currentSectionValue.substring(0, currentDerivedState.caretValueSpacePosition - 1) +
      currentSectionValue.substring(currentDerivedState.caretValueSpacePosition);

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
        newValues[targetSection.slug] = targetSectionValue.substring(0, targetSectionValue.length - 1);
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
  const currentSectionValue = currentState.values[sectionDefinition.slug];

  const newValues = { ...currentState.values };
  let newCaretPosition: string;

  if (currentDerivedState.caretValueSpacePosition < currentSectionValue.length) {
    newValues[sectionDefinition.slug] =
      currentSectionValue.substring(0, currentDerivedState.caretValueSpacePosition) +
      currentSectionValue.substring(currentDerivedState.caretValueSpacePosition + 1);
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
        newValues[targetSection.slug] = targetSectionValue.substring(1);
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

  if (sectionDefinition.inputCharacterFilterFn && !sectionDefinition.inputCharacterFilterFn(patchOperation.character)) {
    return currentState;
  }

  const finalValue = sectionDefinition.inputCharacterSubstitutionFn
    ? sectionDefinition.inputCharacterSubstitutionFn(patchOperation.character)
    : patchOperation.character;

  const currentSectionValue = currentState.values[sectionDefinition.slug];
  let newSectionValue: string;
  let newCaretPosition: string;

  if (sectionDefinition.inputBehavior === 'replace') {
    if (currentDerivedState.caretValueSpacePosition < currentSectionValue.length) {
      newSectionValue =
        currentSectionValue.substring(0, currentDerivedState.caretValueSpacePosition) +
        finalValue +
        currentSectionValue.substring(currentDerivedState.caretValueSpacePosition + 1);
    } else {
      newSectionValue = currentSectionValue + finalValue;
    }

    newCaretPosition = `${currentDerivedState.caretValueSpaceIndex}:${currentDerivedState.caretValueSpacePosition + 1}`;
  } else {
    if (sectionDefinition.maxLength && currentSectionValue.length + 1 > sectionDefinition.maxLength) {
      return currentState;
    }

    newSectionValue =
      currentSectionValue.substring(0, currentDerivedState.caretValueSpacePosition) +
      finalValue +
      currentSectionValue.substring(currentDerivedState.caretValueSpacePosition);
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
    }
  }

  return [currentState, currentDerivedState];
};
