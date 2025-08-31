import type {
  MaskDefinition,
  MaskDerivedState,
  MaskSectionInputDefinition,
  MaskSectionInputDerivedState,
  MaskState,
  PatchOperation,
  PatchOperationApplyValueNormalization,
  PatchOperationClearSelection,
  PatchOperationDeleteBackwards,
  PatchOperationDeleteForwards,
  PatchOperationDeleteSelection,
  PatchOperationInsertCharacter,
  PatchOperationMoveCursor,
  PatchOperationSelectAll,
  PatchOperationSelectNextSection,
  PatchOperationSetCursorPosition,
  PatchOperationSetSelection,
  PatchOperationSetValues,
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

  return {
    ...currentState,
    caretPositionInValueSpace: newCaretPosition,
    selectionEndPositionInValueSpace: patchOperation.keepSelectionEnd ? currentState.selectionEndPositionInValueSpace : newCaretPosition,
  };
};

export const applyPatchOperationSetCursorPosition = (
  patchOperation: PatchOperationSetCursorPosition,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  const newValues =
    maskDefinition.valueNormalizationFn &&
    patchOperation.caretPositionInValueSpace.split(':')[0] !== currentState.caretPositionInValueSpace.split(':')[0]
      ? maskDefinition.valueNormalizationFn(currentState.values)
      : currentState.values;

  return {
    ...currentState,
    values: newValues,
    caretPositionInValueSpace: patchOperation.caretPositionInValueSpace,
    selectionEndPositionInValueSpace: patchOperation.keepSelectionEnd
      ? currentState.selectionEndPositionInValueSpace
      : patchOperation.caretPositionInValueSpace,
  };
};

export const applyPatchOperationSetSelection = (
  patchOperation: PatchOperationSetSelection,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  return {
    ...currentState,
    caretPositionInValueSpace: patchOperation.caretPositionInValueSpace,
    selectionEndPositionInValueSpace: patchOperation.selectionEndPositionInValueSpace,
  };
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

  return {
    ...currentState,
    caretPositionInValueSpace: newCaretPositionInValueSpace,
    selectionEndPositionInValueSpace: newSelectionEndPositionInValueSpace,
  };
};

export const applyPatchOperationSelectAll = (
  patchOperation: PatchOperationSelectAll,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  const newCaretPositionInValueSpace = currentDerivedState.valueSpace[currentDerivedState.valueSpace.length - 1];
  const newSelectionEndPositionInValueSpace = currentDerivedState.valueSpace[0];

  return {
    ...currentState,
    caretPositionInValueSpace: newCaretPositionInValueSpace,
    selectionEndPositionInValueSpace: newSelectionEndPositionInValueSpace,
  };
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

  return {
    ...currentState,
    values: newValues,
    caretPositionInValueSpace: newCaretPosition,
    selectionEndPositionInValueSpace: newCaretPosition,
  };
};

export const applyPatchOperationApplyValueNormalization = (
  patchOperation: PatchOperationApplyValueNormalization,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  const newValues = maskDefinition.valueNormalizationFn ? maskDefinition.valueNormalizationFn(currentState.values) : currentState.values;

  return {
    ...currentState,
    values: newValues,
  };
};

