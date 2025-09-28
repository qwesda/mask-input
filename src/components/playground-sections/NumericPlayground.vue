<template>
  <div class="playground-masks">
    <label>Numeric Mask Basic</label>
    <MaskedText :mask="numericMaskBasic" v-model="numericValue1" @update:debug-info="updateDebugInfo" />

    <label>Numeric Mask Comma Separator</label>
    <MaskedText :mask="numericMaskCommaSeparator" v-model="numericValue1" @update:debug-info="updateDebugInfo" />

    <label>Numeric Mask Space Separator</label>
    <MaskedText :mask="numericMaskSpaceSeparator" v-model="numericValue2" @update:debug-info="updateDebugInfo" />

    <label>Numeric Mask European</label>
    <MaskedText :mask="numericMaskEuropean" v-model="numericValue2" @update:debug-info="updateDebugInfo" />

    <label>Numeric Mask with Suffix</label>
    <MaskedText :mask="numericMaskWithSuffix" v-model="numericValue3" @update:debug-info="updateDebugInfo" />

    <label>Numeric Mask with Prefixes</label>
    <MaskedText :mask="numericMaskWithPrefixes" v-model="numericValue3" @update:debug-info="updateDebugInfo" />

    <label>Numeric Mask with Min Value (10.00)</label>
    <MaskedText :mask="numericMaskWithMinValue" v-model="numericValue4" @update:debug-info="updateDebugInfo" />

    <label>Numeric Mask with Max Value (100.00)</label>
    <MaskedText :mask="numericMaskWithMaxValue" v-model="numericValue5" @update:debug-info="updateDebugInfo" />

    <label>Numeric Mask with Min/Max Values (50.00 - 200.00)</label>
    <MaskedText :mask="numericMaskWithMinMaxValues" v-model="numericValue6" @update:debug-info="updateDebugInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, MaskSectionFixed, type MaskState } from '@/lib/masked-text';
  import { NumericMask } from '@/lib/masked-text/masks';

  const numericValue1 = ref({ integers: '1234567890', decimals: '0987654321' } as Record<string, string>);
  const numericValue2 = ref({ integers: '', decimals: '' } as Record<string, string>);
  const numericValue3 = ref({ integers: '12', decimals: '99' } as Record<string, string>);
  const numericValue4 = ref({ integers: '5', decimals: '50' } as Record<string, string>);
  const numericValue5 = ref({ integers: '150', decimals: '75' } as Record<string, string>);
  const numericValue6 = ref({ integers: '25', decimals: '00' } as Record<string, string>);

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

  const numericMaskWithMinValue = NumericMask({
    decimalSeparator: '.',
    thousandSeparator: ',',
    minIntegerDigits: 1,
    minDecimalDigits: 2,
    minValue: 10.0,
  });

  const numericMaskWithMaxValue = NumericMask({
    decimalSeparator: '.',
    thousandSeparator: ',',
    minIntegerDigits: 1,
    minDecimalDigits: 2,
    maxValue: 100.0,
  });

  const numericMaskWithMinMaxValues = NumericMask({
    decimalSeparator: '.',
    thousandSeparator: ',',
    minIntegerDigits: 1,
    minDecimalDigits: 2,
    minValue: 49.99,
    maxValue: 199.99,
  });

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
