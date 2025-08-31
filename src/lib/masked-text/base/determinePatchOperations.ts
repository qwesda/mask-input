import type { MaskDefinition, MaskDerivedState, MaskSectionInputDefinition, MaskState, PatchOperation, PatchOperationInsertCharacter } from './types';
import { findSection, getValueSpaceCoordinatesFromSelection, splitStringIntoGraphemes } from './helper';
import { getDerivedState } from './index';

export const determinePatchOperationFromKeyupEvent = (event: KeyboardEvent): [boolean, PatchOperation[]] => {
  if (event.isComposing) {
    return [false, []];
  }

  return [false, []];
};

export const determinePatchOperationFromBeforeInputEvent = (event: InputEvent, state: MaskState): [boolean, PatchOperation[]] => {
  if (event.isComposing) {
    return [false, []];
  }

  const selectionIsPresent = state.selectionEndPositionInValueSpace !== state.caretPositionInValueSpace;

  const insertCharacterPatchOperations = splitStringIntoGraphemes(event.data).map((value: string): PatchOperationInsertCharacter => {
    return {
      op: 'insert-character',
      character: value,
    };
  });

  if (selectionIsPresent) {
    return [true, [{ op: 'delete-selection' }, ...insertCharacterPatchOperations]];
  } else {
    return [true, insertCharacterPatchOperations];
  }
};

export const determinePatchOperationFromCompositionEndEvent = (event: CompositionEvent, state: MaskState): [boolean, PatchOperation[]] => {
  const insertCharacterPatchOperations = splitStringIntoGraphemes(event.data).map((value: string): PatchOperationInsertCharacter => {
    return {
      op: 'insert-character',
      character: value,
      inputBehavior: selectionIsPresent ? 'insert' : undefined,
    };
  });

  if (selectionIsPresent) {
    return [true, [{ op: 'delete-selection' }, ...insertCharacterPatchOperations]];
  } else {
    return [true, insertCharacterPatchOperations];
  }
};

export const determinePatchOperationFromKeydownEvent = (
  event: KeyboardEvent,
  state: MaskState,
  maskDefinition: MaskDefinition,
  currentDerivedState?: MaskDerivedState,
): [boolean, PatchOperation[]] => {
  if (!currentDerivedState) {
    currentDerivedState = getDerivedState(state, maskDefinition);
  }

  const isMac = navigator.userAgent.includes('Mac');
  const maintainSelectionKeyPressed = event.shiftKey;
  const skipSectionLevelKeyPressed = !isMac ? event.ctrlKey : event.altKey;
  const skipLineLevelKeyPressed = !isMac ? false : event.metaKey;
  const selectionIsPresent = state.selectionEndPositionInValueSpace !== state.caretPositionInValueSpace;

  if (event.isComposing) {
    return [false, []];
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
        return [true, [{ op: 'select-next-section', direction: 'right' }]];
      }
    } else {
      const previousInputSection = findSection(currentDerivedState, {
        direction: 'left',
        type: 'input',
        startIndex: currentDerivedState.caretDisplaySpaceIndex,
        includeStartIndex: false,
      });

      if (previousInputSection) {
        return [true, [{ op: 'select-next-section', direction: 'left' }]];
      }
    }
  }

  if (event.key === 'ArrowUp') {
    return [true, [{ op: 'spin', direction: 'up', metaPressed: event.metaKey, shiftPressed: event.shiftKey, altPressed: event.altKey }]];
  }

  if (event.key === 'ArrowDown') {
    return [true, [{ op: 'spin', direction: 'down', metaPressed: event.metaKey, shiftPressed: event.shiftKey, altPressed: event.altKey }]];
  }

  if (event.key === 'Backspace') {
    if (selectionIsPresent) {
      return [true, [{ op: 'delete-selection' }]];
    } else {
      return [true, [{ op: 'delete-backwards' }]];
    }
  }

  if (event.key === 'Delete') {
    if (selectionIsPresent) {
      return [true, [{ op: 'delete-selection' }]];
    } else {
      return [true, [{ op: 'delete-forwards' }]];
    }
  }

  if (event.key === 'ArrowLeft') {
    const clearOperations: PatchOperation[] =
      selectionIsPresent && !maintainSelectionKeyPressed ? [{ op: 'clear-selection', direction: 'left' }] : [];

    if (skipLineLevelKeyPressed) {
      return [true, [...clearOperations, { op: 'move-cursor', direction: 'left', level: 'line', keepSelectionEnd: maintainSelectionKeyPressed }]];
    } else if (skipSectionLevelKeyPressed) {
      return [true, [...clearOperations, { op: 'move-cursor', direction: 'left', level: 'section', keepSelectionEnd: maintainSelectionKeyPressed }]];
    } else {
      return [
        true,
        [...clearOperations, { op: 'move-cursor', direction: 'left', level: 'character', keepSelectionEnd: maintainSelectionKeyPressed }],
      ];
    }
  }

  if (event.key === 'ArrowRight') {
    const clearOperations: PatchOperation[] =
      selectionIsPresent && !maintainSelectionKeyPressed ? [{ op: 'clear-selection', direction: 'right' }] : [];

    if (skipLineLevelKeyPressed) {
      return [true, [...clearOperations, { op: 'move-cursor', direction: 'right', level: 'line', keepSelectionEnd: maintainSelectionKeyPressed }]];
    } else if (skipSectionLevelKeyPressed) {
      return [true, [...clearOperations, { op: 'move-cursor', direction: 'right', level: 'section', keepSelectionEnd: maintainSelectionKeyPressed }]];
    } else {
      return [
        true,
        [...clearOperations, { op: 'move-cursor', direction: 'right', level: 'character', keepSelectionEnd: maintainSelectionKeyPressed }],
      ];
    }
  }

  if (event.key === 'Home') {
    return [true, [{ op: 'move-cursor', direction: 'left', level: 'line', keepSelectionEnd: maintainSelectionKeyPressed }]];
  }

  if (event.key === 'End') {
    return [true, [{ op: 'move-cursor', direction: 'right', level: 'line', keepSelectionEnd: maintainSelectionKeyPressed }]];
  }

  if (event.key === 'a' && (isMac ? event.metaKey : event.ctrlKey)) {
    return [true, [{ op: 'select-all' }]];
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
          return [true, [{ op: 'move-cursor', direction: 'right', level: 'section', keepSelectionEnd: maintainSelectionKeyPressed }]];
        }
      }
    }
  }

  return [false, []];
};

export const determinePatchOperationAfterSelectionChangeEvent = (
  containerElement: HTMLElement,
  state: MaskState,
  maskDefinition: MaskDefinition,
): [boolean, PatchOperation[]] => {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return [false, []];
  }

  const [caretPositionInValueSpace, selectionEndPositionInValueSpace, exactMatch] = getValueSpaceCoordinatesFromSelection(
    containerElement,
    selection,
    maskDefinition,
  );

  if (caretPositionInValueSpace !== undefined && selectionEndPositionInValueSpace !== undefined) {
    if (
      !exactMatch ||
      caretPositionInValueSpace !== state.caretPositionInValueSpace ||
      selectionEndPositionInValueSpace !== state.selectionEndPositionInValueSpace
    ) {
      return [false, [{ op: 'set-selection', caretPositionInValueSpace, selectionEndPositionInValueSpace }]];
    }
  }

  return [false, []];
};
