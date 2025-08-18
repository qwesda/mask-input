<template>
  <div ref="containerRef">
    <div
      :class="['masked-text-container', { 'has-focus': hasFocus }]"
      @mousedown.capture="handleMousedown"
      @mouseup.capture="handleMouseup"
      @focusin="handleFocusin"
      @focusout="handleFocusout"
    >
      <div ref="preInputHTMLRef" class="text-overlay" v-html="lastDerivedState.preInputHTMLString" />

      <div
        ref="inputRef"
        autofocus
        contenteditable="plaintext-only"
        class="masked-text-input"
        style="width: 4px; margin-left: 0; margin-right: -4px; background: transparent"
        @keydown.capture="handleKeydown"
        @keyup.capture="handleKeyup"
        @beforeinput="handleBeforeInput"
        @compositionend="handleCompositionEnd"
      />

      <div ref="postInputHTMLRef" class="text-overlay" v-html="lastDerivedState.postInputHTMLString" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, type Ref, watch } from 'vue';
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
  const preInputHTMLRef: Ref<HTMLDivElement | undefined> = ref<HTMLDivElement>();
  const inputRef: Ref<HTMLDivElement | undefined> = ref<HTMLDivElement>();
  const postInputHTMLRef: Ref<HTMLSpanElement | undefined> = ref<HTMLSpanElement>();

  const runComponentInternalUpdateLoop = (event: Event | undefined, patchOperations: PatchOperation[] | undefined) => {
    const initialStateModelValue = getExternalModelValueFromInternalModel(state.value.values);
    const initialValidatedValue = lastDerivedState.value.validatedStringEncodedValue;
    const initialSemanticValidationMessage = lastDerivedState.value.semanticValidationMessage;

    if (patchOperations !== undefined) {
      [state.value, lastDerivedState.value] = applyPatchOperations(patchOperations, state.value, props.mask, lastDerivedState.value);

      if (event) {
        event.preventDefault();
      }

      const clearInputRefContent = patchOperations.some((patchOperation) => patchOperation.op === 'insert-character');
      resetInputCursorAnimation(clearInputRefContent);
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

    // TODO: remove this ... only for debugging purposes
    if (hasFocus.value) {
      emits('update:debugInfo', state.value, lastDerivedState.value);
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

    let _state = updateMaskStateValues(state.value, getInternalModelValueExternalFromModel(modelValue));
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

    // TODO: remove this ... only for debugging purposes
    if (hasFocus.value) {
      emits('update:debugInfo', state.value, lastDerivedState.value);
    }
  };

  function resetInputCursorAnimation(clearContent: boolean = false) {
    if (inputRef.value) {
      if (clearContent) {
        inputRef.value.textContent = '';
      }

      requestAnimationFrame(() => {
        if (inputRef.value) {
          inputRef.value.blur();

          requestAnimationFrame(() => {
            if (inputRef.value) {
              inputRef.value.focus();
            }
          });
        }
      });
    }
  }

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
      hasFocus.value = true;

      emits('focus');

      runComponentExternalUpdateLoop(props.modelValue, props.mask, state, lastDerivedState);
    }
  };

  const handleFocusout = (event: FocusEvent) => {
    if (hasFocus.value) {
      setTimeout(() => {
        if (containerRef.value && !containerRef.value.contains(document.activeElement)) {
          hasFocus.value = false;

          emits('blur');
        }
      }, 50);
    }
  };

  const getClosestValueSpaceCoordinates = (event: MouseEvent) => {
    const containersToCheck: HTMLElement[] = [preInputHTMLRef.value, postInputHTMLRef.value].filter((x) => x !== undefined) as HTMLElement[];
    const containerElement = event.currentTarget as HTMLElement;
    const containerRect = containerElement.getBoundingClientRect();
    const relativeX = event.clientX - containerRect.left;

    let closestValueSpaceCoordinates: string | undefined = undefined;
    let minDistance = Infinity;

    for (const container of containersToCheck) {
      if (!container) {
        continue;
      }

      const spans = container.querySelectorAll('span');

      spans.forEach((span: Element) => {
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
    }

    return closestValueSpaceCoordinates;
  };

  const handleMousedown = (event: MouseEvent) => {
    const closestValueSpaceCoordinates = getClosestValueSpaceCoordinates(event);

    if (closestValueSpaceCoordinates !== undefined) {
      state.value = updateMaskStateCaretAndSelection(state.value, closestValueSpaceCoordinates, closestValueSpaceCoordinates);

      if (inputRef.value) {
        inputRef.value.focus();
      }

      event.preventDefault();

      runComponentExternalUpdateLoop(props.modelValue, props.mask, state, lastDerivedState);
    }
  };

  const handleMouseup = (event: MouseEvent) => {
    const closestValueSpaceCoordinates = getClosestValueSpaceCoordinates(event);

    if (closestValueSpaceCoordinates !== undefined) {
      state.value = updateMaskStateCaretAndSelection(state.value, closestValueSpaceCoordinates, closestValueSpaceCoordinates);

      if (inputRef.value) {
        inputRef.value.focus();
      }

      runComponentExternalUpdateLoop(props.modelValue, props.mask, state, lastDerivedState);
    }
  };

  watch(
    () => [props.mask, props.modelValue],
    () => {
      runComponentExternalUpdateLoop(props.modelValue, props.mask, state, lastDerivedState);
    },
    { immediate: true },
  );
</script>

<style scoped>
  .masked-text-container {
    display: flex;
    flex-direction: row;
    position: relative;
    line-height: 1;
  }

  .masked-text-input {
    white-space: pre;
    padding: 0;
    margin: 0;
    line-height: 1;
    height: 1em;

    border: none;
    outline: none;
    flex-shrink: 1;
    z-index: 1;
  }

  .masked-text-shadow-input {
    white-space: pre;
    padding: 0;
    margin: 0;
    line-height: 1;

    border: none;
    outline: none;
    flex-grow: 1;
  }

  .masked-text-input:focus {
    outline: none;
  }

  .text-overlay {
    display: inline-block;
    line-height: 1;

    padding: 0;
    margin: 0;
    border: none;
    outline: none;

    white-space: pre;
    pointer-events: none;
    border-bottom: 1px solid transparent;
  }

  .text-overlay :deep(.section-input) {
    cursor: text;
  }

  .text-overlay :deep(div) {
    display: inline-block;
  }

  .masked-text-container.has-focus .text-overlay :deep(.section-input.active) {
    background-color: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  }

  .text-overlay :deep(.mask-char-input) {
    color: rgba(0, 0, 0, 1);
  }

  .text-overlay :deep(.fixed-mask-input) {
    color: rgba(0, 0, 0, 1);
  }
  .text-overlay :deep(.mask-char-mask) {
    color: rgba(0, 0, 0, 0.4);
  }
  .masked-text-container.has-focus .text-overlay :deep(.selected) {
    background-color: rgba(0, 0, 0, 0.2);
  }

  .text-overlay :deep(.semantic-error),
  .text-overlay :deep(.semantic-error.section-input),
  .text-overlay :deep(.semantic-error.section-input.active) {
    background-color: rgba(200, 200, 0, 0.2);
    border-bottom: 1px solid rgba(222, 180, 143, 0.5);
  }
  .text-overlay :deep(.syntax-error),
  .text-overlay :deep(.syntax-error.section-input),
  .text-overlay :deep(.syntax-error.section-input.active) {
    background-color: rgba(255, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 0, 0, 0.5);
  }
</style>
