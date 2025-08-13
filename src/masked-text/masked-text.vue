<template>
  <div class="masked-text-container">
    <div @click="setFocus">
      <span class="text-overlay" ref="preInputHTMLRef" v-html="lastDerivedState.preInputHTMLString" />

      <input
        ref="inputRef"
        @input.capture="handleInput"
        @keydown.capture="handleKeydown"
        @focus="handleFocus"
        @blur="handleBlur"
        @click="handleClick"
        class="masked-text-input"
        autofocus
        style="width: 4px; margin-left: 0; margin-right: -4px; background: transparent"
      />

      <span class="text-overlay" ref="postInputHTMLRef" v-html="lastDerivedState.postInputHTMLString" />
    </div>

    <div>
      <input
        ref="inputShadowRef"
        @input.capture="handleInput"
        @keydown.capture="handleKeydown"
        @focus="handleFocus"
        @blur="handleBlur"
        @click="handleClick"
        class="masked-text-shadow-input"
        autofocus
        disabled
        :value="lastDerivedState.textInputDisplayString"
      />
    </div>
  </div>

  <template v-if="hasFocus">
    <i>state</i>
    <var-dump :data="state" />

    <i>lastDerivedState</i>
    <var-dump :data="lastDerivedState" />
  </template>
</template>

<script setup lang="ts">
  import { ref, watch, type Ref } from 'vue';
  import {
    type MaskDefinition,
    type MaskState,
    type MaskDerivedState,
    getInitialMaskState,
    getDerivedState,
    updateMaskStateValues,
    updateMaskStateCaretAndSelection,
    findClosestValidValueSpaceCoordinates,
  } from './masks/base.ts';

  import VarDump from '@/helper/var-dump.vue';

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

  const state: Ref<MaskState> = ref(getInitialMaskState(['', '']));
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
  };

  const handleInput = (event: Event) => {
    console.log('handleInput', event);
    updateInputRefSize();
  };
  const handleKeydown = (event: KeyboardEvent) => {
    console.log('handleKeydown', event);
  };
  const handleFocus = (event: FocusEvent) => {
    console.log('handleFocus', event);
  };
  const handleBlur = (event: FocusEvent) => {
    console.log('handleBlur', event);
  };
  const handleClick = (event: MouseEvent) => {
    console.log('handleClick', event);
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
      updateInputRefSize();
    },
    { immediate: true },
  );
</script>

<style scoped>
  .masked-text-container {
    display: flex;
    flex-direction: column;
  }
  .masked-text-container > * {
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
    font-size: 1rem;
    pointer-events: none;

    padding: 0;
    border: none;
    outline: none;

    font-family: monospace;
    white-space: pre;
  }

  .text-overlay :deep(.input-mask-char-input) {
    color: rgba(0, 0, 0, 1);
  }
  .text-overlay :deep(.input-mask-char-mask) {
    color: rgba(0, 0, 0, 0.2);
  }
  .text-overlay :deep(.fixed-mask) {
    color: oklch(71.5% 0.143 215.221);
  }
</style>
