<template>
  <nav class="playground-menu">
    <div class="menu-buttons">
      <button @click="$emit('update:modelValue', 'date')" :class="{ active: modelValue === 'date' }">Date</button>
      <button @click="$emit('update:modelValue', 'numeric')" :class="{ active: modelValue === 'numeric' }">Numeric</button>
      <button @click="$emit('update:modelValue', 'ip-addresses')" :class="{ active: modelValue === 'ip' }">IP Addr</button>
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
