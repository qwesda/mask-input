<template>
  <div class="playground-masks">
    <label>Integer Mask Basic</label>
    <MaskedText :mask="integerMaskBasic" v-model="integerValue1" @update:debug-info="updateDebugInfo" />

    <label>Integer Mask with Thousand Separator (Comma)</label>
    <MaskedText :mask="integerMaskCommaSeparator" v-model="integerValue2" @update:debug-info="updateDebugInfo" />

    <label>Integer Mask with Thousand Separator (Space)</label>
    <MaskedText :mask="integerMaskSpaceSeparator" v-model="integerValue3" @update:debug-info="updateDebugInfo" />

    <label>Integer Mask with Min Digits (5)</label>
    <MaskedText :mask="integerMaskWithMinDigits" v-model="integerValue4" @update:debug-info="updateDebugInfo" />

    <label>Integer Mask with Max Digits (8)</label>
    <MaskedText :mask="integerMaskWithMaxDigits" v-model="integerValue5" @update:debug-info="updateDebugInfo" />

    <label>Integer Mask with Prefix ($)</label>
    <MaskedText :mask="integerMaskWithPrefix" v-model="integerValue6" @update:debug-info="updateDebugInfo" />

    <label>Integer Mask with Suffix (pcs)</label>
    <MaskedText :mask="integerMaskWithSuffix" v-model="integerValue7" @update:debug-info="updateDebugInfo" />

    <label>Integer Mask with Min Value (100)</label>
    <MaskedText :mask="integerMaskWithMinValue" v-model="integerValue8" @update:debug-info="updateDebugInfo" />

    <label>Integer Mask with Max Value (9999)</label>
    <MaskedText :mask="integerMaskWithMaxValue" v-model="integerValue9" @update:debug-info="updateDebugInfo" />

    <label>Integer Mask with Min/Max Values (500 - 2000)</label>
    <MaskedText :mask="integerMaskWithMinMaxValues" v-model="integerValue10" @update:debug-info="updateDebugInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, MaskSectionFixed, type MaskState } from '@/lib/masked-text';
  import { IntegerMask } from '@/lib/masked-text/masks';

  const integerValue1 = ref({ integers: '12345' } as Record<string, string>);
  const integerValue2 = ref({ integers: '1234567' } as Record<string, string>);
  const integerValue3 = ref({ integers: '9876543' } as Record<string, string>);
  const integerValue4 = ref({ integers: '123' } as Record<string, string>);
  const integerValue5 = ref({ integers: '87654321' } as Record<string, string>);
  const integerValue6 = ref({ integers: '500' } as Record<string, string>);
  const integerValue7 = ref({ integers: '42' } as Record<string, string>);
  const integerValue8 = ref({ integers: '150' } as Record<string, string>);
  const integerValue9 = ref({ integers: '5000' } as Record<string, string>);
  const integerValue10 = ref({ integers: '750' } as Record<string, string>);

  const integerMaskBasic = IntegerMask({
    minIntegerDigits: 1,
  });

  const integerMaskCommaSeparator = IntegerMask({
    thousandSeparator: ',',
    minIntegerDigits: 1,
  });

  const integerMaskSpaceSeparator = IntegerMask({
    thousandSeparator: ' ',
    minIntegerDigits: 1,
  });

  const integerMaskWithMinDigits = IntegerMask({
    thousandSeparator: ',',
    minIntegerDigits: 5,
  });

  const integerMaskWithMaxDigits = IntegerMask({
    thousandSeparator: ',',
    minIntegerDigits: 1,
    maxIntegerDigits: 8,
  });

  const integerMaskWithPrefix = IntegerMask({
    thousandSeparator: ',',
    minIntegerDigits: 1,
    prefixes: [MaskSectionFixed('$')],
  });

  const integerMaskWithSuffix = IntegerMask({
    thousandSeparator: ',',
    minIntegerDigits: 1,
    suffixes: [MaskSectionFixed(' pcs')],
  });

  const integerMaskWithMinValue = IntegerMask({
    thousandSeparator: ',',
    minIntegerDigits: 1,
    minValue: 100,
  });

  const integerMaskWithMaxValue = IntegerMask({
    thousandSeparator: ',',
    minIntegerDigits: 1,
    maxValue: 9999,
  });

  const integerMaskWithMinMaxValues = IntegerMask({
    thousandSeparator: ',',
    minIntegerDigits: 1,
    minValue: 500,
    maxValue: 2000,
  });

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
