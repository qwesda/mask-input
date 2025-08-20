<template>
  <div class="playground-masks">
    <label>stringsMask with funky graphemes</label>
    <MaskedText :mask="stringsMask" v-model="stringsValue1" @update:debug-info="updateDebugInfo" />

    <label>stringsMask mostly blocks</label>
    <MaskedText :mask="stringsMask" v-model="stringsValue2" @update:debug-info="updateDebugInfo" />

    <label>stringsMask empty blocks</label>
    <MaskedText :mask="stringsMask" v-model="stringsValue3" @update:debug-info="updateDebugInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, type MaskState } from '@/lib/masked-text';
  import { StringsMask } from '@/lib/masked-text/masks';

  const stringsValue1 = ref({ block1: '仕方がない', block2: '👨🏾‍💻👩🏻‍🚀🧑🏿‍🎨👨‍👩‍👧‍👦👨‍👨‍👧‍👧👩‍👩‍👦‍👦🏴󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁳󠁣󠁴󠁿🏴󠁧󠁢󠁷󠁬󠁳󠁿1️⃣2️⃣3️⃣*️⃣#️⃣🤦🏼‍♀️🙍🏾‍♂️🧑‍💼', block3: 'H̸̡̪̯ͨ͊̽̅̾̎Ȩ̬̩̾͛ͪ̈́̀́͘ ' } as Record<string, string>);
  const stringsValue2 = ref({} as Record<string, string>);
  const stringsValue3 = ref({ block3: '-' } as Record<string, string>);

  const stringsMask = StringsMask();

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
