<template>
  <div class="app">
    <div class="section">
      <MaskedText
        :mask="dateMaskISO"
        v-model="dateValue"
        @update:validatedValue="updatedDateValidatedValue"
        @update:semantic-validation-message="updateDateSemanticValidationMessage"
      />
      <MaskedText
        :mask="dateMaskDE"
        v-model="dateValue"
        @update:validatedValue="updatedDateValidatedValue"
        @update:semantic-validation-message="updateDateSemanticValidationMessage"
      />
      <MaskedText
        :mask="dateMaskEN"
        v-model="dateValue"
        @update:validatedValue="updatedDateValidatedValue"
        @update:semantic-validation-message="updateDateSemanticValidationMessage"
      />
      <MaskedText
        :mask="dateMaskUS"
        v-model="dateValue"
        @update:validatedValue="updatedDateValidatedValue"
        @update:semantic-validation-message="updateDateSemanticValidationMessage"
      />
      <MaskedText
        :mask="dateMaskJP"
        v-model="dateValue"
        @update:validatedValue="updatedDateValidatedValue"
        @update:semantic-validation-message="updateDateSemanticValidationMessage"
      />
      <MaskedText
        :mask="dateMaskKR"
        v-model="dateValue"
        @update:validatedValue="updatedDateValidatedValue"
        @update:semantic-validation-message="updateDateSemanticValidationMessage"
      />

      <div>
        rawDateValues: {{ dateValue }}<br />dateValidatedValue: {{ dateValidatedValue }}<br />semanticValidationMessage:
        {{ dateSemanticValidationMessage }}
      </div>

      <MaskedText
        :mask="ipv4Mask"
        v-model="ipv4Value"
        @update:validatedValue="updatedIpv4ValidatedValue"
        @update:semantic-validation-message="updateIpv4SemanticValidationMessage"
      />

      <div>
        rawIpv4Values: {{ ipv4Value }}<br />ipv4ValidatedValue: {{ ipv4ValidatedValue }}<br />semanticValidationMessage:
        {{ ipv4SemanticValidationMessage }}
      </div>

      <MaskedText
        :mask="ipv6Mask"
        v-model="ipv6Value"
        @update:validatedValue="updatedIpv6ValidatedValue"
        @update:semantic-validation-message="updateIpv6SemanticValidationMessage"
      />

      <div>
        rawIpv6Values: {{ ipv6Value }}<br />ipv6ValidatedValue: {{ ipv6ValidatedValue }}<br />semanticValidationMessage:
        {{ ipv6SemanticValidationMessage }}
      </div>

      <div class="row">
        <div class="row-label">plain input</div>
        <input style="flex-grow: 1" type="text" value="779126479 23798467912364 9123864781234" />
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
          <input v-model.number="minDigits" max="30" min="0" type="range" />
        </div>

        <div class="slider-group">
          <label>maxDigits: {{ maxDigits }}</label>
          <input v-model.number="maxDigits" max="30" min="1" type="range" />
        </div>

        <div class="slider-group">
          <label>minDecimals: {{ minDecimals }}</label>
          <input v-model.number="minDecimals" max="15" min="0" type="range" />
        </div>

        <div class="slider-group">
          <label>maxDecimals: {{ maxDecimals }}</label>
          <input v-model.number="maxDecimals" max="15" min="1" type="range" />
        </div>
      </div>

      <MaskedText v-model="numericValue" :mask="numericMask" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, type Ref } from 'vue';
  import { bindToLocalStorage } from '@/helper/bindToLocalStorage.ts';

  import { MaskedText, MaskSectionFixed, type MaskSectionFixedDefinition } from '@/lib/masked-text';
  import { DateMask, IPv4AddressMask, IPv6AddressMask, NumericMask } from '@/lib/masked-text/masks';

  const dateValue = ref({ year: '', month: '', day: '' } as Record<string, string>);
  const dateValidatedValue: Ref<string | undefined> = ref(undefined);
  const dateSemanticValidationMessage: Ref<string | undefined> = ref(undefined);

  const dateMaskISO = DateMask('iso');
  const dateMaskDE = DateMask('de');
  const dateMaskEN = DateMask('en');
  const dateMaskUS = DateMask('us');
  const dateMaskJP = DateMask('jp');
  const dateMaskKR = DateMask('kr');

  const updatedDateValidatedValue = (value: string | undefined) => {
    dateValidatedValue.value = value;
  };
  const updateDateSemanticValidationMessage = (value: string | undefined) => {
    dateSemanticValidationMessage.value = value;
  };

  const ipv4Value = ref({ block1: '127', block2: '0', block3: '0', block4: '1' } as Record<string, string>);
  const ipv4Mask = IPv4AddressMask();
  const ipv4ValidatedValue: Ref<string | undefined> = ref(undefined);
  const ipv4SemanticValidationMessage: Ref<string | undefined> = ref(undefined);

  const updatedIpv4ValidatedValue = (value: string | undefined) => {
    ipv4ValidatedValue.value = value;
  };
  const updateIpv4SemanticValidationMessage = (value: string | undefined) => {
    ipv4SemanticValidationMessage.value = value;
  };

  const ipv6Value = ref({ block1: '2025', block2: '', block3: '', block4: '', block5: '', block6: '', block7: '', block8: '1' } as Record<
    string,
    string
  >);

  const ipv6Mask = IPv6AddressMask();
  const ipv6ValidatedValue: Ref<string | undefined> = ref(undefined);
  const ipv6SemanticValidationMessage: Ref<string | undefined> = ref(undefined);

  const updatedIpv6ValidatedValue = (value: string | undefined) => {
    ipv6ValidatedValue.value = value;
  };
  const updateIpv6SemanticValidationMessage = (value: string | undefined) => {
    ipv6SemanticValidationMessage.value = value;
  };

  bindToLocalStorage(ipv4Value, 'ipv4-input/ipv4Value');

  const numericValue = ref({ digits: '', decimals: '' } as Record<string, string>);

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

    const integers = Array.from({ length: countDigits }, () => Math.floor(Math.random() * 10));
    const decimals = Array.from({ length: countDecimals }, () => Math.floor(Math.random() * 10));

    while (integers.length > 1 && integers[0] === 0) {
      integers.sort(() => Math.random() - 0.5);
    }

    numericValue.value = { integers: integers.join(''), decimals: decimals.join('') };
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
