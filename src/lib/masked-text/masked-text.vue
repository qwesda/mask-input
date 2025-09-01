<template>
  <div
    ref="containerRef"
    class="masked-text-container"
    contenteditable="true"
    spellcheck="false"
    :class="{ 'has-focus': hasFocus }"
    @focusin.capture="handleFocusin"
    @focusout="handleFocusout"
    @mousedown.capture="handleMousedown"
    @keydown.capture="handleKeydown"
    @beforeinput.capture="handleBeforeInput"
    @compositionstart.capture="handleCompositionStart"
    @compositionupdate.capture="handleCompositionUpdate"
    @compositionend.capture="handleCompositionEnd"
    @copy.capture="copyWholeValue"
    @paste.capture="pasteWholeValue"
  />
</template>

<script lang="ts" setup>
  import { onBeforeUnmount, onMounted, ref, type Ref, watch } from 'vue';
  import type { MaskDefinition, MaskDerivedState, MaskState, PatchOperation } from './base/types';
  import { getDerivedState, getInitialMaskState, updateMaskStateCaretAndSelection, updateMaskStateValues } from './base/index';

  import {
    encodeValuesAsHtml,
    findClosestValidValueSpaceCoordinates,
    getExternalModelValueFromInternalModel,
    getInternalModelValueExternalFromModel,
    getSelectionNodeAndOffsetFromPositionInValueSpace,
    modelValuesEqual,
    parseValuesFromHtml,
  } from './base/helper';

  import { applyPatchOperations } from './base/applyPatchOperations';

  import {
    determinePatchOperationAfterSelectionChangeEvent,
    determinePatchOperationFromBeforeInputEvent,
    determinePatchOperationFromCompositionEndEvent,
    determinePatchOperationFromKeydownEvent,
  } from './base/determinePatchOperations';

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
  const isMouseDown = ref(false);
  const isIMEComposing = ref(false);
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
    if (containerRef.value && isRenderScheduled.value) {
      isRenderScheduled.value = false;

      if (containerRef.value.innerHTML != lastDerivedState.value.inputHTMLString) {
        containerRef.value.innerHTML = lastDerivedState.value.inputHTMLString;
      }

      if (hasFocus.value) {
        const [caretNode, caretOffset] = getSelectionNodeAndOffsetFromPositionInValueSpace(
          containerRef.value,
          state.value.caretPositionInValueSpace,
          lastDerivedState.value,
          props.mask,
        );

        const [selectionEndNode, selectionEndOffset] = getSelectionNodeAndOffsetFromPositionInValueSpace(
          containerRef.value,
          state.value.selectionEndPositionInValueSpace,
          lastDerivedState.value,
          props.mask,
        );

        const selection = window.getSelection();

        if (selection && caretNode && selectionEndNode) {
          try {
            selection.removeAllRanges();
            selection.setBaseAndExtent(selectionEndNode, selectionEndOffset, caretNode, caretOffset);
          } catch (error) {
            console.error('Failed to update selection:', error);
          }
        }
      }
    }
  };

  const runComponentInternalUpdateLoop = (patchOperations: PatchOperation[]) => {
    const initialStateModelValue = getExternalModelValueFromInternalModel(state.value.values);
    const initialValidatedValue = lastDerivedState.value.validatedStringEncodedValue;
    const initialSemanticValidationMessage = lastDerivedState.value.semanticValidationMessage;

    if (patchOperations.length > 0) {
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
    if (!hasFocus.value || isIMEComposing.value) {
      return;
    }

    const [stopEvent, patchOperations] = determinePatchOperationFromKeydownEvent(event, state.value, props.mask, lastDerivedState.value);

    if (stopEvent) {
      event.preventDefault();
      event.stopPropagation();
    }

    runComponentInternalUpdateLoop(patchOperations);
  };

  const handleBeforeInput = (event: InputEvent) => {
    if (!hasFocus.value || isIMEComposing.value) {
      return;
    }

    const [stopEvent, patchOperations] = determinePatchOperationFromBeforeInputEvent(event, state.value);

    if (stopEvent) {
      event.preventDefault();
      event.stopPropagation();
    }

    runComponentInternalUpdateLoop(patchOperations);
  };

  const handleCompositionStart = (event: CompositionEvent) => {
    event.stopPropagation();
    event.preventDefault();

    isIMEComposing.value = true;
  };

  const handleCompositionUpdate = (event: CompositionEvent) => {
    isIMEComposing.value = true;
  };

  const handleCompositionEnd = (event: CompositionEvent) => {
    isIMEComposing.value = false;

    let stopEvent = false;
    let patchOperations: PatchOperation[] = [];

    if (event.data) {
      [stopEvent, patchOperations] = determinePatchOperationFromCompositionEndEvent(event, state.value);
    } else {
      patchOperations.push({
        op: 'set-cursor-position',
        caretPositionInValueSpace: state.value.caretPositionInValueSpace,
        keepSelectionEnd: false,
        reRenderImmediately: true,
      });
    }

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
          loseFocus();
        }
      }, 50);
    }
  };

  const handleDocumentSelectionChange = (event: Event) => {
    if (!hasFocus.value || isIMEComposing.value || isMouseDown.value) {
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

    registerGlobalEventListeners();

    emits('focus');
  };

  const loseFocus = () => {
    hasFocus.value = false;

    deregisterGlobalEventListeners();

    runComponentInternalUpdateLoop([{ op: 'apply-value-normalization' }]);

    emits('blur');
  };

  const registerGlobalEventListeners = () => {
    document.addEventListener('selectionchange', handleDocumentSelectionChange);
    document.addEventListener('mouseup', handleDocumentMouseUp);
    document.addEventListener('mousedown', handleDocumentMouseDown);
  };

  const deregisterGlobalEventListeners = () => {
    document.removeEventListener('selectionchange', handleDocumentSelectionChange);
    document.removeEventListener('mouseup', handleDocumentMouseUp);
    document.removeEventListener('mousedown', handleDocumentMouseDown);
  };

  const handleDocumentMouseUp = (event: MouseEvent) => {
    isMouseDown.value = false;

    const [_, patchOperations] = determinePatchOperationAfterSelectionChangeEvent(containerRef.value as HTMLElement, state.value, props.mask);

    runComponentInternalUpdateLoop(patchOperations);
  };

  const handleDocumentMouseDown = (event: MouseEvent) => {
    if (hasFocus.value) {
      if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
        loseFocus();
      }
    }
  };

  const handleMousedown = () => {
    if (!hasFocus.value) {
      gainFocus();
    }

    isMouseDown.value = true;
  };

  const copyWholeValue = async (event: ClipboardEvent) => {
    if (event.clipboardData) {
      if (lastDerivedState.value.validatedStringEncodedValue !== undefined) {
        event.clipboardData.setData('text/plain', lastDerivedState.value.validatedStringEncodedValue);
      }

      const htmlValues = encodeValuesAsHtml(props.mask, state.value.values);

      event.clipboardData.setData('text/html', htmlValues);

      event.preventDefault();
    }
  };

  const pasteWholeValue = async () => {
    try {
      const clipboardData = await navigator.clipboard.read();

      for (const item of clipboardData) {
        if (item.types.includes('text/html')) {
          const htmlBlob = await item.getType('text/html');
          const htmlText = await htmlBlob.text();
          const values = parseValuesFromHtml(htmlText);

          if (values) {
            runComponentInternalUpdateLoop([{ op: 'set-values', values: values }]);

            return;
          }
        }

        if (item.types.includes('text/plain')) {
          const textBlob = await item.getType('text/plain');
          const plainText = await textBlob.text();

          if (props.mask.getValuesFromStringRepresentation) {
            const values = props.mask.getValuesFromStringRepresentation(plainText);

            runComponentInternalUpdateLoop([{ op: 'set-values', values: values }]);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
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
    deregisterGlobalEventListeners();
  });
</script>

<style scoped>
  .masked-text-container:focus {
    outline: none;
  }

  .masked-text-container.has-focus :deep(.section-input.active) {
    background-color: rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
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
