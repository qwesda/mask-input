<template>
  <div class="app">
    <div class="section">
      <div class="row">
        <div class="row-label">plain input</div>
        <input type="text" value="779126479 23798467912364 9123864781234" style="flex-grow: 1" />
      </div>
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

      <MaskedText :mask="numericMask" v-model="numericValue" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { default as MaskedText } from '@/masked-text/masked-text.vue';
  import { default as VarDump } from '@/helper/var-dump.vue';
  import { type Ref, ref, computed } from 'vue';
  import { bindToLocalStorage } from '@/helper/bindToLocalStorage.ts';
  import { NumericMask } from '@/masked-text/masks';
  import { type MaskSectionFixedDefinition, MaskSectionFixed } from '@/masked-text/masks/index.ts';

  const numericValue = ref(['', ''] as string[]);

  const decimalSeparator = ref('.');
  const thousandSeparator = ref(',');

  const minDigits = ref(0);
  const maxDigits = ref(20);
  const minDecimals = ref(1);
  const maxDecimals = ref(8);

  const numericMaskPrefixes: Ref<MaskSectionFixedDefinition[]> = ref([]);
  const numericMaskInfixes: Ref<MaskSectionFixedDefinition[]> = ref([]);
  const numericMaskSuffixes: Ref<MaskSectionFixedDefinition[]> = ref([]);

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

    const digits = Array.from({ length: countDigits }, () => Math.floor(Math.random() * 10));
    const decimals = Array.from({ length: countDecimals }, () => Math.floor(Math.random() * 10));

    while (digits.length > 1 && digits[0] === 0) {
      digits.sort(() => Math.random() - 0.5);
    }

    numericValue.value = [digits.join(''), decimals.join('')];
  };

  const getRandomPrefixes = (count?: number): MaskSectionFixedDefinition[] => {
    count = count ?? Math.floor(Math.random() * 3);
    const prefixPool = ['(USD)', '(EUR)'];
    const prefixes: MaskSectionFixedDefinition[] = [];

    for (let i = 0; i < count && prefixPool.length > 0; i++) {
      const prefixIndex = Math.floor(Math.random() * prefixPool.length);
      const [prefix] = prefixPool.splice(prefixIndex, 1);
      const addExtraSpace = Math.random() < 0.5;

      prefixes.push(MaskSectionFixed(prefix + (addExtraSpace ? ' ' : '')));
    }

    return prefixes;
  };
  const getRandomSuffixes = (count?: number): MaskSectionFixedDefinition[] => {
    count = count ?? Math.floor(Math.random() * 3);
    const suffixPool = ['(per annum)', '(per mile)', '(per kilo)', '(per se)'];
    const suffixes: MaskSectionFixedDefinition[] = [];

    for (let i = 0; i < count && suffixPool.length > 0; i++) {
      const suffixIndex = Math.floor(Math.random() * suffixPool.length);
      const [suffix] = suffixPool.splice(suffixIndex, 1);
      const addExtraSpace = Math.random() < 0.5;

      suffixes.push(MaskSectionFixed((addExtraSpace ? ' ' : '') + suffix));
    }

    return suffixes;
  };
  const getRandomInfixes = (count?: number): MaskSectionFixedDefinition[] => {
    count = count ?? Math.floor(Math.random() * 3);
    const infixPool = ['.', ',', ' '];
    const infixes: MaskSectionFixedDefinition[] = [];

    for (let i = 0; i < count && infixPool.length > 0; i++) {
      const infixIndex = Math.floor(Math.random() * infixPool.length);
      const [infix] = infixPool.splice(infixIndex, 1);
      const addExtraSpace = Math.random() < 0.5;

      infixes.push(MaskSectionFixed((addExtraSpace ? ' ' : '') + infix + (addExtraSpace ? ' ' : '')));
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

  const numericMask = computed(() =>
    NumericMask({
      decimalSeparator: decimalSeparator.value,
      thousandSeparator: thousandSeparator.value,

      minIntegerDigits: minDigits.value,
      maxIntegerDigits: maxDigits.value,

      minDecimalDigits: minDecimals.value,
      maxDecimalDigits: maxDecimals.value,

      prefixes: numericMaskPrefixes.value,
      infixes: numericMaskInfixes.value,
      suffixes: numericMaskSuffixes.value,
    }),
  );
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
