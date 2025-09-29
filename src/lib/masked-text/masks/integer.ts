import type { MaskCharacter, MaskDefinition, MaskSectionFixedDefinition } from '../base/types';
import { MaskSectionInput, validationFnFromRegexString } from '../base/index';
import { splitStringIntoGraphemes } from '../base/helper';

export type IntegerMaskProps = {
  thousandSeparator?: string;

  prefixes?: MaskSectionFixedDefinition[];
  suffixes?: MaskSectionFixedDefinition[];

  minIntegerDigits?: number;
  maxIntegerDigits?: number;

  minValue?: number;
  maxValue?: number;
};

const getIntegerValueFromValues = (values: Record<string, string[]>): number => {
  const integersStr = values['integers'].join('') || '0';
  return parseInt(integersStr, 10);
};

const clampIntegerValue = (
  values: Record<string, string[]>,
  minValue: number | undefined,
  maxValue: number | undefined,
): Record<string, string[]> => {
  if (minValue === undefined && maxValue === undefined) {
    return values;
  }

  const integerValue = getIntegerValueFromValues(values);
  const clampedValue =
    maxValue !== undefined && integerValue > maxValue ? maxValue : minValue !== undefined && integerValue < minValue ? minValue : undefined;

  if (clampedValue !== undefined) {
    const newValues: Record<string, string[]> = {};
    newValues['integers'] = splitStringIntoGraphemes(clampedValue.toString());
    return newValues;
  } else {
    return values;
  }
};

const integerSemanticValidationFn = (minValue?: number, maxValue?: number) => {
  return (values: Record<string, string[]>): [boolean, string] => {
    if (minValue === undefined && maxValue === undefined) {
      return [true, ''];
    }

    const integerValue = getIntegerValueFromValues(values);

    if (isNaN(integerValue)) {
      return [false, 'invalid integer'];
    }

    if (maxValue !== undefined && integerValue > maxValue) {
      return [false, `value larger than max value ${maxValue}`];
    }

    if (minValue !== undefined && integerValue < minValue) {
      return [false, `value smaller than min value ${minValue}`];
    }

    return [true, ''];
  };
};

const integerEncodeValidatedValue = (values: Record<string, string[]>): string | undefined => {
  return (values['integers'] ?? []).join('') || '0';
};

const integerMaskFn = (minDigits: number, thousandSeparator?: string) => {
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

const integerSpinFn = (minValue?: number, maxValue?: number) => {
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

    const spinDirection = direction === 'up' ? 1n : -1n;
    const spinAmount = (shiftPressed ? 10n : 1n) * spinDirection;

    if (sectionSlug === 'integers') {
      const newIntegersInt = currentIntegersInt + spinAmount;
      newValues[sectionSlug] = splitStringIntoGraphemes(newIntegersInt.toString());
    }

    return clampIntegerValue(newValues, minValue, maxValue);
  };
};

export const IntegerMask = (props: IntegerMaskProps): MaskDefinition => {
  const thousandSeparator = props.thousandSeparator ?? '';

  const prefixes = props.prefixes ?? [];
  const suffixes = props.suffixes ?? [];

  const minIntegerDigits = props.minIntegerDigits ?? 1;
  const maxIntegerDigits = props.maxIntegerDigits;
  const minValue = props.minValue;
  const maxValue = props.maxValue;

  const integersInputSection = MaskSectionInput('integers', {
    maskingFn: integerMaskFn(minIntegerDigits, thousandSeparator),
    inputCharacterFilterFn: validationFnFromRegexString(`^[\-0-9]$`),
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^-?(|[0-9]|[1-9][0-9]*)$`),
    maxLength: maxIntegerDigits,
    spinFn: integerSpinFn(minValue, maxValue),
  });

  return {
    encodeValidatedValue: integerEncodeValidatedValue,
    semanticValidationFn: integerSemanticValidationFn(minValue, maxValue),
    sections: [...prefixes, integersInputSection, ...suffixes],
  };
};
