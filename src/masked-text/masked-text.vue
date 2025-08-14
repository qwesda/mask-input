<template>
  <div class="masked-text-container" @mousedown.capture="handleMousedown" @mouseup.capture="handleMouseup">
    <div class="text-overlay" ref="preInputHTMLRef" v-html="lastDerivedState.preInputHTMLString" />

    <input
      ref="inputRef"
      @input.capture="handleInput"
      @keydown.capture="handleKeydown"
      @keyup.capture="handleKeyup"
      @focus="handleFocus"
      @blur="handleBlur"
      @click="setFocus"
      class="masked-text-input"
      autofocus
      style="width: 4px; margin-left: 0; margin-right: -4px; background: transparent"
    />

    <div class="text-overlay" ref="postInputHTMLRef" v-html="lastDerivedState.postInputHTMLString" />
  </div>

  <template v-if="hasFocus">
    <div style="display: flex; flex-direction: row; gap: 1em">
      <label style="display: flex; flex-direction: row; align-items: center"> <input type="checkbox" v-model="showDebugState" /> state </label>
      <label style="display: flex; flex-direction: row; align-items: center">
        <input type="checkbox" v-model="showDebugLastDerivedState" /> lastDerivedState
      </label>
    </div>

    <var-dump v-if="showDebugState" :data="state" />
    <var-dump v-if="showDebugLastDerivedState" :data="lastDerivedState" />
  </template>
</template>

<script setup lang="ts">
  import { ref, watch, type Ref, nextTick } from 'vue';
  import {
    type MaskDefinition,
    type MaskState,
    type MaskDerivedState,
    getInitialMaskState,
    getDerivedState,
    updateMaskStateValues,
    updateMaskStateCaretAndSelection,
    findClosestValidValueSpaceCoordinates,
    determinePatchOperationFromKeyboardEvent,
    applyPatchOperations,
  } from './masks/base/index.ts';

  import VarDump from '@/helper/var-dump.vue';

  const showDebugState = ref(true);
  const showDebugLastDerivedState = ref(false);

  interface Props {
    mask: MaskDefinition;
    modelValue?: string[];
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
  });

  defineEmits<{
    'update:modelValue': [value: string[]];
  }>();

  const state: Ref<MaskState> = ref(getInitialMaskState(props.modelValue));
  const lastDerivedState: Ref<MaskDerivedState> = ref(getDerivedState(state.value, props.mask));

  const hasFocus = ref(true);

  const preInputHTMLRef: Ref<HTMLInputElement | undefined> = ref<HTMLInputElement>();
  const inputRef: Ref<HTMLInputElement | undefined> = ref<HTMLInputElement>();
  const postInputHTMLRef: Ref<HTMLSpanElement | undefined> = ref<HTMLSpanElement>();
  const inputShadowRef: Ref<HTMLInputElement | undefined> = ref<HTMLInputElement>();

  const updateInputRefSize = () => {
    if (inputRef.value) {
      const inputRefSize = inputRef.value.value.length;

      inputRef.value.style.width = inputRefSize ? `${inputRefSize}ch` : '4px';
      inputRef.value.style.marginLeft = inputRefSize ? `0px` : '0px';
      inputRef.value.style.marginRight = inputRefSize ? `0px` : '-4px';
    }
  };

  const runComponentUpdateLoop = (
    modelValue: string[],
    maskDefinition: MaskDefinition,
    state: Ref<MaskState>,
    lastDerivedState: Ref<MaskDerivedState>,
  ) => {
    let _state = updateMaskStateValues(state.value, [...modelValue]);
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

    updateInputRefSize();
  };

  const handleInput = (event: Event) => {
    console.log('handleInput', event);

    updateInputRefSize();
  };

  function resetInputCursorAnimation() {
    if (inputRef.value) {
      const currentSelectionStart = inputRef.value.selectionStart;
      const currentSelectionEnd = inputRef.value.selectionEnd;

      requestAnimationFrame(() => {
        if (inputRef.value) {
          inputRef.value.blur();

          requestAnimationFrame(() => {
            if (inputRef.value) {
              inputRef.value.setSelectionRange(currentSelectionStart, currentSelectionEnd);

              inputRef.value.focus();
            }
          });
        }
      });
    }
  }

  const handleKeydown = (event: KeyboardEvent) => {
    const patchOperations = determinePatchOperationFromKeyboardEvent('keydown', event, state.value, props.mask, lastDerivedState.value);

    console.log('handleKeydown', event.isComposing ? 'composing' : '', event, patchOperations);

    if (patchOperations !== undefined) {
      [state.value, lastDerivedState.value] = applyPatchOperations(patchOperations, state.value, props.mask, lastDerivedState.value);

      event.preventDefault();

      resetInputCursorAnimation();
    }
  };

  const handleKeyup = (event: KeyboardEvent) => {
    const patchOperations = determinePatchOperationFromKeyboardEvent('keyup', event, state.value, props.mask, lastDerivedState.value);

    console.log('handleKeyup', event.isComposing ? 'composing' : '', event, patchOperations);

    if (patchOperations !== undefined) {
      [state.value, lastDerivedState.value] = applyPatchOperations(patchOperations, state.value, props.mask, lastDerivedState.value);

      event.preventDefault();

      resetInputCursorAnimation();
    }
  };

  const handleFocus = (event: FocusEvent) => {
    // console.log('handleFocus', event);
  };

  const handleBlur = (event: FocusEvent) => {
    // console.log('handleBlur', event);
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

      runComponentUpdateLoop(props.modelValue, props.mask, state, lastDerivedState);
    }
  };

  const handleMouseup = (event: MouseEvent) => {
    const closestValueSpaceCoordinates = getClosestValueSpaceCoordinates(event);

    if (closestValueSpaceCoordinates !== undefined) {
      state.value = updateMaskStateCaretAndSelection(state.value, closestValueSpaceCoordinates, closestValueSpaceCoordinates);

      if (inputRef.value) {
        inputRef.value.focus();
      }

      runComponentUpdateLoop(props.modelValue, props.mask, state, lastDerivedState);
    }
  };

  const setFocus = (event: MouseEvent) => {
    if (inputRef.value) {
      inputRef.value.focus();
    }
  };

  watch(
    () => [props.mask, props.modelValue],
    () => {
      runComponentUpdateLoop(props.modelValue, props.mask, state, lastDerivedState);
    },
    { immediate: true },
  );

  watch(
    () => inputRef,
    (newValue) => {
      console.log('inputRef', newValue);
    },
  );
