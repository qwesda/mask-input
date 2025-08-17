<template>
  <label>ipv4Mask</label>
  <MaskedText :mask="ipv4Mask" v-model="ipv4Value" @update:debug-info="updateDebugInfo" />

  <label>ipv6Mask</label>
  <MaskedText :mask="ipv6Mask" v-model="ipv6Value" @update:debug-info="updateDebugInfo" />
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, type MaskState } from '@/lib/masked-text';
  import { IPv4AddressMask, IPv6AddressMask } from '@/lib/masked-text/masks';

  const ipv4Value = ref({ block1: '127', block2: '0', block3: '0', block4: '1' } as Record<string, string>);
  const ipv6Value = ref({ block1: '2025', block2: '', block3: '', block4: '', block5: '', block6: '', block7: '', block8: '1' } as Record<
    string,
    string
  >);

  const ipv4Mask = IPv4AddressMask();
  const ipv6Mask = IPv6AddressMask();

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
