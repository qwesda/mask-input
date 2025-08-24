<template>
  <div class="playground-masks">
    <label>Date Mask Basic</label>
    <MaskedText :mask="numericMaskBasic" v-model="numericValue1" @update:debug-info="updateDebugInfo" />

    <label>Date Mask Comma Separator</label>
    <MaskedText :mask="numericMaskCommaSeparator" v-model="numericValue1" @update:debug-info="updateDebugInfo" />

    <label>Date Mask Space Separator</label>
    <MaskedText :mask="numericMaskSpaceSeparator" v-model="numericValue2" @update:debug-info="updateDebugInfo" />

    <label>Date Mask European</label>
    <MaskedText :mask="numericMaskEuropean" v-model="numericValue2" @update:debug-info="updateDebugInfo" />

    <label>Date Mask with Suffix</label>
    <MaskedText :mask="numericMaskWithSuffix" v-model="numericValue3" @update:debug-info="updateDebugInfo" />

    <label>Date Mask with Prefixes</label>
    <MaskedText :mask="numericMaskWithPrefixes" v-model="numericValue3" @update:debug-info="updateDebugInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, MaskSectionFixed, type MaskState } from '@/lib/masked-text';
  import { NumericMask } from '@/lib/masked-text/masks';

  const numericValue1 = ref({ integers: '1234567890', decimals: '0987654321' } as Record<string, string>);
  const numericValue2 = ref({ integers: '', decimals: '' } as Record<string, string>);
  const numericValue3 = ref({ integers: '12', decimals: '99' } as Record<string, string>);

  const numericMaskBasic = NumericMask({
    decimalSeparator: '.',
    thousandSeparator: '',
    minIntegerDigits: 1,
    minDecimalDigits: 2,
  });

  const numericMaskCommaSeparator = NumericMask({
    decimalSeparator: '.',
    thousandSeparator: ',',
    minIntegerDigits: 1,
    minDecimalDigits: 2,
  });

  const numericMaskSpaceSeparator = NumericMask({
    decimalSeparator: '.',
    thousandSeparator: ' ',
    minIntegerDigits: 1,
    minDecimalDigits: 2,
  });

  const numericMaskEuropean = NumericMask({
    decimalSeparator: ',',
    thousandSeparator: '.',
    minIntegerDigits: 1,
    minDecimalDigits: 2,
  });

  const numericMaskWithSuffix = NumericMask({
    decimalSeparator: '.',
    thousandSeparator: ',',
    minIntegerDigits: 1,
    minDecimalDigits: 2,
    suffixes: [MaskSectionFixed('£')],
  });

  const numericMaskWithPrefixes = NumericMask({
    decimalSeparator: '.',
    thousandSeparator: ',',
    minIntegerDigits: 1,
    minDecimalDigits: 2,
    prefixes: [MaskSectionFixed('$')],
  });

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
