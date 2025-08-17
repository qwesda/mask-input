import { watch } from 'vue';

export const bindToLocalStorage = (ref_value: any, local_storage_key: string) => {
  const localStorageValue = localStorage.getItem(local_storage_key) || undefined;

  if (ref_value.value !== localStorageValue && localStorageValue !== undefined && localStorageValue !== 'undefined') {
    try {
      ref_value.value = JSON.parse(localStorageValue);
    } catch (error) {
      console.error('Error parsing local storage value:', error);
    }
  }

  watch(
    ref_value,
    (new_value) => {
      const json_value = JSON.stringify(new_value);

      localStorage.setItem(local_storage_key, json_value);
    },
    { deep: true },
  );
};
