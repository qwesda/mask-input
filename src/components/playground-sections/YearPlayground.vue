<template>
  <div class="playground-masks">
    <label>Year Mask (default range: 1900-2100)</label>
    <MaskedText :mask="yearMaskDefault" v-model="yearValue1" @update:debug-info="updateDebugInfo" />

    <label>Year Mask (range: 2020-2030)</label>
    <MaskedText :mask="yearMaskLimited" v-model="yearValue2" @update:debug-info="updateDebugInfo" />

    <label>Year Mask (range: 1980-2025)</label>
    <MaskedText :mask="yearMaskCustom" v-model="yearValue3" @update:debug-info="updateDebugInfo" />

    <label>Year Mask (empty, current year: {{ currentYear }})</label>
    <MaskedText :mask="yearMaskEmpty" v-model="yearValue4" @update:debug-info="updateDebugInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, type MaskState } from '@/lib/masked-text';
  import { YearMask } from '@/lib/masked-text/masks';

  const currentYear = new Date().getFullYear();

  const yearValue1 = ref({ year: '2025' } as Record<string, string>);
  const yearValue2 = ref({ year: '2024' } as Record<string, string>);
  const yearValue3 = ref({ year: '99' } as Record<string, string>); // test 2-digit normalization
  const yearValue4 = ref({ year: '' } as Record<string, string>);

  const yearMaskDefault = YearMask();
  const yearMaskLimited = YearMask(2020, 2030);
  const yearMaskCustom = YearMask(1980, 2025);
  const yearMaskEmpty = YearMask();

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