export const applyPatchOperationSpin = (
  patchOperation: PatchOperationSpin,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  const sectionDefinition = maskDefinition.sections[currentDerivedState.caretDisplaySpaceIndex] as MaskSectionInputDefinition;

  if (!sectionDefinition.spinFn) {
    return currentState;
  }

  const newValues = sectionDefinition.spinFn(
    patchOperation.direction,
    currentState.values,
    sectionDefinition.slug,
    patchOperation.metaPressed,
    patchOperation.shiftPressed,
    patchOperation.altPressed,
  );

  const newSectionValue = newValues[sectionDefinition.slug] ?? [];
  const newCaretPosition = `${currentDerivedState.caretValueSpaceIndex}:${[...newSectionValue].length}`;

  return {
    ...currentState,
    values: newValues,
    caretPositionInValueSpace: newCaretPosition,
    selectionEndPositionInValueSpace: newCaretPosition,
  };
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

  return {
    ...currentState,
    values: newValues,
    caretPositionInValueSpace: newCaretPosition,
    selectionEndPositionInValueSpace: newCaretPosition,
  };
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

  return {
    ...currentState,
    values: newValues,
    caretPositionInValueSpace: newCaretPosition,
    selectionEndPositionInValueSpace: newCaretPosition,
  };
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

  if (patchOperation.character.length === 1) {
    for (const [index, section] of maskDefinition.sections.entries()) {
      if (
        index > currentDerivedState.caretDisplaySpaceIndex &&
        section.type === 'fixed' &&
        section.skipKeys &&
        section.skipKeys.includes(patchOperation.character)
      ) {
        const targetSection = findSection(currentDerivedState, {
          direction: 'right',
          type: 'input',
          startIndex: index,
          includeStartIndex: false,
        }) as MaskSectionInputDerivedState | undefined;

        if (targetSection !== undefined) {
          return {
            ...currentState,
            caretPositionInValueSpace: targetSection.valueSpace[0],
            selectionEndPositionInValueSpace: targetSection.valueSpace[0],
          };
        }
      }
    }
  }

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

  const newValues = { ...currentState.values };

  newValues[sectionDefinition.slug] = newSectionValue;

  let shouldAutoAdvance = false;

  if (sectionDefinition.autoAdvanceFn) {
    shouldAutoAdvance = sectionDefinition.autoAdvanceFn(newValues);
  }

  if (shouldAutoAdvance || (sectionDefinition.maxLength && currentDerivedState.caretValueSpacePosition + 1 >= sectionDefinition.maxLength)) {
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

  return {
    ...currentState,
    values: newValues,
    caretPositionInValueSpace: newCaretPosition,
    selectionEndPositionInValueSpace: newCaretPosition,
  };
};

export const applyPatchOperationSetValues = (
  patchOperation: PatchOperationSetValues,
  currentState: MaskState,
  currentDerivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): MaskState => {
  return {
    ...currentState,
    values: patchOperation.values,
  };
};

export const applyPatchOperations = (
  patchOperations: PatchOperation[],
  currentState: MaskState,
  maskDefinition: MaskDefinition,
  currentDerivedState?: MaskDerivedState,
): [MaskState, MaskDerivedState, boolean] => {
  if (!currentDerivedState) {
    currentDerivedState = getDerivedState(currentState, maskDefinition);
  }

  let reRenderImmediately = false;

  for (const patchOperation of patchOperations) {
    const lastDerivedState = currentDerivedState;

    reRenderImmediately =
      patchOperation.op === 'insert-character' ||
      patchOperation.op === 'delete-backwards' ||
      patchOperation.op === 'delete-forwards' ||
      patchOperation.op === 'delete-selection' ||
      patchOperation.op === 'spin';

    if (patchOperation.op === 'move-cursor') {
      currentState = applyPatchOperationMoveCursor(patchOperation, currentState, currentDerivedState, maskDefinition);
    } else if (patchOperation.op === 'set-cursor-position') {
      currentState = applyPatchOperationSetCursorPosition(patchOperation, currentState, currentDerivedState, maskDefinition);
      reRenderImmediately = reRenderImmediately || (patchOperation.reRenderImmediately ?? false);
    } else if (patchOperation.op === 'clear-selection') {
      currentState = applyPatchOperationClearSelection(patchOperation, currentState, currentDerivedState, maskDefinition);
    } else if (patchOperation.op === 'delete-selection') {
      currentState = applyPatchOperationDeleteSelection(patchOperation, currentState, currentDerivedState, maskDefinition);
    } else if (patchOperation.op === 'insert-character') {
      currentState = applyPatchOperationInsert(patchOperation, currentState, currentDerivedState, maskDefinition);
    } else if (patchOperation.op === 'delete-backwards') {
      currentState = applyPatchOperationDeleteBackwards(patchOperation, currentState, currentDerivedState, maskDefinition);
    } else if (patchOperation.op === 'delete-forwards') {
      currentState = applyPatchOperationDeleteForwards(patchOperation, currentState, currentDerivedState, maskDefinition);
    } else if (patchOperation.op === 'apply-value-normalization') {
      currentState = applyPatchOperationApplyValueNormalization(patchOperation, currentState, currentDerivedState, maskDefinition);
    } else if (patchOperation.op === 'spin') {
      currentState = applyPatchOperationSpin(patchOperation, currentState, currentDerivedState, maskDefinition);
    } else if (patchOperation.op === 'select-next-section') {
      currentState = applyPatchOperationSelectNextSection(patchOperation, currentState, currentDerivedState, maskDefinition);
    } else if (patchOperation.op === 'select-all') {
      currentState = applyPatchOperationSelectAll(patchOperation, currentState, currentDerivedState, maskDefinition);
    } else if (patchOperation.op === 'set-selection') {
      currentState = applyPatchOperationSetSelection(patchOperation, currentState, currentDerivedState, maskDefinition);
    } else if (patchOperation.op === 'set-values') {
      currentState = applyPatchOperationSetValues(patchOperation, currentState, currentDerivedState, maskDefinition);
    } else {
      return [currentState, currentDerivedState, reRenderImmediately];
    }

    currentDerivedState = getDerivedState(currentState, maskDefinition);

    if (maskDefinition.valueNormalizationFn && lastDerivedState.caretValueSpaceIndex !== currentDerivedState.caretValueSpaceIndex) {
      currentState = applyPatchOperationApplyValueNormalization(
        { op: 'apply-value-normalization' },
        currentState,
        currentDerivedState,
        maskDefinition,
      );
      currentDerivedState = getDerivedState(currentState, maskDefinition);
    }
  }

  return [currentState, currentDerivedState, reRenderImmediately];
};
