<template>
  <div ref="containerRef">
    <div
      class="masked-text-container"
      @mousedown.capture="handleMousedown"
      @mouseup.capture="handleMouseup"
      @focusin="handleFocusin"
      @focusout="handleFocusout"
    >
      <div ref="preInputHTMLRef" class="text-overlay" v-html="lastDerivedState.preInputHTMLString" />

      <input
        ref="inputRef"
        autofocus
        class="masked-text-input"
        style="width: 4px; margin-left: 0; margin-right: -4px; background: transparent"
        @keydown.capture="handleKeydown"
        @keyup.capture="handleKeyup"
        @beforeinput="handleBeforeInput"
        @compositionend="handleCompositionEnd"
      />

      <div ref="postInputHTMLRef" class="text-overlay" v-html="lastDerivedState.postInputHTMLString" />

      <input ref="textMeasureHelperRef" style="visibility: hidden" type="text" />
    </div>

    <template v-if="hasFocus">
      <div style="display: flex; flex-direction: row; gap: 1em">
        <label style="display: flex; flex-direction: row; align-items: center"> <input v-model="showDebugState" type="checkbox" /> state </label>
        <label style="display: flex; flex-direction: row; align-items: center">
          <input v-model="showDebugLastDerivedState" type="checkbox" /> lastDerivedState
        </label>
      </div>

      <var-dump v-if="showDebugState" :data="state" />
      <var-dump v-if="showDebugLastDerivedState" :data="lastDerivedState" />
    </template>
  </div>
</template>

