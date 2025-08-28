<template>
  <div class="playground-masks">
    <label>ISBN-13 Mask (International Standard Book Number)</label>
    <MaskedText :mask="isbnMask1" v-model="isbnValue1" @update:debug-info="updateDebugInfo" />

    <label>ISBN-13 Mask (with example: 978-0-262-03293-3 - "Introduction to Algorithms")</label>
    <MaskedText :mask="isbnMask2" v-model="isbnValue2" @update:debug-info="updateDebugInfo" />

    <label>ISBN-13 Mask (with example: 978-1-4919-4399-1 - "JavaScript: The Definitive Guide")</label>
    <MaskedText :mask="isbnMask3" v-model="isbnValue3" @update:debug-info="updateDebugInfo" />

    <label>ISBN-10 Mask (with example: 0-201-63361-2 - "Design Patterns")</label>
    <MaskedText :mask="isbnMask4" v-model="isbnValue4" @update:debug-info="updateDebugInfo" />

    <label>ISBN-10 Mask (with example: 0-596-52068-9 - "JavaScript: The Good Parts")</label>
    <MaskedText :mask="isbnMask5" v-model="isbnValue5" @update:debug-info="updateDebugInfo" />

    <label>ISBN-13 Mask (empty for testing)</label>
    <MaskedText :mask="isbnMask6" v-model="isbnValue6" @update:debug-info="updateDebugInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, inject, type Ref } from 'vue';
  import { type MaskDerivedState, MaskedText, type MaskState } from '@/lib/masked-text';
  import { IsbnMask } from '@/lib/masked-text/masks';

  const isbnValue1 = ref({
    prefix: '978',
    group: '0',
    publisher: '123',
    title: '45678',
    checkDigit: '9'
  } as Record<string, string>);

  const isbnValue2 = ref({
    prefix: '978',
    group: '0',
    publisher: '262',
    title: '03293',
    checkDigit: '3'
  } as Record<string, string>);

  const isbnValue3 = ref({
    prefix: '978',
    group: '1',
    publisher: '4919',
    title: '4399',
    checkDigit: '1'
  } as Record<string, string>);

  const isbnValue4 = ref({
    prefix: '',
    group: '0',
    publisher: '201',
    title: '63361',
    checkDigit: '2'
  } as Record<string, string>);

  const isbnValue5 = ref({
    prefix: '',
    group: '0',
    publisher: '596',
    title: '52068',
    checkDigit: '9'
  } as Record<string, string>);

  const isbnValue6 = ref({
    prefix: '',
    group: '',
    publisher: '',
    title: '',
    checkDigit: ''
  } as Record<string, string>);

  const isbnMask1 = IsbnMask();
  const isbnMask2 = IsbnMask();
  const isbnMask3 = IsbnMask();
  const isbnMask4 = IsbnMask();
  const isbnMask5 = IsbnMask();
  const isbnMask6 = IsbnMask();

  const parentSectionActiveMaskComponentMaskState = inject<Ref<MaskState | undefined>>('activeMaskComponentMaskState')!;
  const parentSectionActiveMaskComponentMaskDerivedState = inject<Ref<MaskDerivedState | undefined>>('activeMaskComponentMaskDerivedState')!;

  const updateDebugInfo = (state: MaskState, lastDerivedState: MaskDerivedState) => {
    parentSectionActiveMaskComponentMaskState.value = state;
    parentSectionActiveMaskComponentMaskDerivedState.value = lastDerivedState;
  };
</script>
