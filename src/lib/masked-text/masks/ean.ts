import type { MaskCharacter, MaskDefinition, MaskSectionDefinition } from '../base/types';
import { MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from '../base/index';
import { splitStringIntoGraphemes } from '../base/helper';

const eanEncodeValidatedValue = (values: Record<string, string[]>): string | undefined => {
  const countryCode = (values['countryCode'] ?? []).join('');
  const manufacturerCode = (values['manufacturerCode'] ?? []).join('');
  const productCode = (values['productCode'] ?? []).join('');
  const checkDigit = (values['checkDigit'] ?? []).join('');

  if (!countryCode || !manufacturerCode || !productCode || !checkDigit) {
    return undefined;
  }

  return `${countryCode}${manufacturerCode}${productCode}${checkDigit}`;
};

const calculateEanCheckDigit = (digits: string): string => {
  if (digits.length !== 12) {
    return '0';
  }

  let sum = 0;

  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const remainder = sum % 10;

  return remainder === 0 ? '0' : (10 - remainder).toString();
};

const eanSemanticValidationFn = (values: Record<string, string[]>): [boolean, string] => {
  const countryCode = (values['countryCode'] ?? []).join('');
  const manufacturerCode = (values['manufacturerCode'] ?? []).join('');
  const productCode = (values['productCode'] ?? []).join('');
  const checkDigit = (values['checkDigit'] ?? []).join('');

  if (countryCode.length !== 1 || manufacturerCode.length !== 6 || productCode.length !== 5 || checkDigit.length !== 1) {
    return [false, 'invalid EAN'];
  }

  const first12Digits = countryCode + manufacturerCode + productCode;
  const calculatedCheckDigit = calculateEanCheckDigit(first12Digits);

  if (checkDigit !== calculatedCheckDigit) {
    return [false, `invalid EAN: expected check digit ${calculatedCheckDigit}, got ${checkDigit}`];
  }

  return [true, ''];
};

// Country Code (first digit) masking function
const countryCodeMaskFn = (sectionValue: string[]): MaskCharacter[] => {
  const ret: MaskCharacter[] = [];

  if (sectionValue.length === 0) {
    ret.push({ char: '0', type: 'mask' as const });
  } else {
    ret.push({ char: sectionValue[0], type: 'value' as const });
  }

  return ret;
};

// Manufacturer Code (6 digits) masking function
const manufacturerCodeMaskFn = (sectionValue: string[]): MaskCharacter[] => {
  const ret: MaskCharacter[] = [];

  for (let i = 0; i < sectionValue.length; i++) {
    ret.push({ char: sectionValue[i], type: 'value' as const });
  }

  for (let i = 0; i < Math.max(6 - sectionValue.length, 0); i++) {
    ret.push({ char: '0', type: 'mask' as const });
  }

  return ret;
};

// Product Code (5 digits) masking function
const productCodeMaskFn = (sectionValue: string[]): MaskCharacter[] => {
  const ret: MaskCharacter[] = [];

  for (let i = 0; i < sectionValue.length; i++) {
    ret.push({ char: sectionValue[i], type: 'value' as const });
  }

  for (let i = 0; i < Math.max(5 - sectionValue.length, 0); i++) {
    ret.push({ char: '0', type: 'mask' as const });
  }

  return ret;
};

// Check Digit masking function
const checkDigitMaskFn = (sectionValue: string[]): MaskCharacter[] => {
  const ret: MaskCharacter[] = [];

  if (sectionValue.length === 0) {
    ret.push({ char: '0', type: 'mask' as const });
  } else {
    ret.push({ char: sectionValue[0], type: 'value' as const });
  }

  return ret;
};

const autoCalculateCheckDigit = (values: Record<string, string[]>): Record<string, string[]> => {
  const countryCode = (values['countryCode'] ?? []).join('');
  const manufacturerCode = (values['manufacturerCode'] ?? []).join('');
  const productCode = (values['productCode'] ?? []).join('');

  if (countryCode.length === 1 && manufacturerCode.length === 6 && productCode.length === 5) {
    const first12Digits = countryCode + manufacturerCode + productCode;
    const calculatedCheckDigit = calculateEanCheckDigit(first12Digits);

    values['checkDigit'] = [calculatedCheckDigit];
  }

  return values;
};

const countryCodeSpinFn = (
  direction: 'up' | 'down',
  values: Record<string, string[]>,
  sectionSlug: string,
  metaPressed: boolean,
  shiftPressed: boolean,
  altPressed: boolean,
): Record<string, string[]> => {
  const newValues = { ...values };

  if (sectionSlug === 'countryCode') {
    const currentValue = parseInt(newValues[sectionSlug]?.join('') || '0', 10);
    const newValue = (currentValue + 1) % 10;

    newValues[sectionSlug] = [newValue.toString()];
  }

  return autoCalculateCheckDigit(newValues);
};

const countryCodeSpinDownFn = (
  direction: 'up' | 'down',
  values: Record<string, string[]>,
  sectionSlug: string,
  metaPressed: boolean,
  shiftPressed: boolean,
  altPressed: boolean,
): Record<string, string[]> => {
  const newValues = { ...values };

  if (sectionSlug === 'countryCode') {
    const currentValue = parseInt(newValues[sectionSlug]?.join('') || '0', 10);
    const newValue = currentValue === 0 ? 9 : currentValue - 1;

    newValues[sectionSlug] = [newValue.toString()];
  }

  return autoCalculateCheckDigit(newValues);
};

const manufacturerCodeSpinFn = (
  direction: 'up' | 'down',
  values: Record<string, string[]>,
  sectionSlug: string,
  metaPressed: boolean,
  shiftPressed: boolean,
  altPressed: boolean,
): Record<string, string[]> => {
  const newValues = { ...values };

  if (sectionSlug === 'manufacturerCode') {
    const currentValue = parseInt(newValues[sectionSlug]?.join('') || '0', 10);
    const spinDirection = direction === 'up' ? 1 : -1;
    const spinAmount = (shiftPressed ? 100 : 1) * spinDirection;
    let newValue = currentValue + spinAmount;

    if (newValue > 999999) {
      newValue = 0;
    } else if (newValue < 0) {
      newValue = 999999;
    }

    newValues[sectionSlug] = splitStringIntoGraphemes(newValue.toString().padStart(6, '0'));
  }

  return autoCalculateCheckDigit(newValues);
};

const productCodeSpinFn = (
  direction: 'up' | 'down',
  values: Record<string, string[]>,
  sectionSlug: string,
  metaPressed: boolean,
  shiftPressed: boolean,
  altPressed: boolean,
): Record<string, string[]> => {
  const newValues = { ...values };

  if (sectionSlug === 'productCode') {
    const currentValue = parseInt(newValues[sectionSlug]?.join('') || '0', 10);
    const spinDirection = direction === 'up' ? 1 : -1;
    const spinAmount = (shiftPressed ? 100 : 1) * spinDirection;
    let newValue = currentValue + spinAmount;

    if (newValue > 99999) {
      newValue = 0;
    } else if (newValue < 0) {
      newValue = 99999;
    }

    newValues[sectionSlug] = splitStringIntoGraphemes(newValue.toString().padStart(5, '0'));
  }

  return autoCalculateCheckDigit(newValues);
};

export const EanMask = (): MaskDefinition => {
  const sectionCountryCode = MaskSectionInput('countryCode', {
    maskingFn: countryCodeMaskFn,
    alignment: 'left',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,1}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 1,
    spinFn: countryCodeSpinFn,
  });

  const sectionManufacturerCode = MaskSectionInput('manufacturerCode', {
    maskingFn: manufacturerCodeMaskFn,
    alignment: 'left',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,6}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 6,
    spinFn: manufacturerCodeSpinFn,
  });

  const sectionProductCode = MaskSectionInput('productCode', {
    maskingFn: productCodeMaskFn,
    alignment: 'left',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,5}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 5,
    spinFn: productCodeSpinFn,
  });

  const sectionCheckDigit = MaskSectionInput('checkDigit', {
    maskingFn: checkDigitMaskFn,
    alignment: 'left',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,1}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 1,
  });

  const sections: MaskSectionDefinition[] = [
    sectionCountryCode,
    MaskSectionFixed('-', ['-', '/', ' ']),
    sectionManufacturerCode,
    MaskSectionFixed('-', ['-', '/', ' ']),
    sectionProductCode,
    MaskSectionFixed('-', ['-', '/', ' ']),
    sectionCheckDigit,
  ];

  return {
    encodeValidatedValue: eanEncodeValidatedValue,
    semanticValidationFn: eanSemanticValidationFn,
    sections,
  };
};
