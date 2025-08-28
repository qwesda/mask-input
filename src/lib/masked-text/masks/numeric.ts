import type { MaskCharacter, MaskDefinition, MaskSectionFixedDefinition } from '../base/types';
import { MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from '../base/index';
import { splitStringIntoGraphemes } from '../base/helper';

export type NumericMaskProps = {
  decimalSeparator?: string;
  thousandSeparator?: string;

  prefixes?: MaskSectionFixedDefinition[];
  infixes?: MaskSectionFixedDefinition[];
  suffixes?: MaskSectionFixedDefinition[];

  minIntegerDigits?: number;
  maxIntegerDigits?: number;

  minDecimalDigits?: number;
  maxDecimalDigits?: number;
};

const numericEncodeValidatedValue = (values: Record<string, string[]>): string | undefined => {
  const integersStr = (values['integers'] ?? []).join('') || '0';
  const decimalsStr = (values['decimals'] ?? []).join('') || '0';
  const integersValue = integersStr.padStart(integersStr.length, '0');
  const decimalsValue = decimalsStr.padEnd(decimalsStr.length, '0');

  return `${integersValue}.${decimalsValue}`;
};

const numericIntegerMaskFn = (minDigits: number, thousandSeparator?: string) => {
  return (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
    const sectionValue = values[sectionSlug] ?? [];
    const ret: MaskCharacter[] = [];

    for (let i = 0; i < Math.max(minDigits - sectionValue.length, 0); i++) {
      ret.push({ char: '0', type: 'mask' as const });
    }

    for (let i = 0; i < sectionValue.length; i++) {
      const char = sectionValue[i];

      ret.push({ char, type: 'value' as const });

      if (thousandSeparator) {
        const digitsFromRight = sectionValue.length - i - 1;

        if (digitsFromRight > 0 && digitsFromRight % 3 === 0 && char !== '-') {
          ret.push({ char: thousandSeparator, type: 'mask' as const });
        }
      }
    }

    return ret;
  };
};

const numericDecimalsMaskFn = (minDigits: number | undefined) => {
  return (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
    const sectionValue = values[sectionSlug] ?? [];
    const ret: MaskCharacter[] = [];

    for (let i = 0; i < sectionValue.length; i++) {
      const char = sectionValue[i];

      ret.push({ char, type: 'value' as const });
    }

    for (let i = 0; i < Math.max((minDigits ?? 0) - sectionValue.length, 0); i++) {
      ret.push({ char: '0', type: 'mask' as const });
    }

    return ret;
  };
};

const numericSpinFn = (minDecimalDigits: number) => {
  return (
    direction: 'up' | 'down',
    values: Record<string, string[]>,
    sectionSlug: string,
    metaPressed: boolean,
    shiftPressed: boolean,
    altPressed: boolean,
  ): Record<string, string[]> => {
    const newValues = { ...values } as Record<string, string[]>;

    const currentIntegersStr = newValues['integers'].join('') || '0';
    const currentIntegersInt = BigInt(currentIntegersStr);
    const currentDecimalsInt = BigInt((newValues['decimals'].join('').padEnd(minDecimalDigits, '0') || '0').substring(0, minDecimalDigits));

    if (altPressed) {
      const spinDirection = direction === 'up' ? 1n : -1n;
      const spinAmount = (shiftPressed ? 10n : 1n) * spinDirection;

      if (sectionSlug === 'integers') {
        const newIntegersInt = currentIntegersInt + spinAmount;

        newValues[sectionSlug] = splitStringIntoGraphemes(newIntegersInt.toString());
      } else if (sectionSlug === 'decimals' && minDecimalDigits >= 1) {
        const maxDecimalsInt = BigInt('9'.repeat(minDecimalDigits || 1));
        const newDecimalsInt =
          currentDecimalsInt + spinAmount <= maxDecimalsInt
            ? currentDecimalsInt + spinAmount
            : currentDecimalsInt + spinAmount - (maxDecimalsInt + 1n);

        newValues[sectionSlug] = splitStringIntoGraphemes(newDecimalsInt.toString().padStart(minDecimalDigits, '0'));
      }
    } else {
      const spinDirection = direction === 'up' ? 1n : -1n;
      const decimalMultiplier = BigInt(10 ** minDecimalDigits);
      const spinAmount = (shiftPressed ? 10n : 1n) * spinDirection * (sectionSlug === 'integers' ? decimalMultiplier : 1n);
      const signMultiplier = currentIntegersStr.startsWith('-') ? -1n : 1n;
      const combinedValue = signMultiplier * (signMultiplier * currentIntegersInt * decimalMultiplier + currentDecimalsInt);

      const newCombinedValue = combinedValue + spinAmount;

      const newIntegersInt = newCombinedValue / decimalMultiplier;
      const newDecimalsInt = newCombinedValue % decimalMultiplier;

      const absoluteIntegersInt = newIntegersInt < 0n ? -newIntegersInt : newIntegersInt;
      const absoluteDecimalsInt = newDecimalsInt < 0n ? -newDecimalsInt : newDecimalsInt;
      const sign = newIntegersInt < 0n || (newIntegersInt === 0n && newDecimalsInt < 0n) ? '-' : '';

      newValues['integers'] = splitStringIntoGraphemes(sign + absoluteIntegersInt.toString());
      newValues['decimals'] = splitStringIntoGraphemes(absoluteDecimalsInt.toString().padStart(minDecimalDigits, '0'));
    }

    return newValues;
  };
};

export const NumericMask = (props: NumericMaskProps): MaskDefinition => {
  const decimalSeparator = props.decimalSeparator ?? '.';
  const thousandSeparator = props.thousandSeparator ?? '';

  const prefixes = props.prefixes ?? [];
  const infixes = props.infixes ?? [];
  const suffixes = props.suffixes ?? [];

  const minIntegerDigits = props.minIntegerDigits ?? 1;
  const maxIntegerDigits = props.maxIntegerDigits;
  const minDecimalDigits = props.minDecimalDigits ?? 1;
  const maxDecimalDigits = props.maxDecimalDigits;

  if (infixes.length === 0) {
    infixes.push(MaskSectionFixed(decimalSeparator, decimalSeparator.length === 1 ? [decimalSeparator] : undefined));
  }

  const integersInputSection = MaskSectionInput('integers', {
    maskingFn: numericIntegerMaskFn(minIntegerDigits, thousandSeparator),
    inputCharacterFilterFn: validationFnFromRegexString(`^[\-0-9]$`),
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^-?(|[0-9]|[1-9][0-9]*)$`),
    maxLength: maxIntegerDigits,
    spinFn: numericSpinFn(minDecimalDigits),
  });

  const decimalsInputSection = MaskSectionInput('decimals', {
    maskingFn: numericDecimalsMaskFn(minDecimalDigits),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    alignment: 'left',
    syntacticValidationFn: validationFnFromRegexString(`^([0-9]*)$`),
    maxLength: maxDecimalDigits,
    spinFn: numericSpinFn(minDecimalDigits),
  });

  return {
    encodeValidatedValue: numericEncodeValidatedValue,
    sections: [...prefixes, integersInputSection, ...infixes, decimalsInputSection, ...suffixes],
  };
};
