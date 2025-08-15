import {
  type MaskCharacter,
  type MaskDefinition,
  MaskSectionFixed,
  type MaskSectionFixedDefinition,
  MaskSectionInput,
  validationFnFromRegexString,
} from './base/index.ts';
import { splitStringIntoGraphemes } from '@/masked-text/masks/base/helper.ts';

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

const IntegerDigitsMaskFn = (minDigits: number, thousandSeparator?: string) => {
  return (sectionValue: string): MaskCharacter[] => {
    const sectionValueCharacters = splitStringIntoGraphemes(sectionValue);
    const ret: MaskCharacter[] = [];

    for (let i = 0; i < Math.max(minDigits - sectionValueCharacters.length, 0); i++) {
      ret.push({ char: '0', type: 'mask' as const });
    }

    for (let i = 0; i < sectionValueCharacters.length; i++) {
      const char = sectionValueCharacters[i];

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

const DecimalsDigitsMaskFn = (minDigits: number) => {
  return (sectionValue: string): MaskCharacter[] => {
    const sectionValueCharacters = splitStringIntoGraphemes(sectionValue);
    const ret: MaskCharacter[] = [];

    for (let i = 0; i < sectionValueCharacters.length; i++) {
      const char = sectionValueCharacters[i];

      ret.push({ char, type: 'value' as const });
    }

    for (let i = 0; i < Math.max(minDigits - sectionValueCharacters.length, 0); i++) {
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
  const maxIntegerDigits = Math.max(props.maxIntegerDigits ?? 20, minIntegerDigits);
  const minDecimalDigits = props.minDecimalDigits ?? 1;
  const maxDecimalDigits = Math.max(props.maxDecimalDigits ?? 8, minDecimalDigits);

  if (infixes.length === 0) {
    infixes.push(MaskSectionFixed(decimalSeparator, decimalSeparator.length === 1 ? [decimalSeparator] : undefined));
  }

  const integerDigitsMaskFn = IntegerDigitsMaskFn(minIntegerDigits, thousandSeparator);
  const integerSyntacticValidationFn = validationFnFromRegexString(`^([0-9]|[1-9][0-9]{0,${minIntegerDigits - 1})$`);
  const integerInputSection = MaskSectionInput(integerDigitsMaskFn, {
    alignment: 'right',
    syntacticValidationFn: integerSyntacticValidationFn,
    maxLength: maxIntegerDigits,
  });

  const decimalsDigitsMaskFn = DecimalsDigitsMaskFn(minDecimalDigits);
  const decimalsSyntacticValidationFn = validationFnFromRegexString(`^([0-9]{0,${maxDecimalDigits}})$`);
  const decimalsInputSection = MaskSectionInput(decimalsDigitsMaskFn, {
    alignment: 'left',
    syntacticValidationFn: decimalsSyntacticValidationFn,
    maxLength: maxDecimalDigits,
  });

  return {
    sections: [...prefixes, integerInputSection, ...infixes, decimalsInputSection, ...suffixes],
  };
};
