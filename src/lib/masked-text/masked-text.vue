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
  import { onMounted, onUnmounted, ref, type Ref, watch } from 'vue';
  import type { MaskDefinition, MaskDerivedState, MaskState } from './base/types';
  import { getDerivedState, getInitialMaskState, updateMaskStateCaretAndSelection, updateMaskStateValues } from './base/index';

  import {
    modelValuesEqual,
    findClosestValidValueSpaceCoordinates,
    getExternalModelValueFromInternalModel,
    getInternalModelValueExternalFromModel,
  } from './base/helper';

  import { applyPatchOperations } from './base/applyPatchOperations';

  import {
    determinePatchOperationFromBeforeInputEvent,
    determinePatchOperationFromCompositionEndEvent,
    determinePatchOperationFromKeydownEvent,
    determinePatchOperationFromKeyupEvent,
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
  const containerRef: Ref<HTMLDivElement | undefined> = ref<HTMLDivElement>();

  const render = () => {
    if (containerRef.value) {
      containerRef.value.innerHTML = lastDerivedState.value.inputHTMLString;

      if (hasFocus.value) {
        const caretSpan: HTMLSpanElement | null = containerRef.value.querySelector('.placeholder-caret');
        const selectionEndSpan: HTMLSpanElement | null = containerRef.value.querySelector('.placeholder-selection-end');
        const selection = window.getSelection();

        if (selection && caretSpan) {
          selection.removeAllRanges();
          selection.setBaseAndExtent(selectionEndSpan || caretSpan, 0, caretSpan, 0);
        }
      }
    }
  };

  const runComponentInternalUpdateLoop = (event: Event | undefined, patchOperations: PatchOperation[] | undefined) => {
    const initialStateModelValue = getExternalModelValueFromInternalModel(state.value.values);
    const initialValidatedValue = lastDerivedState.value.validatedStringEncodedValue;
    const initialSemanticValidationMessage = lastDerivedState.value.semanticValidationMessage;

    if (patchOperations !== undefined) {
      [state.value, lastDerivedState.value] = applyPatchOperations(patchOperations, state.value, props.mask, lastDerivedState.value);

      if (event) {
        event.preventDefault();
      }

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

      render();

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

    render();

    // TODO: remove this ... only for debugging purposes
    if (hasFocus.value) {
      emits('update:debugInfo', state.value, lastDerivedState.value);
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    const patchOperations = determinePatchOperationFromKeydownEvent(event, state.value, props.mask, lastDerivedState.value);

    runComponentInternalUpdateLoop(event, patchOperations);
  };

  const handleBeforeInput = (event: InputEvent) => {
    const patchOperations = determinePatchOperationFromBeforeInputEvent(event, state.value, props.mask, lastDerivedState.value);

    runComponentInternalUpdateLoop(event, patchOperations);
  };

  const handleCompositionEnd = (event: CompositionEvent) => {
    const patchOperations = determinePatchOperationFromCompositionEndEvent(event, state.value, props.mask, lastDerivedState.value);

    runComponentInternalUpdateLoop(event, patchOperations);
  };

  const handleKeyup = (event: KeyboardEvent) => {
    const patchOperations = determinePatchOperationFromKeyupEvent(event, state.value, props.mask, lastDerivedState.value);

    runComponentInternalUpdateLoop(event, patchOperations);
  };

  const handleFocusin = (event: FocusEvent) => {
    if (!hasFocus.value) {
      gainFocus();
    }
  };

  const handleFocusout = (event: FocusEvent) => {
    if (hasFocus.value) {
      setTimeout(() => {
        if (containerRef.value && !containerRef.value.contains(document.activeElement)) {
          looseFocus();
        }
      }, 50);
    }
  };

  const gainFocus = () => {
    hasFocus.value = true;

    emits('focus');

    runComponentExternalUpdateLoop(props.modelValue, props.mask, state, lastDerivedState);
  };

  const looseFocus = () => {
    hasFocus.value = false;

    emits('blur');
  };

  const getClosestValueSpaceCoordinates = (event: MouseEvent): string | undefined => {
    const containerElement = event.currentTarget as HTMLElement;
    const containerRect = containerElement.getBoundingClientRect();
    const relativeX = event.clientX - containerRect.left;

    let closestValueSpaceCoordinates: string | undefined = undefined;
    let minDistance = Infinity;

    if (!containerRef.value) {
      return closestValueSpaceCoordinates;
    }

    const spans = containerRef.value.querySelectorAll('span');

    spans.forEach((span: Element) => {
      if (
        span.classList.contains('placeholder-caret') ||
        span.classList.contains('placeholder-selection-end') ||
        span.classList.contains('section-input') ||
        span.classList.contains('section-fixed')
      ) {
        return;
      }

      const spanElement = span as HTMLElement;
      const spanRect = spanElement.getBoundingClientRect();
      const spanRelativeLeft = spanRect.left - containerRect.left;
      const spanRelativeRight = spanRect.right - containerRect.left;

      let distance;

      if (relativeX < spanRelativeLeft) {
        distance = spanRelativeLeft - relativeX;
      } else if (relativeX > spanRelativeRight) {
        distance = relativeX - spanRelativeRight;
      } else {
        distance = 0;
      }

      if (distance < minDistance) {
        const clickWasRightish = relativeX > spanRelativeLeft + spanRect.width / 2;

        if (clickWasRightish) {
          if (spanElement.hasAttribute('data-value-pos-right')) {
            closestValueSpaceCoordinates = spanElement.getAttribute('data-value-pos-right')!;
          } else if (spanElement.hasAttribute('data-value-pos-left')) {
            closestValueSpaceCoordinates = spanElement.getAttribute('data-value-pos-left')!;
          }
        } else {
          if (spanElement.hasAttribute('data-value-pos-left')) {
            closestValueSpaceCoordinates = spanElement.getAttribute('data-value-pos-left')!;
          } else if (spanElement.hasAttribute('data-value-pos-right')) {
            closestValueSpaceCoordinates = spanElement.getAttribute('data-value-pos-right')!;
          }
        }

        if (closestValueSpaceCoordinates !== undefined) {
          minDistance = distance;
        }
      }
    });

    return closestValueSpaceCoordinates;
  };

  const handleMousedown = (event: MouseEvent) => {
    const closestValueSpaceCoordinates = getClosestValueSpaceCoordinates(event);

    if (closestValueSpaceCoordinates !== undefined) {
      state.value = updateMaskStateCaretAndSelection(state.value, closestValueSpaceCoordinates, closestValueSpaceCoordinates);

      if (!hasFocus.value) {
        gainFocus();
      }

      render();

      event.preventDefault();

      runComponentExternalUpdateLoop(props.modelValue, props.mask, state, lastDerivedState);
    }
  };

  watch(
    () => [props.mask, props.modelValue],
    () => {
      runComponentExternalUpdateLoop(props.modelValue, props.mask, state, lastDerivedState);
    },
  );

  onMounted(() => {
    render();
  });

  onUnmounted(() => {});
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
    top: 0px;
  }

  .masked-text-container :deep(.mask-char-input) {
    color: rgba(0, 0, 0, 1);
  }

  .masked-text-container :deep(.section-fixed) {
    color: rgba(0, 100, 200, 0.8);
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
