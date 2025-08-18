import type { MaskCharacter, MaskDefinition, MaskSectionFixedDefinition } from '../base/types';
import { MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from '../base/index';

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
  const integersStr = (values['integers'] || []).join('') || '0';
  const decimalsStr = (values['decimals'] || []).join('') || '0';
  const integersValue = integersStr.padStart(integersStr.length, '0');
  const decimalsValue = decimalsStr.padEnd(decimalsStr.length, '0');

  return `${integersValue}.${decimalsValue}`;
};

const numericIntegerMaskFn = (minDigits: number, thousandSeparator?: string) => {
  return (sectionValue: string[]): MaskCharacter[] => {
    const ret: MaskCharacter[] = [];

    for (let i = 0; i < Math.max(minDigits - sectionValue.length, 0); i++) {
      ret.push({ char: '0', type: 'mask' as const });
    }

    for (let i = 0; i < sectionValue.length; i++) {
      const char = sectionValue[i];

      ret.push({ char, type: 'value' as const });

      if (thousandSeparator) {
        const digitsFromRight = sectionValue.length - i - 1;

        if (digitsFromRight > 0 && digitsFromRight % 3 === 0) {
          ret.push({ char: thousandSeparator, type: 'mask' as const });
        }
      }
    }

    return ret;
  };
};

const numericDecimalsMaskFn = (minDigits: number | undefined) => {
  return (sectionValue: string[]): MaskCharacter[] => {
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
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^(|[0-9]|[1-9][0-9]*)$`),
    maxLength: maxIntegerDigits,
  });

  const decimalsInputSection = MaskSectionInput('decimals', {
    maskingFn: numericDecimalsMaskFn(minDecimalDigits),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    alignment: 'left',
    syntacticValidationFn: validationFnFromRegexString(`^([0-9]*)$`),
    maxLength: maxDecimalDigits,
  });

  return {
    encodeValidatedValue: numericEncodeValidatedValue,
    sections: [...prefixes, integersInputSection, ...infixes, decimalsInputSection, ...suffixes],
  };
};
