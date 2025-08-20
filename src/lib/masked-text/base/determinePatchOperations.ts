import type { MaskDefinition, MaskDerivedState, MaskSectionInputDefinition, MaskState, PatchOperation, PatchOperationInsertCharacter } from './types';
import { findSection, splitStringIntoGraphemes } from './helper';
import { getDerivedState } from './index';

export const determinePatchOperationFromKeyupEvent = (
  event: KeyboardEvent,
  state: MaskState,
  maskDefinition: MaskDefinition,
  currentDerivedState?: MaskDerivedState,
): PatchOperation[] | undefined => {
  if (event.isComposing) {
    return undefined;
  }

  return undefined;
};

export const determinePatchOperationFromBeforeInputEvent = (
  event: InputEvent,
  state: MaskState,
  maskDefinition: MaskDefinition,
  currentDerivedState?: MaskDerivedState,
): PatchOperation[] | undefined => {
  if (event.isComposing) {
    return undefined;
  }

  const selectionIsPresent = state.selectionEndPositionInValueSpace !== state.caretPositionInValueSpace;

  const insertCharacterPatchOperations = splitStringIntoGraphemes(event.data).map((value: string): PatchOperationInsertCharacter => {
    return {
      op: 'insert-character',
      character: value,
      inputBehavior: selectionIsPresent ? 'insert' : undefined,
    };
  });

  if (selectionIsPresent) {
    return [{ op: 'delete-selection' }, ...insertCharacterPatchOperations];
  } else {
    return insertCharacterPatchOperations;
  }
};

export const determinePatchOperationFromCompositionEndEvent = (
  event: CompositionEvent,
  state: MaskState,
  maskDefinition: MaskDefinition,
  currentDerivedState?: MaskDerivedState,
): PatchOperation[] | undefined => {
  if (!currentDerivedState) {
    currentDerivedState = getDerivedState(state, maskDefinition);
  }

  const currentSection = maskDefinition.sections[currentDerivedState.caretDisplaySpaceIndex] as MaskSectionInputDefinition;
  const selectionIsPresent = state.selectionEndPositionInValueSpace !== state.caretPositionInValueSpace;

  if (selectionIsPresent) {
    return [{ op: 'delete-selection' }, { op: 'insert-character', character: event.data }];
  } else {
    return [{ op: 'insert-character', character: event.data }];
  }
};

export const determinePatchOperationFromKeydownEvent = (
  event: KeyboardEvent,
  state: MaskState,
  maskDefinition: MaskDefinition,
  currentDerivedState?: MaskDerivedState,
): PatchOperation[] | undefined => {
  if (!currentDerivedState) {
    currentDerivedState = getDerivedState(state, maskDefinition);
  }

  const isMac = navigator.userAgent.includes('Mac');
  const maintainSelectionKeyPressed = event.shiftKey;
  const skipSectionLevelKeyPressed = !isMac ? event.ctrlKey : event.altKey;
  const skipLineLevelKeyPressed = !isMac ? false : event.metaKey;
  const selectionIsPresent = state.selectionEndPositionInValueSpace !== state.caretPositionInValueSpace;

  if (event.isComposing) {
    return undefined;
  }

  if (event.key === 'Tab') {
    if (!event.shiftKey) {
      const nextInputSection = findSection(currentDerivedState, {
        direction: 'right',
        type: 'input',
        startIndex: currentDerivedState.caretDisplaySpaceIndex,
        includeStartIndex: false,
      });

      if (nextInputSection) {
        return [{ op: 'select-next-section', direction: 'right' }];
      }
    } else {
      const previousInputSection = findSection(currentDerivedState, {
        direction: 'left',
        type: 'input',
        startIndex: currentDerivedState.caretDisplaySpaceIndex,
        includeStartIndex: false,
      });

      if (previousInputSection) {
        return [{ op: 'select-next-section', direction: 'left' }];
      }
    }
  }

  if (event.key === 'ArrowUp') {
    return [{ op: 'spin', direction: 'up', metaPressed: event.metaKey, shiftPressed: event.shiftKey, altPressed: event.altKey }];
  }

  if (event.key === 'ArrowDown') {
    return [{ op: 'spin', direction: 'down', metaPressed: event.metaKey, shiftPressed: event.shiftKey, altPressed: event.altKey }];
  }

  if (event.key === 'Backspace') {
    if (selectionIsPresent) {
      return [{ op: 'delete-selection' }];
    } else {
      return [{ op: 'delete-backwards' }];
    }
  }

  if (event.key === 'Delete') {
    if (selectionIsPresent) {
      return [{ op: 'delete-selection' }];
    } else {
      return [{ op: 'delete-forwards' }];
    }
  }

  if (event.key === 'ArrowLeft') {
    const clearOperations: PatchOperation[] =
      selectionIsPresent && !maintainSelectionKeyPressed ? [{ op: 'clear-selection', direction: 'left' }] : [];

    if (skipLineLevelKeyPressed) {
      return [...clearOperations, { op: 'move-cursor', direction: 'left', level: 'line', keepSelectionEnd: maintainSelectionKeyPressed }];
    } else if (skipSectionLevelKeyPressed) {
      return [...clearOperations, { op: 'move-cursor', direction: 'left', level: 'section', keepSelectionEnd: maintainSelectionKeyPressed }];
    } else {
      return [...clearOperations, { op: 'move-cursor', direction: 'left', level: 'character', keepSelectionEnd: maintainSelectionKeyPressed }];
    }
  }

  if (event.key === 'ArrowRight') {
    const clearOperations: PatchOperation[] =
      selectionIsPresent && !maintainSelectionKeyPressed ? [{ op: 'clear-selection', direction: 'right' }] : [];

    if (skipLineLevelKeyPressed) {
      return [...clearOperations, { op: 'move-cursor', direction: 'right', level: 'line', keepSelectionEnd: maintainSelectionKeyPressed }];
    } else if (skipSectionLevelKeyPressed) {
      return [...clearOperations, { op: 'move-cursor', direction: 'right', level: 'section', keepSelectionEnd: maintainSelectionKeyPressed }];
    } else {
      return [...clearOperations, { op: 'move-cursor', direction: 'right', level: 'character', keepSelectionEnd: maintainSelectionKeyPressed }];
    }
  }

  if (event.key === 'Home') {
    return [{ op: 'move-cursor', direction: 'left', level: 'line', keepSelectionEnd: maintainSelectionKeyPressed }];
  }

  if (event.key === 'End') {
    return [{ op: 'move-cursor', direction: 'right', level: 'line', keepSelectionEnd: maintainSelectionKeyPressed }];
  }

  if (event.key === 'a' && (isMac ? event.metaKey : event.ctrlKey)) {
    return [{ op: 'select-all' }];
  }

  if (event.key.length === 1) {
    for (const [index, section] of maskDefinition.sections.entries()) {
      if (
        index > currentDerivedState.caretDisplaySpaceIndex &&
        section.type === 'fixed' &&
        section.skipKeys &&
        section.skipKeys.includes(event.key)
      ) {
        const targetSection = findSection(currentDerivedState, {
          direction: 'right',
          type: 'input',
          startIndex: index,
          includeStartIndex: false,
        }) as MaskSectionInputDefinition | undefined;

        if (targetSection) {
          return [{ op: 'move-cursor', direction: 'right', level: 'section', keepSelectionEnd: maintainSelectionKeyPressed }];
        }
      }
    }
  }

  return undefined;
};
