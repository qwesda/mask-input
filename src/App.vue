<template>
  <div class="app">
    <div class="section">
      <MaskedText :mask="numericMask" v-model="numericValue" />

      <div class="row">
        <button @click="setRandomNumericValue()">n.n</button>
        <button @click="setRandomNumericValue(0, 0)">0.0</button>
        <button @click="setRandomNumericValue(0)">0.n</button>
        <button @click="setRandomNumericValue(undefined, 0)">n.0</button>
        <button @click="setRandomNumericValue(undefined, 0)">\ツ/</button>
      </div>

      <div class="row">
        <button @click="setSeparators('.')">nnnn.dd</button>
        <button @click="setSeparators('.', ',')">n,nnn.dd</button>
        <button @click="setSeparators('.', ' ')">n nnn.dd</button>
        <button @click="setSeparators(',')">nnnn,dd</button>
        <button @click="setSeparators(',', '.')">n.nnn,dd</button>
        <button @click="setSeparators(',', ' ')">n nnn,dd</button>
        <button @click="setSeparators('\\DEC', '\\SEP')">n\DECnnn\SEPdd</button>
      </div>

      <div class="row">
        <button @click="clearFixes()">clear</button>
        <button @click="setRandomPrefixes()">prefixes</button>
        <button @click="setRandomInfixes()">infixes</button>
        <button @click="setRandomSuffixes()">suffixes</button>
      </div>

      <div class="sliders-row">
        <div class="slider-group">
          <label>minDigits: {{ minDigits }}</label>
          <input type="range" v-model.number="minDigits" min="0" max="30" />
        </div>
        <div class="slider-group">
          <label>maxDigits: {{ maxDigits }}</label>
          <input type="range" v-model.number="maxDigits" min="1" max="30" />
        </div>
        <div class="slider-group">
          <label>minDecimals: {{ minDecimals }}</label>
          <input type="range" v-model.number="minDecimals" min="0" max="15" />
        </div>
        <div class="slider-group">
          <label>maxDecimals: {{ maxDecimals }}</label>
          <input type="range" v-model.number="maxDecimals" min="1" max="15" />
        </div>
      </div>

      <div class="monospace">{{ numericValue.toString() }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { default as MaskedText, type MaskSectionPropsFixed, type MaskSectionPropsInput } from '@/masked-text/masked-text.vue';
  import { type Ref, ref, computed } from 'vue';

  const setRandomNumericValue = (countDigits?: number, countDecimals?: number) => {
    countDigits = countDigits ?? Math.floor(Math.random() * 20);
    countDecimals = countDecimals ?? Math.floor(Math.random() * 8);
    const digits = Array.from({ length: countDigits }, (x, i) => Math.floor(Math.random() * 10));
    const decimals = Array.from({ length: countDecimals }, () => Math.floor(Math.random() * 10));

    while (digits.length > 1 && digits[0] === 0) {
      digits.sort((a, b) => Math.random() - 0.5);
    }

    numericValue.value = [digits.join(''), decimals.join('')];
  };

  const getRandomPrefixes = (count?: number): MaskSectionPropsFixed[] => {
    count = count ?? Math.floor(Math.random() * 3);
    const prefixPool = ['(USD)', '(EUR)'];
    const prefixes: MaskSectionPropsFixed[] = [];

    for (let i = 0; i < count && prefixPool.length > 0; i++) {
      const prefixIndex = Math.floor(Math.random() * prefixPool.length);
      const [prefix] = prefixPool.splice(prefixIndex, 1);
      const addExtraSpace = Math.random() < 0.5;

      prefixes.push({
        type: 'fixed',
        mask: prefix + (addExtraSpace ? ' ' : ''),
        value: '',
        key: '',
        skipKeys: [],
      });
    }

    return prefixes;
  };
  const getRandomSuffixes = (count?: number): MaskSectionPropsFixed[] => {
    count = count ?? Math.floor(Math.random() * 3);
    const suffixPool = ['[per annum]', '[per mile]', '[per kilo]', '[per se]'];
    const suffixes: MaskSectionPropsFixed[] = [];

    for (let i = 0; i < count && suffixPool.length > 0; i++) {
      const suffixIndex = Math.floor(Math.random() * suffixPool.length);
      const [suffix] = suffixPool.splice(suffixIndex, 1);
      const addExtraSpace = Math.random() < 0.5;

      suffixes.push({
        type: 'fixed',
        mask: (addExtraSpace ? ' ' : '') + suffix,
        value: '',
        key: '',
        skipKeys: [],
      });
    }

    return suffixes;
  };
  const getRandomInfixes = (count?: number): MaskSectionPropsFixed[] => {
    count = count ?? Math.floor(Math.random() * 3);
    const infixPool = ['.', ',', ' '];
    const infixes: MaskSectionPropsFixed[] = [];

    for (let i = 0; i < count && infixPool.length > 0; i++) {
      const infixIndex = Math.floor(Math.random() * infixPool.length);
      const [infix] = infixPool.splice(infixIndex, 1);
      const addExtraSpace = Math.random() < 0.5;

      infixes.push({
        type: 'fixed',
        mask: (addExtraSpace ? ' ' : '') + infix,
        value: '',
        key: '',
        skipKeys: [],
      });
    }

    return infixes;
  };

  const clearFixes = () => {
    numericMaskPrefixes.value = [];
    numericMaskSuffixes.value = [];
    numericMaskInfixes.value = [];
  };
  const setRandomPrefixes = () => {
    numericMaskPrefixes.value = getRandomPrefixes();
  };
  const setRandomSuffixes = () => {
    numericMaskSuffixes.value = getRandomSuffixes();
  };
  const setRandomInfixes = () => {
    numericMaskInfixes.value = getRandomInfixes();
  };
  const setSeparators = (newDecimalSeparator: string, newThousandSeparator?: string) => {
    decimalSeparator.value = newDecimalSeparator;
    thousandSeparator.value = newThousandSeparator ?? '';
  };

  const minDigits = ref(0);
  const maxDigits = ref(20);
  const minDecimals = ref(1);
  const maxDecimals = ref(8);
  const decimalSeparator = ref('.');
  const thousandSeparator = ref(',');

  const numericValue = ref(['1234567890', '99'] as string[]);
  const numericMaskPrefixes: Ref<MaskSectionPropsFixed[]> = ref(getRandomPrefixes());
  const numericMaskInfixes: Ref<MaskSectionPropsFixed[]> = ref(getRandomInfixes());
  const numericMaskSuffixes: Ref<MaskSectionPropsFixed[]> = ref(getRandomSuffixes());
  const numericMask = computed(() => {
    const currentMinDigits = minDigits.value;
    const currentMaxDigits = Math.max(maxDigits.value, currentMinDigits);
    const currentMinDecimals = minDecimals.value;
    const currentMaxDecimals = Math.max(maxDecimals.value, currentMinDecimals);
    const currentDecimalSeparator = decimalSeparator.value;
    const currentThousandSeparator = thousandSeparator.value;

    return [
      ...numericMaskPrefixes.value,
      {
        type: 'input',
        maskFn: (x: string) => {
          const ret = [];

          for (let i = 0; i < Math.max(currentMinDigits - x.length, 0); i++) {
            ret.push({ char: '0', type: 'mask', displayBounds: [0, 1] });
          }

          let displayOffset = 0;

          for (let i = 0; i < x.length; i++) {
            const char = x[i];

            ret.push({ char, type: 'value', valueBounds: [i, i + 1], displayBounds: [i + displayOffset, i + displayOffset + 1] });

            if (currentThousandSeparator) {
              // Add separator every 3 digits from the right, but not after the last digit
              const digitsFromRight = x.length - i - 1;
              if (digitsFromRight > 0 && digitsFromRight % 3 === 0) {
                ret.push({
                  char: currentThousandSeparator,
                  type: 'mask',
                  displayBounds: [i + displayOffset + 1, i + displayOffset + 1 + currentThousandSeparator.length],
                });

                displayOffset += currentThousandSeparator.length;
              }
            }
          }

          return ret;
        },
        validationFn: (x: string) =>
          new RegExp(currentMaxDigits <= 1 ? `^[0-9]{0,${currentMaxDigits}}$` : `^[1-9][0-9]{0,${currentMaxDigits - 1}}$`).test(x),
        inputBehavior: 'shift-left',
        inputAlign: 'right',
        maxLength: currentMaxDigits,
      },
      ...numericMaskInfixes.value,
      ...(currentDecimalSeparator
        ? [
            {
              type: 'fixed',
              mask: currentDecimalSeparator,
            },
          ]
        : []),
      {
        type: 'input',
        maskFn: (x: string) => {
          const ret = [];

          for (let i = 0; i < Math.max(x.length, currentMinDecimals); i++) {
            const char = x[i];

            if (i < x.length) {
              ret.push({ char, type: 'value', valueBounds: [i, i + 1], displayBounds: [i, i + 1] });
            } else {
              ret.push({ char: '0', type: 'mask', displayBounds: [i, i + 1] });
            }
          }

          return ret;
        },
        validationFn: (x: string) => new RegExp(`^([0-9]{0,${currentMaxDecimals}})$`).test(x),
        inputBehavior: 'shift-right',
        inputAlign: 'left',
        maxLength: currentMaxDecimals,
      },
      ...numericMaskSuffixes.value,
    ];
  });
</script>

<style scoped>
  .app {
    margin-top: 100px;
    font-size: 20px;
  }
  .row {
    display: flex;
    flex-direction: row;
    gap: 10px;
  }
  .monospace {
    font-family: monospace;
  }
  .section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sliders-row {
    display: flex;
    flex-direction: row;
    gap: 20px;
    flex-wrap: wrap;
  }
  .slider-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 150px;
  }
  .slider-group label {
    font-size: 14px;
    font-weight: bold;
  }
  .slider-group input[type='range'] {
    width: 100%;
  }
</style>
