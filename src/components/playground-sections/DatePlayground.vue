<template>
  <div class="playground-masks">
    <label>Date Mask ISO</label>
    <MaskedText :mask="dateMaskISO" v-model="dateValue1" @update:debug-info="updateDebugInfo" />

    <label>Date Mask DE</label>
    <MaskedText :mask="dateMaskDE" v-model="dateValue1" @update:debug-info="updateDebugInfo" />

    <label>Date Mask EN</label>
    <MaskedText :mask="dateMaskEN" v-model="dateValue2" @update:debug-info="updateDebugInfo" />

    <label>Date Mask US</label>
    <MaskedText :mask="dateMaskUS" v-model="dateValue2" @update:debug-info="updateDebugInfo" />

    <label>Date Mask JP</label>
    <MaskedText :mask="dateMaskJP" v-model="dateValue3" @update:debug-info="updateDebugInfo" />

    <label>Date Mask KR</label>
    <MaskedText :mask="dateMaskKR" v-model="dateValue3" @update:debug-info="updateDebugInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, type MaskState } from '@/lib/masked-text';
  import { DateMask } from '@/lib/masked-text/masks';

  const dateValue1 = ref({ year: '2025', month: '09', day: '01' } as Record<string, string>);
  const dateValue2 = ref({ year: '2000', month: '2', day: '29' } as Record<string, string>);
  const dateValue3 = ref({ year: '', month: '', day: '' } as Record<string, string>);

  const dateMaskISO = DateMask('iso');
  const dateMaskDE = DateMask('de');
  const dateMaskEN = DateMask('en');
  const dateMaskUS = DateMask('us');
  const dateMaskJP = DateMask('jp');
  const dateMaskKR = DateMask('kr');

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