</script>

<style scoped>
  .masked-text-container {
    display: flex;
    flex-direction: row;
    position: relative;
  }

  .masked-text-input {
    font-family: monospace;
    white-space: pre;
    padding: 0;
    margin: 0;
    font-size: 1rem;

    border: none;
    outline: none;
    flex-shrink: 1;
    z-index: 1;
  }

  .masked-text-shadow-input {
    font-family: monospace;
    white-space: pre;
    padding: 0;
    margin: 0;
    font-size: 1rem;

    border: none;
    outline: none;
    flex-grow: 1;
  }

  .masked-text-input:focus {
    outline: none;
  }

  .text-overlay {
    display: inline-block;
    font-size: 1rem;

    padding: 0;
    border: none;
    outline: none;

    font-family: monospace;
    white-space: pre;
    pointer-events: none;
  }

  .text-overlay :deep(.section-input) {
    cursor: text;
  }

  .text-overlay :deep(div) {
    display: inline-block;
  }

  .text-overlay :deep(.section-input.active) {
    background-color: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  }

  .text-overlay :deep(.mask-char-input) {
    color: rgba(0, 0, 0, 1);
  }
  .text-overlay :deep(.mask-char-mask) {
    color: rgba(0, 0, 0, 0.2);
  }
  .text-overlay :deep(.selected) {
    background-color: rgba(0, 0, 0, 0.2);
  }
  .text-overlay :deep(.fixed-mask) {
    color: oklch(71.5% 0.143 215.221);
  }
</style>
