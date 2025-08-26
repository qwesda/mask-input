<template>
  <div class="app">
    <PlaygroundMenu v-model="activeSection" />

    <PlaygroundSection v-if="activeSection === 'date'">
      <DatePlayground />
    </PlaygroundSection>

    <PlaygroundSection v-else-if="activeSection === 'year-month'">
      <YearMonthPlayground />
    </PlaygroundSection>

    <PlaygroundSection v-else-if="activeSection === 'year'">
      <YearPlayground />
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

    <PlaygroundSection v-else-if="activeSection === 'uuid'">
      <UuidPlayground />
    </PlaygroundSection>

    <PlaygroundSection v-else-if="activeSection === 'isrc'">
      <IsrcPlayground />
    </PlaygroundSection>

    <PlaygroundSection v-else-if="activeSection === 'ean'">
      <EanPlayground />
    </PlaygroundSection>
  </div>
</template>

<script lang="ts" setup>
  import { ref, type Ref } from 'vue';
  import { bindToLocalStorage } from '@/helper';

  import PlaygroundMenu from '@/components/app/PlaygroundMenu.vue';
  import PlaygroundSection from '@/components/app/PlaygroundSection.vue';

  import DatePlayground from '@/components/playground-sections/DatePlayground.vue';
  import YearMonthPlayground from '@/components/playground-sections/YearMonthPlayground.vue';
  import YearPlayground from '@/components/playground-sections/YearPlayground.vue';
  import NumericPlayground from '@/components/playground-sections/NumericPlayground.vue';
  import IpAddressesPlayground from '@/components/playground-sections/IpAddressesPlayground.vue';
  import SpecialPlayground from '@/components/playground-sections/SpecialPlayground.vue';
  import UuidPlayground from '@/components/playground-sections/UuidPlayground.vue';
  import IsrcPlayground from '@/components/playground-sections/IsrcPlayground.vue';
  import EanPlayground from '@/components/playground-sections/EanPlayground.vue';

  const activeSection: Ref<'date' | 'year-month' | 'year' | 'numeric' | 'ip-addresses' | 'special' | 'uuid' | 'isrc' | 'ean'> = ref('date' as const);

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
