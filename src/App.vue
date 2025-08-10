<template>
  <div class="app">
    <div class="section">
      <div class="row">
        <div class="row-label">value</div>
        <button @click="setRandomNumericValue()">n.n</button>
        <button @click="setRandomNumericValue(0, 0)">0.0</button>
        <button @click="setRandomNumericValue(0)">0.n</button>
        <button @click="setRandomNumericValue(undefined, 0)">n.0</button>
        <button @click="setRandomNumericValue(undefined, 0)">\ツ/</button>
      </div>

      <div class="row">
        <div class="row-label">value</div>
        <button @click="setSeparators('.')">nnnn.dd</button>
        <button @click="setSeparators('.', ',')">n,nnn.dd</button>
        <button @click="setSeparators('.', ' ')">n nnn.dd</button>
        <button @click="setSeparators(',')">nnnn,dd</button>
        <button @click="setSeparators(',', '.')">n.nnn,dd</button>
        <button @click="setSeparators(',', ' ')">n nnn,dd</button>
        <button @click="setSeparators('\\DEC', '\\SEP')">n\DECnnn\SEPdd</button>
      </div>

      <div class="row">
        <div class="row-label">pre/in/suffixes</div>
        <button @click="clearFixes()">clear</button>
        <button @click="setRandomPrefixes()">prefixes</button>
        <button @click="setRandomInfixes()">infixes</button>
        <button @click="setRandomSuffixes()">suffixes</button>
      </div>

      <div class="sliders-row">
        <div class="row-label">digits</div>
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

      <MaskedText :mask="numericMask" v-model="numericValue" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { default as MaskedText, type MaskSectionPropsFixed, type MaskSectionPropsInput } from '@/masked-text/masked-text.vue';
  import { type Ref, ref, computed } from 'vue';
  import { bindToLocalStorage } from '@/helper/bindToLocalStorage.ts';

  const numericValue = ref(['', ''] as string[]);

  const minDigits = ref(0);
  const maxDigits = ref(20);
  const minDecimals = ref(1);
  const maxDecimals = ref(8);

  const decimalSeparator = ref('.');
  const thousandSeparator = ref(',');

  const numericMaskPrefixes: Ref<MaskSectionPropsFixed[]> = ref([]);
  const numericMaskInfixes: Ref<MaskSectionPropsFixed[]> = ref([]);
  const numericMaskSuffixes: Ref<MaskSectionPropsFixed[]> = ref([]);

  bindToLocalStorage(numericValue, 'numeric-input/numericValue');

  bindToLocalStorage(minDigits, 'numeric-input/minDigits');
  bindToLocalStorage(maxDigits, 'numeric-input/maxDigits');
  bindToLocalStorage(minDecimals, 'numeric-input/minDecimals');
  bindToLocalStorage(maxDecimals, 'numeric-input/maxDecimals');

  bindToLocalStorage(decimalSeparator, 'numeric-input/decimalSeparator');
  bindToLocalStorage(thousandSeparator, 'numeric-input/thousandSeparator');

  bindToLocalStorage(numericMaskPrefixes, 'numeric-input/numericMaskPrefixes');
  bindToLocalStorage(numericMaskInfixes, 'numeric-input/numericMaskInfixes');
  bindToLocalStorage(numericMaskSuffixes, 'numeric-input/numericMaskSuffixes');

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
        type: 'input' as const,
        maskFn: (chars: string) => {
          const ret = [];

          for (let i = 0; i < Math.max(currentMinDigits - chars.length, 0); i++) {
            ret.push({ char: '0', type: 'mask' as const });
          }

          for (let i = 0; i < chars.length; i++) {
            ret.push({ char: chars[i], type: 'value' as const });

            if (currentThousandSeparator) {
              const digitsFromRight = chars.length - i - 1;

              if (digitsFromRight > 0 && digitsFromRight % 3 === 0) {
                ret.push({ char: currentThousandSeparator, type: 'mask' as const });
              }
            }
          }

          return ret;
        },
        validationFn: (x: string) => new RegExp(currentMinDigits <= 1 ? `^(|[0-9]$` : `^(|[0-9]|[1-9][0-9]{0,${currentMaxDigits - 1}})$`).test(x),
        inputBehavior: 'insert' as const,
        inputAlign: 'right' as const,
        maxLength: currentMaxDigits,
      },
      ...numericMaskInfixes.value,
      ...(currentDecimalSeparator ? [{ type: 'fixed' as const, mask: currentDecimalSeparator, value: '' }] : []),
      {
        type: 'input' as const,
        maskFn: (chars: string) => {
          const ret = [];

          for (let i = 0; i < Math.max(chars.length, currentMinDecimals); i++) {
            if (i < chars.length) {
              ret.push({ char: chars[i], type: 'value' as const });
            } else {
              ret.push({ char: '0', type: 'mask' as const });
            }
          }

          return ret;
        },
        validationFn: (x: string) => new RegExp(`^([0-9]{0,${currentMaxDecimals}})$`).test(x),
        inputBehavior: 'insert' as const,
        inputAlign: 'left' as const,
        maxLength: currentMaxDecimals,
      },
      ...numericMaskSuffixes.value,
    ];
  });
</script>

<style scoped>
  .app {
    margin-top: 100px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  .row {
    display: flex;
    flex-direction: row;
    gap: 10px;
  }
  .row-label {
    width: 100px;
    text-align: right;
    padding-right: 10px;
    font-weight: bold;
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
  .slider-group input[type='range'] {
    width: 100%;
  }
</style>
