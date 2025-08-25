<template>
  <div class="playground-masks">
    <label>Year/Month Mask ISO</label>
    <MaskedText :mask="yearMonthMaskISO" v-model="yearMonthValue1" @update:debug-info="updateDebugInfo" />

    <label>Year/Month Mask DE</label>
    <MaskedText :mask="yearMonthMaskDE" v-model="yearMonthValue1" @update:debug-info="updateDebugInfo" />

    <label>Year/Month Mask EN</label>
    <MaskedText :mask="yearMonthMaskEN" v-model="yearMonthValue2" @update:debug-info="updateDebugInfo" />

    <label>Year/Month Mask US</label>
    <MaskedText :mask="yearMonthMaskUS" v-model="yearMonthValue2" @update:debug-info="updateDebugInfo" />

    <label>Year/Month Mask JP</label>
    <MaskedText :mask="yearMonthMaskJP" v-model="yearMonthValue3" @update:debug-info="updateDebugInfo" />

    <label>Year/Month Mask KR</label>
    <MaskedText :mask="yearMonthMaskKR" v-model="yearMonthValue3" @update:debug-info="updateDebugInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, type MaskState } from '@/lib/masked-text';
  import { YearMonthMask } from '@/lib/masked-text/masks';

  const yearMonthValue1 = ref({ year: '2025', month: '08' } as Record<string, string>);
  const yearMonthValue2 = ref({ year: '2000', month: '2' } as Record<string, string>);
  const yearMonthValue3 = ref({ year: '', month: '' } as Record<string, string>);

  const yearMonthMaskISO = YearMonthMask('iso');
  const yearMonthMaskDE = YearMonthMask('de');
  const yearMonthMaskEN = YearMonthMask('en');
  const yearMonthMaskUS = YearMonthMask('us');
  const yearMonthMaskJP = YearMonthMask('jp');
  const yearMonthMaskKR = YearMonthMask('kr');

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
