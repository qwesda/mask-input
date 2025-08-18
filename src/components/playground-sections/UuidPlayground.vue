<template>
  <label>UUID v1</label>
  <MaskedText :mask="uuidV1Mask" v-model="uuidV1Value" @update:debug-info="updateDebugInfo" />

  <label>UUID v4</label>
  <MaskedText :mask="uuidV4Mask" v-model="uuidV4Value" @update:debug-info="updateDebugInfo" />

  <label>UUID v7</label>
  <MaskedText :mask="uuidV7Mask" v-model="uuidV7Value" @update:debug-info="updateDebugInfo" />

  <label>UUID any</label>
  <MaskedText :mask="uuidAnyMask" v-model="uuidAnyValue" @update:debug-info="updateDebugInfo" />
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, type MaskState } from '@/lib/masked-text';
  import { UuidMask } from '@/lib/masked-text/masks';

  const uuidV1Value = ref({ part1: '12345678', part2: '1234', part3: '1234', part4: '8234', part5: '123456789012' } as Record<string, string>);
  const uuidV4Value = ref({ part1: '12345678', part2: '1234', part3: '4234', part4: '8234', part5: '123456789012' } as Record<string, string>);
  const uuidV7Value = ref({ part1: '12345678', part2: '1234', part3: '7234', part4: '8234', part5: '123456789012' } as Record<string, string>);
  const uuidAnyValue = ref({ part1: '12345678', part2: '1234', part3: '0234', part4: '0234', part5: '123456789012' } as Record<string, string>);

  const uuidV1Mask = UuidMask('v1');
  const uuidV4Mask = UuidMask('v4');
  const uuidV7Mask = UuidMask('v7');
  const uuidAnyMask = UuidMask(undefined);

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
