<template>
  <div class="app">
    <MaskedText :mask="numericMask" v-model="numericValue" />
    <MaskedText :mask="serialMask" v-model="serialValue" />
  </div>
</template>

<script setup lang="ts">
  import { default as MaskedText } from '@/masked-text/masked-text.vue';
  import { ref } from 'vue';

  const numericValue = ref(['987654321', '1236'] as string[]);
  const numericMask = [
    {
      type: 'input',
      maskFn: (x: string) =>
        x
          .split('')
          .map((a, i) => ((a.length - i - 2) % 3 == 0 && x.length - i != 1 ? `${a},` : a))
          .join('') ?? '0',
      cursorPositionsFn: (x: string) => {
        const ret: number[] = [];

        for (let i = x.length - 1 + x.length / 3; i >= 0; i--) {
          if (i % 4 != 0) {
            ret.push(i);
          }
        }

        return ret;
      },
      validationFn: (x: string) => /^([0-9]{0,20})$/.test(x),
      inputBehavior: 'shift-right',
      maxLength: 20,
    },
    {
      type: 'fixed',
      mask: '.',
      value: '.',
      key: '.',
      skipKeys: ['.', ','],
    },
    {
      type: 'input',
      maskFn: (x: string) => x.padEnd(6, '0'),
      cursorPositionsFn: (x: string) => Array.from(Array(x.length + 1).keys()).map((x) => x),
      validationFn: (x: string) => /^([0-9]{0,6})$/.test(x),
      inputBehavior: 'shift-right',
      maxLength: 6,
    },
  ];

  const serialValue = ref(['12', '123456', '1236', '0'] as string[]);
  const serialMask = [
    {
      type: 'input',
      maskFn: (x: string) => x.padEnd(4, '_'),
      cursorPositionsFn: (x: string) => Array.from(Array(x.length + 1).keys()).map((x) => x),
      validationFn: (x: string) => /^([0-9]{0,4})$/.test(x),
      inputBehavior: 'shift-right',
      maxLength: 4,
    },
    {
      type: 'fixed',
      mask: '-',
      value: '-',
      key: '-',
      skipKeys: ['-', ' '],
    },
    {
      type: 'input',
      maskFn: (x: string) => x.padStart(8, '_'),
      cursorPositionsFn: (x: string) => Array.from(Array(x.length + 1).keys()).map((x) => 8 - x),
      validationFn: (x: string) => /^([0-9]{0,8})$/.test(x),
      inputBehavior: 'shift-left',
      maxLength: 8,
    },
    {
      type: 'fixed',
      mask: '-',
      value: '-',
      key: '-',
      skipKeys: ['-', ' '],
    },
    {
      type: 'input',
      maskFn: (x: string) => x.padStart(6, '_'),
      cursorPositionsFn: (x: string) => Array.from(Array(x.length + 1).keys()).map((x) => 6 - x),
      validationFn: (x: string) => /^([0-9]{0,6})$/.test(x),
      inputBehavior: 'shift-left',
      maxLength: 6,
    },
    {
      type: 'fixed',
      mask: '-',
      value: '-',
      key: '-',
      skipKeys: ['-', ' '],
    },
    {
      type: 'input',
      maskFn: (x: string) => x.padStart(2, '_'),
      cursorPositionsFn: (x: string) => Array.from(Array(x.length + 1).keys()).map((x) => 2 - x),
      validationFn: (x: string) => /^([0-9]{0,2})$/.test(x),
      inputBehavior: 'shift-left',
      maxLength: 2,
    },
  ];
</script>

<style scoped>
  .app {
    margin-top: 100px;
    font-size: 20px;
  }
</style>
