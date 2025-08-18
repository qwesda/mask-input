<template>
  <div class="app">
    <PlaygroundMenu v-model="activeSection" />

    <PlaygroundSection v-if="activeSection === 'date'">
      <DatePlayground />
    </PlaygroundSection>

    <PlaygroundSection v-else-if="activeSection === 'numeric'">
      <NumericPlayground />
    </PlaygroundSection>

    <PlaygroundSection v-else-if="activeSection === 'ip-addresses'">
      <IpAddressesPlayground />
    </PlaygroundSection>

    <PlaygroundSection v-else-if="activeSection === 'special'">
      <SpecialPlayground />
    </PlaygroundSection>
  </div>
</template>

<script lang="ts" setup>
  import { ref, type Ref } from 'vue';
  import { bindToLocalStorage } from '@/helper';

  import PlaygroundMenu from '@/components/app/PlaygroundMenu.vue';
  import PlaygroundSection from '@/components/app/PlaygroundSection.vue';

  import DatePlayground from '@/components/playground-sections/DatePlayground.vue';
  import NumericPlayground from '@/components/playground-sections/NumericPlayground.vue';
  import IpAddressesPlayground from '@/components/playground-sections/IpAddressesPlayground.vue';
  import SpecialPlayground from '@/components/playground-sections/SpecialPlayground.vue';

  const activeSection: Ref<'date' | 'numeric' | 'ip-addresses'> = ref('date' as const);

  bindToLocalStorage(activeSection, 'playground/activeSection');
</script>

<style scoped>
  .app {
    min-height: 100vh;
    background-color: #ffffff;
    margin: 0;
    padding: 0;

    display: grid;
    grid-template-rows: auto 1fr;
  }
</style>
