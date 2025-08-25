<template>
  <div
    ref="containerRef"
    class="masked-text-container"
    contenteditable="true"
    :class="{ 'has-focus': hasFocus }"
    @mousedown.capture="handleMousedown"
    @focusin.capture="handleFocusin"
    @focusout="handleFocusout"
    @keydown.capture="handleKeydown"
    @keyup.capture="handleKeyup"
    @beforeinput.capture="handleBeforeInput"
    @compositionend.capture="handleCompositionEnd"
  />
</template>

<script lang="ts" setup>
  import { onBeforeUnmount, onMounted, ref, type Ref, watch } from 'vue';
  import type { MaskDefinition, MaskDerivedState, MaskState } from './base/types';
  import { getDerivedState, getInitialMaskState, updateMaskStateCaretAndSelection, updateMaskStateValues } from './base/index';

  import {
    modelValuesEqual,
    findClosestValidValueSpaceCoordinates,
    getExternalModelValueFromInternalModel,
    getInternalModelValueExternalFromModel,
    getSelectionNodeAndOffsetFromPositionInValueSpace,
  } from './base/helper';

  import { applyPatchOperations } from './base/applyPatchOperations';

  import {
    determinePatchOperationFromBeforeInputEvent,
    determinePatchOperationFromCompositionEndEvent,
    determinePatchOperationFromKeydownEvent,
    determinePatchOperationFromKeyupEvent,
    determinePatchOperationAfterSelectionChangeEvent,
  } from './base/determinePatchOperations';

  import type { PatchOperation } from './base/types';

  interface Props {
    mask: MaskDefinition;
    modelValue?: Record<string, string>;
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: () => ({}),
  });

  const emits = defineEmits<{
    'update:modelValue': [value: Record<string, string>];
    'update:validatedValue': [value: string | undefined];
    'update:semanticValidationMessage': [value: string | undefined];

    focus: [];
    blur: [];

    // TODO: remove this ... only for debugging purposes
    'update:debugInfo': [state: MaskState, lastDerivedState: MaskDerivedState];
  }>();

  const state: Ref<MaskState> = ref(getInitialMaskState(props.modelValue));
  const lastDerivedState: Ref<MaskDerivedState> = ref(getDerivedState(state.value, props.mask));

  const hasFocus = ref(false);
  const isRenderScheduled = ref(false);

  const containerRef: Ref<HTMLDivElement | undefined> = ref<HTMLDivElement>();

  const scheduleRender = (reRenderImmediately: boolean = false) => {
    isRenderScheduled.value = true;

    if (reRenderImmediately) {
      render();
    } else {
      setTimeout(() => {
        render();
      }, 0);
    }
  };

  const render = () => {
    // console.log('render');

    if (containerRef.value && isRenderScheduled.value) {
      isRenderScheduled.value = false;

      if (containerRef.value.innerHTML != lastDerivedState.value.inputHTMLString) {
        containerRef.value.innerHTML = lastDerivedState.value.inputHTMLString;
      }

      if (hasFocus.value) {
        const [caretNode, caretOffset] = getSelectionNodeAndOffsetFromPositionInValueSpace(
          containerRef.value,
          state.value.caretPositionInValueSpace,
          props.mask,
        );

        const [selectionEndNode, selectionEndOffset] = getSelectionNodeAndOffsetFromPositionInValueSpace(
          containerRef.value,
          state.value.selectionEndPositionInValueSpace,
          props.mask,
        );

        const selection = window.getSelection();

        if (selection && caretNode && selectionEndNode) {
          selection.removeAllRanges();
          selection.setBaseAndExtent(selectionEndNode, selectionEndOffset, caretNode, caretOffset);
        }
      }
    }
  };

  const runComponentInternalUpdateLoop = (patchOperations: PatchOperation[] | undefined) => {
    const initialStateModelValue = getExternalModelValueFromInternalModel(state.value.values);
    const initialValidatedValue = lastDerivedState.value.validatedStringEncodedValue;
    const initialSemanticValidationMessage = lastDerivedState.value.semanticValidationMessage;

    if (patchOperations !== undefined) {
      let reRenderImmediately: boolean;
      [state.value, lastDerivedState.value, reRenderImmediately] = applyPatchOperations(
        patchOperations,
        state.value,
        props.mask,
        lastDerivedState.value,
      );

      const finalStateModelValue = getExternalModelValueFromInternalModel(state.value.values);
      const finalValidatedValue = lastDerivedState.value.validatedStringEncodedValue;
      const finalSemanticValidationMessage = lastDerivedState.value.semanticValidationMessage;

      if (!modelValuesEqual(initialStateModelValue, finalStateModelValue)) {
        emits('update:modelValue', finalStateModelValue);
      }

      if (initialValidatedValue !== finalValidatedValue) {
        emits('update:validatedValue', finalValidatedValue);
      }

      if (initialSemanticValidationMessage !== finalSemanticValidationMessage) {
        emits('update:semanticValidationMessage', finalSemanticValidationMessage);
      }

      scheduleRender(reRenderImmediately);

      // TODO: remove this ... only for debugging purposes
      if (hasFocus.value) {
        emits('update:debugInfo', state.value, lastDerivedState.value);
      }
    }
  };

  const runComponentExternalUpdateLoop = (
    modelValue: Record<string, string>,
    maskDefinition: MaskDefinition,
    state: Ref<MaskState>,
    lastDerivedState: Ref<MaskDerivedState>,
  ) => {
    const initialValidatedValue = lastDerivedState.value.validatedStringEncodedValue;
    const initialSemanticValidationMessage = lastDerivedState.value.semanticValidationMessage;

    let _state = updateMaskStateValues(state.value, getInternalModelValueExternalFromModel(modelValue, maskDefinition));
    let _lastDerivedState = getDerivedState(_state, maskDefinition);

    if (!_lastDerivedState.valueSpace.includes(_state.caretPositionInValueSpace)) {
      const closestValidValueSpaceCoordinates = findClosestValidValueSpaceCoordinates(_lastDerivedState, _state.caretPositionInValueSpace);

      if (closestValidValueSpaceCoordinates !== undefined) {
        _state = updateMaskStateCaretAndSelection(_state, closestValidValueSpaceCoordinates, closestValidValueSpaceCoordinates);
        _lastDerivedState = getDerivedState(_state, maskDefinition);
      }
    }

    state.value = _state;
    lastDerivedState.value = _lastDerivedState;

    const finalValidatedValue = lastDerivedState.value.validatedStringEncodedValue;
    const finalSemanticValidationMessage = lastDerivedState.value.semanticValidationMessage;

    if (initialValidatedValue !== finalValidatedValue) {
      emits('update:validatedValue', finalValidatedValue);
    }

    if (initialSemanticValidationMessage !== finalSemanticValidationMessage) {
      emits('update:semanticValidationMessage', finalSemanticValidationMessage);
    }

    scheduleRender();

    // TODO: remove this ... only for debugging purposes
    if (hasFocus.value) {
      emits('update:debugInfo', state.value, lastDerivedState.value);
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    const [stopEvent, patchOperations] = determinePatchOperationFromKeydownEvent(event, state.value, props.mask, lastDerivedState.value);

    if (stopEvent) {
      event.preventDefault();
      event.stopPropagation();
    }

    runComponentInternalUpdateLoop(patchOperations);
  };

  const handleBeforeInput = (event: InputEvent) => {
    const [stopEvent, patchOperations] = determinePatchOperationFromBeforeInputEvent(event, state.value);

    if (stopEvent) {
      event.preventDefault();
      event.stopPropagation();
    }

    runComponentInternalUpdateLoop(patchOperations);
  };

  const handleCompositionEnd = (event: CompositionEvent) => {
    const [stopEvent, patchOperations] = determinePatchOperationFromCompositionEndEvent(event, state.value);

    if (stopEvent) {
      event.preventDefault();
      event.stopPropagation();
    }

    runComponentInternalUpdateLoop(patchOperations);
  };

  const handleKeyup = (event: KeyboardEvent) => {
    const [stopEvent, patchOperations] = determinePatchOperationFromKeyupEvent(event);

    if (stopEvent) {
      event.preventDefault();
      event.stopPropagation();
    }

    runComponentInternalUpdateLoop(patchOperations);
  };

  const handleFocusin = () => {
    if (!hasFocus.value) {
      gainFocus();
    }
  };

  const handleFocusout = () => {
    if (hasFocus.value) {
      setTimeout(() => {
        if (containerRef.value && !containerRef.value.contains(document.activeElement)) {
          looseFocus();
        }
      }, 50);
    }
  };

  const handleDocumentSelectionChange = (event: Event) => {
    if (!hasFocus.value) {
      return;
    }

    const [stopEvent, patchOperations] = determinePatchOperationAfterSelectionChangeEvent(containerRef.value as HTMLElement, state.value, props.mask);

    if (stopEvent) {
      event.preventDefault();
      event.stopPropagation();
    }

    runComponentInternalUpdateLoop(patchOperations);
  };

  const gainFocus = () => {
    hasFocus.value = true;

    registerGlobalEvenListeners();

    emits('focus');
  };

  const looseFocus = () => {
    hasFocus.value = false;

    deregisterGlobalEventListener();

    emits('blur');
  };

  const registerGlobalEvenListeners = () => {
    document.addEventListener('selectionchange', handleDocumentSelectionChange);
    document.addEventListener('mousedown', handleDocumentMouseDown);
  };

  const deregisterGlobalEventListener = () => {
    document.removeEventListener('selectionchange', handleDocumentSelectionChange);
    document.removeEventListener('mousedown', handleDocumentMouseDown);
  };

  const handleDocumentMouseDown = (event: MouseEvent) => {
    if (hasFocus.value) {
      if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
        looseFocus();
      }
    }
  };

  const handleMousedown = () => {
    if (!hasFocus.value) {
      gainFocus();
    }
  };

  watch(
    () => [props.mask, props.modelValue],
    () => {
      runComponentExternalUpdateLoop(props.modelValue, props.mask, state, lastDerivedState);
    },
  );

  onMounted(() => {
    scheduleRender();
  });

  onBeforeUnmount(() => {
    deregisterGlobalEventListener();
  });
