<template>
  <div class="playground-section">
    <div>
      <scroll-container>
        <slot />
      </scroll-container>
    </div>

    <div class="playground-debug">
      <div class="debug-title">Debug Data</div>
      <div class="debug-content">
        <scroll-container>
          <template v-if="activeMaskComponentMaskState !== undefined">
            <label>State:</label>
            <var-dump :data="activeMaskComponentMaskState" />

            <label>Derived State:</label>
            <var-dump :data="activeMaskComponentMaskDerivedState" />
          </template>
        </scroll-container>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, provide, type Ref } from 'vue';
  import type { MaskDerivedState, MaskState } from '@/lib/masked-text';
  import { VarDump, ScrollContainer } from '@/helper';

  const activeMaskComponentMaskState: Ref<MaskState | undefined> | undefined = ref(undefined);
  const activeMaskComponentMaskDerivedState: Ref<MaskDerivedState | undefined> | undefined = ref(undefined);

  provide('activeMaskComponentMaskState', activeMaskComponentMaskState);
  provide('activeMaskComponentMaskDerivedState', activeMaskComponentMaskDerivedState);
</script>

<style scoped>
  .playground-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    border: none;
    padding: 0;
    margin: 0;
  }

  .playground-debug {
    display: grid;
    grid-template-rows: auto 1fr;
    min-width: 200px;
    padding: 15px;
    background-color: #f8f9fa;
    border-left: 1px solid #e9ecef;
  }

  .debug-title {
    font-weight: bold;
    margin-bottom: 10px;
    color: #495057;
    border-bottom: 1px solid #dee2e6;
    padding-bottom: 5px;
  }

  .debug-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .debug-content > div {
    font-size: 0.9em;
    line-height: 1.4;
  }

  .debug-content strong {
    color: #495057;
  }
</style>
