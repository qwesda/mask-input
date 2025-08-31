<template>
  <div class="playground-masks">
    <label>stringsMask with funky graphemes</label>
    <MaskedText :mask="stringsMaskWithFixedSections" v-model="stringsValue1" @update:debug-info="updateDebugInfo" />

    <label>stringsMask mostly blocks</label>
    <MaskedText :mask="stringsMaskWithoutFixedSections" v-model="stringsValue2" @update:debug-info="updateDebugInfo" />

    <label>stringsMask empty blocks</label>
    <MaskedText :mask="stringsMaskWithFixedSections" v-model="stringsValue3" @update:debug-info="updateDebugInfo" />

    <label>stringsMask empty blocks/no </label>
    <MaskedText :mask="stringsMaskWithoutFixedSections" v-model="stringsValue3" @update:debug-info="updateDebugInfo" />

    <label>stringsMask empty blocks</label>
    <MaskedText :mask="stringsMaskWithPlaceholderWithFixedSections" v-model="stringsValue3" @update:debug-info="updateDebugInfo" />

    <label>stringsMask empty blocks/no </label>
    <MaskedText :mask="stringsMaskWithPlaceholderWithoutFixedSections" v-model="stringsValue3" @update:debug-info="updateDebugInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, type MaskState } from '@/lib/masked-text';

  const stringsValue1 = ref({ block1: '仕方がない', block2: '👨🏾‍💻👩🏻‍🚀🧑🏿‍🎨👨‍👩‍👧‍👦👨‍👨‍👧‍👧👩‍👩‍👦‍👦🏴󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁳󠁣󠁴󠁿🏴󠁧󠁢󠁷󠁬󠁳󠁿1️⃣2️⃣3️⃣*️⃣#️⃣🤦🏼‍♀️🙍🏾‍♂️🧑‍💼', block3: 'H̸̡̪̯ͨ͊̽̅̾̎Ȩ̬̩̾͛ͪ̈́̀́͘ ' } as Record<string, string>);
  const stringsValue2 = ref({} as Record<string, string>);
  const stringsValue3 = ref({ block3: '' } as Record<string, string>);

  import type { MaskCharacter, MaskDefinition } from '@/lib/masked-text/base/types';
  import { MaskSectionFixed, MaskSectionInput } from '@/lib/masked-text';

  const stringsEncodeValidatedValue = (values: Record<string, string[]>): string | undefined => {
    const block1 = (values['block1'] ?? []).join('');
    const block2 = (values['block2'] ?? []).join('');
    const block3 = (values['block3'] ?? []).join('');
    const block4 = (values['block4'] ?? []).join('');

    return `${block1}.${block2}.${block3}.${block4}`;
  };

  const stringsBlockWithoutPlaceholderMaskFn = (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
    const sectionValue = values[sectionSlug] ?? [];

    return sectionValue.map((c) => {
      return { char: c, type: 'value' as const };
    });
  };

  const stringsBlockWithPlaceholderMaskFn = (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
    const sectionValue = values[sectionSlug] ?? [];

    if (sectionValue.length === 0) {
      return [{ char: sectionSlug, type: 'mask' }];
    }

    return sectionValue.map((c) => {
      return { char: c, type: 'value' as const };
    });
  };

  const stringsBlockWithoutPlaceholderOptionsLeft = {
    maskingFn: stringsBlockWithoutPlaceholderMaskFn,
    alignment: 'left' as const,
  };

  const stringsBlockWithoutPlaceholderOptionsRight = {
    maskingFn: stringsBlockWithoutPlaceholderMaskFn,
    alignment: 'right' as const,
  };

  const stringsBlockWithPlaceholderOptionsLeft = {
    maskingFn: stringsBlockWithPlaceholderMaskFn,
    alignment: 'left' as const,
  };

  const stringsBlockWithPlaceholderOptionsRight = {
    maskingFn: stringsBlockWithPlaceholderMaskFn,
    alignment: 'right' as const,
  };

  const stringsMaskWithFixedSections = {
    encodeValidatedValue: stringsEncodeValidatedValue,
    sections: [
      MaskSectionInput('block1', stringsBlockWithoutPlaceholderOptionsLeft),
      MaskSectionFixed(' | '),
      MaskSectionInput('block2', stringsBlockWithoutPlaceholderOptionsRight),
      MaskSectionFixed(' | '),
      MaskSectionInput('block3', stringsBlockWithoutPlaceholderOptionsLeft),
      MaskSectionFixed(' | '),
      MaskSectionInput('block4', stringsBlockWithoutPlaceholderOptionsLeft),
    ],
  };
  const stringsMaskWithoutFixedSections = {
    encodeValidatedValue: stringsEncodeValidatedValue,
    sections: [
      MaskSectionInput('block1', stringsBlockWithoutPlaceholderOptionsLeft),
      MaskSectionInput('block2', stringsBlockWithoutPlaceholderOptionsRight),
      MaskSectionInput('block3', stringsBlockWithoutPlaceholderOptionsLeft),
      MaskSectionInput('block4', stringsBlockWithoutPlaceholderOptionsLeft),
    ],
  };

  const stringsMaskWithPlaceholderWithFixedSections = {
    encodeValidatedValue: stringsEncodeValidatedValue,
    sections: [
      MaskSectionInput('block1', stringsBlockWithPlaceholderOptionsLeft),
      MaskSectionFixed(' | '),
      MaskSectionInput('block2', stringsBlockWithPlaceholderOptionsRight),
      MaskSectionFixed(' | '),
      MaskSectionInput('block3', stringsBlockWithPlaceholderOptionsLeft),
      MaskSectionFixed(' | '),
      MaskSectionInput('block4', stringsBlockWithPlaceholderOptionsLeft),
    ],
  };
  const stringsMaskWithPlaceholderWithoutFixedSections = {
    encodeValidatedValue: stringsEncodeValidatedValue,
    sections: [
      MaskSectionInput('block1', stringsBlockWithPlaceholderOptionsLeft),
      MaskSectionInput('block2', stringsBlockWithPlaceholderOptionsRight),
      MaskSectionInput('block3', stringsBlockWithPlaceholderOptionsLeft),
      MaskSectionInput('block4', stringsBlockWithPlaceholderOptionsLeft),
    ],
  };

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