<script lang="ts" setup>
  import { ref, type Ref, watch } from 'vue';
  import {
    getDerivedState,
    getInitialMaskState,
    type MaskDefinition,
    type MaskDerivedState,
    type MaskState,
    updateMaskStateCaretAndSelection,
    updateMaskStateValues,
  } from './masks/base/index.ts';

  import VarDump from '@/helper/var-dump.vue';
  import { findClosestValidValueSpaceCoordinates, splitStringIntoGraphemes } from '@/masked-text/masks/base/helper.ts';
  import { applyPatchOperations } from '@/masked-text/masks/base/applyPatchOperations.ts';
  import {
    determinePatchOperationFromBeforeInputEvent,
    determinePatchOperationFromCompositionEndEvent,
    determinePatchOperationFromKeydownEvent,
    determinePatchOperationFromKeyupEvent,
  } from '@/masked-text/masks/base/determinePatchOperations.ts';

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

  const hasFocus = ref(false);

  const containerRef: Ref<HTMLDivElement | undefined> = ref<HTMLDivElement>();
  const preInputHTMLRef: Ref<HTMLInputElement | undefined> = ref<HTMLInputElement>();
  const inputRef: Ref<HTMLInputElement | undefined> = ref<HTMLInputElement>();
  const postInputHTMLRef: Ref<HTMLSpanElement | undefined> = ref<HTMLSpanElement>();
  const textMeasureHelperRef: Ref<HTMLInputElement | undefined> = ref<HTMLInputElement>();
  const inputShadowRef: Ref<HTMLInputElement | undefined> = ref<HTMLInputElement>();

  const updateInputRefSize = (clearInput: boolean = false) => {
    if (inputRef.value) {
      if (clearInput) {
        inputRef.value.value = '';
      }

      const text = inputRef.value.value;

      if (!text || !textMeasureHelperRef.value) {
        inputRef.value.style.width = '4px';
        inputRef.value.style.marginLeft = '0px';
        inputRef.value.style.marginRight = '-4px';
        return;
      }

      const measureElement = textMeasureHelperRef.value;
      const computedStyle = window.getComputedStyle(inputRef.value);

      // Font-related properties
      measureElement.style.minWidth = '0';
      measureElement.style.fontFamily = computedStyle.fontFamily;
      measureElement.style.fontSize = computedStyle.fontSize;
      measureElement.style.fontWeight = computedStyle.fontWeight;
      measureElement.style.fontStyle = computedStyle.fontStyle;
      measureElement.style.fontVariant = computedStyle.fontVariant;
      measureElement.style.fontStretch = computedStyle.fontStretch;
      measureElement.style.lineHeight = computedStyle.lineHeight;

      // Text spacing and transformation
      measureElement.style.letterSpacing = computedStyle.letterSpacing;
      measureElement.style.wordSpacing = computedStyle.wordSpacing;
      measureElement.style.textTransform = computedStyle.textTransform;
      measureElement.style.textIndent = computedStyle.textIndent;

      // Text rendering properties
      measureElement.style.textRendering = computedStyle.textRendering;
      // measureElement.style.fontSmooth = computedStyle.fontSmooth;
      // measureElement.style.webkitFontSmoothing = computedStyle.webkitFontSmoothing;
      // measureElement.style.mozOsxFontSmoothing = computedStyle.mozOsxFontSmoothing;

      // White space handling
      measureElement.style.whiteSpace = computedStyle.whiteSpace;

      // Writing mode and direction
      measureElement.style.writingMode = computedStyle.writingMode;
      measureElement.style.direction = computedStyle.direction;
      measureElement.style.unicodeBidi = computedStyle.unicodeBidi;

      // Feature settings that might affect rendering
      measureElement.style.fontFeatureSettings = computedStyle.fontFeatureSettings;
      measureElement.style.fontVariationSettings = computedStyle.fontVariationSettings;
      measureElement.style.fontKerning = computedStyle.fontKerning;
      measureElement.style.fontVariantLigatures = computedStyle.fontVariantLigatures;
      measureElement.style.fontVariantNumeric = computedStyle.fontVariantNumeric;

      // Set the text and measure
      measureElement.value = text;

      // Force layout calculation by accessing the `offsetWidth` property
      const offsetWidth = measureElement.offsetWidth;

      // Get the scroll width which represents the content width
      const textWidth = measureElement.scrollWidth;

      // Add small buffer
      const totalWidth = textWidth + 4;

      inputRef.value.style.width = `${totalWidth}px`;
      inputRef.value.style.marginLeft = '0px';
      inputRef.value.style.marginRight = '-4px';
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
    const patchOperations = determinePatchOperationFromKeydownEvent(event, state.value, props.mask, lastDerivedState.value);

    // console.log('handleKeydown', event.key + (event.isComposing ? ' composing' : ' non-composing'), patchOperations, event);

    if (patchOperations !== undefined) {
      [state.value, lastDerivedState.value] = applyPatchOperations(patchOperations, state.value, props.mask, lastDerivedState.value);

      event.preventDefault();

      resetInputCursorAnimation();
    }

    updateInputRefSize();
  };

  const handleBeforeInput = (event: InputEvent) => {
    const patchOperations = determinePatchOperationFromBeforeInputEvent(event, state.value, props.mask, lastDerivedState.value);

    // console.log('handleBeforeInput', event.data, patchOperations, event);

    if (patchOperations !== undefined) {
      [state.value, lastDerivedState.value] = applyPatchOperations(patchOperations, state.value, props.mask, lastDerivedState.value);

      event.preventDefault();

      resetInputCursorAnimation();
    }

    updateInputRefSize(true);
  };

  const handleCompositionEnd = (event: CompositionEvent) => {
    const patchOperations = determinePatchOperationFromCompositionEndEvent(event, state.value, props.mask, lastDerivedState.value);

    // console.log('handleKeydown', event.key + (event.isComposing ? ' composing' : ' non-composing'), patchOperations, event);

    if (patchOperations !== undefined) {
      [state.value, lastDerivedState.value] = applyPatchOperations(patchOperations, state.value, props.mask, lastDerivedState.value);

      event.preventDefault();

      resetInputCursorAnimation();
    }

    updateInputRefSize(true);
  };

  const handleKeyup = (event: KeyboardEvent) => {
    const patchOperations = determinePatchOperationFromKeyupEvent(event, state.value, props.mask, lastDerivedState.value);

    // console.log('handleKeyup', event.isComposing ? 'composing' : '', event.key);
    // console.log('handleKeyup', event.key + (event.isComposing ? ' composing' : ' non-composing'), patchOperations, event);

    if (patchOperations !== undefined) {
      [state.value, lastDerivedState.value] = applyPatchOperations(patchOperations, state.value, props.mask, lastDerivedState.value);

      event.preventDefault();

      resetInputCursorAnimation();
    }

    updateInputRefSize();
  };

  const handleFocusin = (event: FocusEvent) => {
    if (!hasFocus.value) {
      console.log('handleFocusin', event);
      // state.value = updateMaskStateCaretAndSelection(state.value, '0:0', '0:0');
      hasFocus.value = true;
    }
  };

  const handleFocusout = (event: FocusEvent) => {
    if (hasFocus.value) {
      setTimeout(() => {
        if (containerRef.value && !containerRef.value.contains(document.activeElement)) {
          console.log('handleFocusout', event);
          hasFocus.value = false;
        }
      }, 50);
    }
    // state.value = updateMaskStateCaretAndSelection(state.value, '0:0', '0:0');
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
