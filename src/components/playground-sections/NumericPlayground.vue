<template>
  <label>Date Mask Basic</label>
  <MaskedText :mask="numericMaskBasic" v-model="numericValue" @update:debug-info="updateDebugInfo" />

  <label>Date Mask Comma Separator</label>
  <MaskedText :mask="numericMaskCommaSeparator" v-model="numericValue" @update:debug-info="updateDebugInfo" />

  <label>Date Mask Space Separator</label>
  <MaskedText :mask="numericMaskSpaceSeparator" v-model="numericValue" @update:debug-info="updateDebugInfo" />

  <label>Date Mask European</label>
  <MaskedText :mask="numericMaskEuropean" v-model="numericValue" @update:debug-info="updateDebugInfo" />

  <label>Date Mask with Suffix</label>
  <MaskedText :mask="numericMaskWithSuffix" v-model="numericValue" @update:debug-info="updateDebugInfo" />

  <label>Date Mask with Prefixes</label>
  <MaskedText :mask="numericMaskWithPrefixes" v-model="numericValue" @update:debug-info="updateDebugInfo" />
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, MaskSectionFixed, type MaskState } from '@/lib/masked-text';
  import { NumericMask } from '@/lib/masked-text/masks';

  const numericValue = ref({ integers: '', decimals: '' } as Record<string, string>);

  const numericMaskBasic = NumericMask({
    decimalSeparator: '.',
    thousandSeparator: '',
    minIntegerDigits: 1,
    maxIntegerDigits: 10,
    minDecimalDigits: 0,
    maxDecimalDigits: 2,
  });

  const numericMaskCommaSeparator = NumericMask({
    decimalSeparator: '.',
    thousandSeparator: ',',
    minIntegerDigits: 1,
    maxIntegerDigits: 10,
    minDecimalDigits: 0,
    maxDecimalDigits: 2,
  });

  const numericMaskSpaceSeparator = NumericMask({
    decimalSeparator: '.',
    thousandSeparator: ' ',
    minIntegerDigits: 1,
    maxIntegerDigits: 10,
    minDecimalDigits: 0,
    maxDecimalDigits: 2,
  });

  const numericMaskEuropean = NumericMask({
    decimalSeparator: ',',
    thousandSeparator: '.',
    minIntegerDigits: 1,
    maxIntegerDigits: 10,
    minDecimalDigits: 0,
    maxDecimalDigits: 2,
  });

  const numericMaskWithSuffix = NumericMask({
    decimalSeparator: '.',
    thousandSeparator: ',',
    minIntegerDigits: 1,
    maxIntegerDigits: 10,
    minDecimalDigits: 0,
    maxDecimalDigits: 2,
    suffixes: [MaskSectionFixed('£')],
  });

  const numericMaskWithPrefixes = NumericMask({
    decimalSeparator: '.',
    thousandSeparator: ',',
    minIntegerDigits: 1,
    maxIntegerDigits: 10,
    minDecimalDigits: 0,
    maxDecimalDigits: 2,
    prefixes: [MaskSectionFixed('$')],
  });

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
