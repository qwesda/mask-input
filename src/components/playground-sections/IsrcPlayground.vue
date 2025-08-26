<template>
  <div class="playground-masks">
    <label>ISRC Mask (International Standard Recording Code)</label>
    <MaskedText :mask="isrcMask1" v-model="isrcValue1" @update:debug-info="updateDebugInfo" />

    <label>ISRC Mask (with example: US-S1Z-99-00001)</label>
    <MaskedText :mask="isrcMask2" v-model="isrcValue2" @update:debug-info="updateDebugInfo" />

    <label>ISRC Mask (with example: GB-AJY-12-34567)</label>
    <MaskedText :mask="isrcMask3" v-model="isrcValue3" @update:debug-info="updateDebugInfo" />

    <label>ISRC Mask (empty for testing)</label>
    <MaskedText :mask="isrcMask4" v-model="isrcValue4" @update:debug-info="updateDebugInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, type MaskState } from '@/lib/masked-text';
  import { IsrcMask } from '@/lib/masked-text/masks';

  const isrcValue1 = ref({
    countryCode: 'US',
    registrantCode: 'ABC',
    year: '24',
    designation: '12345'
  } as Record<string, string>);

  const isrcValue2 = ref({
    countryCode: 'US',
    registrantCode: 'S1Z',
    year: '99',
    designation: '00001'
  } as Record<string, string>);

  const isrcValue3 = ref({
    countryCode: 'GB',
    registrantCode: 'AJY',
    year: '12',
    designation: '34567'
  } as Record<string, string>);

  const isrcValue4 = ref({
    countryCode: '',
    registrantCode: '',
    year: '',
    designation: ''
  } as Record<string, string>);

  const isrcMask1 = IsrcMask();
  const isrcMask2 = IsrcMask();
  const isrcMask3 = IsrcMask();
  const isrcMask4 = IsrcMask();

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
