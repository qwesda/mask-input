<template>
  <label>ipv4Mask</label>
  <MaskedText :mask="ipv4Mask" v-model="ipv4Value1" @update:debug-info="updateDebugInfo" />
  <MaskedText :mask="ipv4Mask" v-model="ipv4Value2" @update:debug-info="updateDebugInfo" />

  <label>ipv6Mask</label>
  <MaskedText :mask="ipv6Mask" v-model="ipv6Value1" @update:debug-info="updateDebugInfo" />
  <MaskedText :mask="ipv6Mask" v-model="ipv6Value2" @update:debug-info="updateDebugInfo" />
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, type MaskState } from '@/lib/masked-text';
  import { IPv4AddressMask, IPv6AddressMask } from '@/lib/masked-text/masks';

  const ipv4Value1 = ref({ block1: '127', block2: '0', block3: '0', block4: '1' } as Record<string, string>);
  const ipv4Value2 = ref({} as Record<string, string>);
  const ipv6Value1 = ref({ block1: '2025', block2: '', block3: '', block4: '', block5: '', block6: '', block7: '', block8: '1' } as Record<
    string,
    string
  >);
  const ipv6Value2 = ref({} as Record<string, string>);

  const ipv4Mask = IPv4AddressMask();
  const ipv6Mask = IPv6AddressMask();

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