</script>

<style scoped>
  .masked-text-container {
    line-height: 1.2;
  }

  .masked-text-container:focus {
    outline: none;
  }
  .masked-text-container :deep(div) {
    display: inline-block;
  }

  .masked-text-container :deep(.section-input) {
    cursor: text;
    border-bottom: 1px solid transparent;
  }
  .masked-text-container :deep(:focus) {
    outline: none;
  }

  .masked-text-container.has-focus :deep(.section-input.active) {
    background-color: rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  }

  .masked-text-container :deep(.section-input),
  .masked-text-container :deep(.placeholder-caret) {
    line-height: 1.2;
    height: 1.2rem;
    position: relative;
    top: 0;
  }

  .masked-text-container :deep(.mask-char-input) {
    color: rgba(0, 0, 0, 1);
  }

  .masked-text-container :deep(.section-fixed) {
    color: rgba(0, 100, 200, 0.8);
    pointer-events: none;
  }
  .masked-text-container :deep(.mask-char-mask) {
    color: rgba(0, 0, 0, 0.4);
  }
  .masked-text-container :deep(.mask-char-mask) {
    color: rgba(0, 0, 0, 0.4);
  }

  .masked-text-container :deep(.semantic-error),
  .masked-text-container :deep(.semantic-error.section-input),
  .masked-text-container :deep(.semantic-error.section-input.active) {
    background-color: rgba(200, 200, 0, 0.2);
    border-bottom: 1px solid rgba(222, 180, 143, 0.5);
  }
  .masked-text-container :deep(.syntax-error),
  .masked-text-container :deep(.syntax-error.section-input),
  .masked-text-container :deep(.syntax-error.section-input.active) {
    background-color: rgba(255, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 0, 0, 0.5);
  }
</style>
