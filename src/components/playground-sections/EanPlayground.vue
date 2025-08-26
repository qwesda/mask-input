<template>
  <div class="playground-masks">
    <label>EAN-13 Mask (European Article Number)</label>
    <MaskedText :mask="eanMask1" v-model="eanValue1" @update:debug-info="updateDebugInfo" />

    <label>EAN-13 Mask (with example: 4006381333931 - Haribo Gummy Bears)</label>
    <MaskedText :mask="eanMask2" v-model="eanValue2" @update:debug-info="updateDebugInfo" />

    <label>EAN-13 Mask (with example: 8901030895555 - Indian product)</label>
    <MaskedText :mask="eanMask3" v-model="eanValue3" @update:debug-info="updateDebugInfo" />

    <label>EAN-13 Mask (empty for testing)</label>
    <MaskedText :mask="eanMask4" v-model="eanValue4" @update:debug-info="updateDebugInfo" />

    <label>EAN-13 Mask (Coca-Cola example: 5449000000996)</label>
    <MaskedText :mask="eanMask5" v-model="eanValue5" @update:debug-info="updateDebugInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, type MaskState } from '@/lib/masked-text';
  import { EanMask } from '@/lib/masked-text/masks';

  const eanValue1 = ref({
    countryCode: '4',
    manufacturerCode: '012345',
    productCode: '67890',
    checkDigit: '1'
  } as Record<string, string>);

  const eanValue2 = ref({
    countryCode: '4',
    manufacturerCode: '006381',
    productCode: '33393',
    checkDigit: '1'
  } as Record<string, string>);

  const eanValue3 = ref({
    countryCode: '8',
    manufacturerCode: '901030',
    productCode: '89555',
    checkDigit: '5'
  } as Record<string, string>);

  const eanValue4 = ref({
    countryCode: '',
    manufacturerCode: '',
    productCode: '',
    checkDigit: ''
  } as Record<string, string>);

  const eanValue5 = ref({
    countryCode: '5',
    manufacturerCode: '449000',
    productCode: '00099',
    checkDigit: '6'
  } as Record<string, string>);

  const eanMask1 = EanMask();
  const eanMask2 = EanMask();
  const eanMask3 = EanMask();
  const eanMask4 = EanMask();
  const eanMask5 = EanMask();

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
