<template>
  <nav class="playground-menu">
    <div class="menu-buttons">
      <button @click="$emit('update:modelValue', 'date')" :class="{ active: modelValue === 'date' }">Date</button>
      <button @click="$emit('update:modelValue', 'year-month')" :class="{ active: modelValue === 'year-month' }">Year/Month</button>
      <button @click="$emit('update:modelValue', 'year')" :class="{ active: modelValue === 'year' }">Year</button>
      <button @click="$emit('update:modelValue', 'numeric')" :class="{ active: modelValue === 'numeric' }">Numeric</button>
      <button @click="$emit('update:modelValue', 'integer')" :class="{ active: modelValue === 'integer' }">Integer</button>
      <button @click="$emit('update:modelValue', 'ip-addresses')" :class="{ active: modelValue === 'ip-addresses' }">IP Addr</button>
      <button @click="$emit('update:modelValue', 'special')" :class="{ active: modelValue === 'special' }">Special</button>
      <button @click="$emit('update:modelValue', 'uuid')" :class="{ active: modelValue === 'uuid' }">UUID</button>
      <button @click="$emit('update:modelValue', 'isrc')" :class="{ active: modelValue === 'isrc' }">ISRC</button>
      <button @click="$emit('update:modelValue', 'ean')" :class="{ active: modelValue === 'ean' }">EAN</button>
      <button @click="$emit('update:modelValue', 'isbn')" :class="{ active: modelValue === 'isbn' }">ISBN</button>
      <div style="flex-grow: 1" />
      <input type="text" style="border: none; background-color: transparent" value="test input foo bar baz" />
    </div>
  </nav>
</template>

<script lang="ts" setup>
  interface Props {
    modelValue: string;
  }

  defineProps<Props>();
  defineEmits<{
    'update:modelValue': [section: string];
  }>();
</script>

<style scoped>
  .playground-menu {
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .menu-buttons {
    display: flex;
    justify-content: start;
    flex-wrap: wrap;
  }

  .menu-buttons button {
    padding: 10px 10px;
    border: 0;
    background-color: transparent;
    color: #007bff;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.1s ease;
  }

  .menu-buttons button:hover {
    background-color: #e7f3ff;
  }

  .menu-buttons button.active,
  .menu-buttons button.active:hover {
    background-color: #007bff;
    color: white;
  }
</style>
