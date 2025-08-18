<template>
  <label>stringsMask</label>
  <MaskedText :mask="stringsMask" v-model="stringsValue" @update:debug-info="updateDebugInfo" />
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, type MaskState } from '@/lib/masked-text';
  import { StringsMask } from '@/lib/masked-text/masks';

  const stringsValue = ref({ block1: '仕方がない', block2: '👨🏾‍💻👩🏻‍🚀🧑🏿‍🎨👨‍👩‍👧‍👦👨‍👨‍👧‍👧👩‍👩‍👦‍👦🏴󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁳󠁣󠁴󠁿🏴󠁧󠁢󠁷󠁬󠁳󠁿1️⃣2️⃣3️⃣*️⃣#️⃣🤦🏼‍♀️🙍🏾‍♂️🧑‍💼', block3: 'H̸̡̪̯ͨ͊̽̅̾̎Ȩ̬̩̾͛ͪ̈́̀́͘ ' } as Record<string, string>);

  const stringsMask = StringsMask();

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
