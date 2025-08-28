import type { MaskCharacter, MaskDefinition, MaskSectionDefinition } from '../base/types';
import { MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from '../base/index';
import { splitStringIntoGraphemes } from '../base/helper';
import { default as ISBNRanges } from '../data/isbn_ranges.json';

const getBestGuessForSectionLengths = function (values: Record<string, string[]>): {
  groupLength: number;
  publisherLength: number;
  titleLength: number;
  isValidGroup: boolean;
  isValidPublisher: boolean;
} {
  const prefixes = (ISBNRanges as Record<string, any>).prefixes as Record<string, any>;
  const groups = (ISBNRanges as Record<string, any>).groups as Record<string, any>;

  const prefixValue = values['prefix']?.join('') || '978';

  const groupValue = values['group']?.join('') || '';
  const groupValueInt = parseInt(groupValue.padEnd(7, '0'), 10);

  const publisherValue = values['publisher']?.join('') || '';
  const publisherValueInt = parseInt(publisherValue.padEnd(7, '0'), 10);

  let groupLength = 7;
  let publisherLength = 7;
  let titleLength = 6;
  let isValidGroup = false;
  let isValidPublisher = false;

  if (groupValue.length !== 0) {
    if (prefixes[prefixValue] !== undefined) {
      const groupRanges = prefixes[prefixValue]?.ranges as [number, number, number][];

      for (const [start, end, groupLengthFromRange] of groupRanges) {
        if (groupValueInt >= start && groupValueInt <= end) {
          const groupWithPrefix = `${prefixValue}-${groupValue}`;

          if (groups[groupWithPrefix] !== undefined) {
            isValidGroup = true;
            groupLength = groupLengthFromRange;

            const publisherRanges = groups[groupWithPrefix]?.ranges as [number, number, number, number][];

            for (const [start, end, publisherLengthFromRange, titleLengthFromRange] of publisherRanges) {
              if (publisherValueInt >= start && publisherValueInt <= end && publisherLengthFromRange > 0) {
                isValidPublisher = true;
                publisherLength = publisherLengthFromRange;
                titleLength = titleLengthFromRange;
              }
            }
          }
        }
      }
    }
  }

  return {
    groupLength,
    publisherLength,
    titleLength,
    isValidGroup,
    isValidPublisher,
  };
};

const isbnEncodeValidatedValue = (values: Record<string, string[]>): string | undefined => {
  const prefix = (values['prefix'] ?? []).join('');
  const group = (values['group'] ?? []).join('');
  const publisher = (values['publisher'] ?? []).join('');
  const title = (values['title'] ?? []).join('');
  const checkDigit = (values['checkDigit'] ?? []).join('');

  if (!group || !publisher || !title || !checkDigit) {
    return undefined;
  }

  if (prefix) {
    return `${prefix}-${group}-${publisher}-${title}-${checkDigit}`;
  } else {
    return `${group}-${publisher}-${title}-${checkDigit}`;
  }
};

const calculateIsbn10CheckDigit = (digits: string): string => {
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }

  const checkDigit = 11 - (sum % 11);

  if (checkDigit === 10) {
    return 'X';
  } else if (checkDigit === 11) {
    return '0';
  } else return checkDigit.toString();
};

const calculateIsbn13CheckDigit = (digits: string): string => {
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i]);

    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const remainder = sum % 10;

  return remainder === 0 ? '0' : (10 - remainder).toString();
};

const isbnSemanticValidationFn = (values: Record<string, string[]>): [boolean, string] => {
  const prefix = (values['prefix'] ?? []).join('');
  const group = (values['group'] ?? []).join('');
  const publisher = (values['publisher'] ?? []).join('');
  const title = (values['title'] ?? []).join('');
  const checkDigit = (values['checkDigit'] ?? []).join('');

  const isIsbn13 = prefix.length > 0;

  if (isIsbn13) {
    if (prefix.length !== 3 || group.length === 0 || publisher.length === 0 || title.length === 0 || checkDigit.length !== 1) {
      return [false, 'invalid ISBN-13 format'];
    }

    const first12Digits = prefix + group + publisher + title;
    if (first12Digits.length !== 12) {
      return [false, 'ISBN-13 must have exactly 12 digits before check digit'];
    }

    const calculatedCheckDigit = calculateIsbn13CheckDigit(first12Digits);
    if (checkDigit !== calculatedCheckDigit) {
      return [false, `invalid ISBN-13: expected check digit ${calculatedCheckDigit}, got ${checkDigit}`];
    }
  } else {
    if (group.length === 0 || publisher.length === 0 || title.length === 0 || checkDigit.length !== 1) {
      return [false, 'invalid ISBN-10 format'];
    }

    const first9Digits = group + publisher + title;

    if (first9Digits.length !== 9) {
      return [false, 'ISBN-10 must have exactly 9 digits before check digit'];
    }

    const calculatedCheckDigit = calculateIsbn10CheckDigit(first9Digits);

    if (checkDigit !== calculatedCheckDigit) {
      return [false, `invalid ISBN-10: expected check digit ${calculatedCheckDigit}, got ${checkDigit}`];
    }
  }

  return [true, ''];
};

const autoCalculateCheckDigit = (values: Record<string, string[]>): Record<string, string[]> => {
  const newValues = { ...values };
  const prefix = (values['prefix'] ?? []).join('');
  const group = (values['group'] ?? []).join('');
  const publisher = (values['publisher'] ?? []).join('');
  const title = (values['title'] ?? []).join('');

  const isIsbn13 = prefix.length > 0;

  if (isIsbn13) {
    const first12Digits = prefix + group + publisher + title;

    if (prefix.length === 3 && first12Digits.length === 12) {
      const calculatedCheckDigit = calculateIsbn13CheckDigit(first12Digits);

      newValues['checkDigit'] = [calculatedCheckDigit];
    }
  } else {
    const first9Digits = group + publisher + title;

    if (first9Digits.length === 9) {
      const calculatedCheckDigit = calculateIsbn10CheckDigit(first9Digits);

      newValues['checkDigit'] = [calculatedCheckDigit];
    }
  }

  return newValues;
};

const prefixMaskFn = (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
  const sectionValue = values[sectionSlug] ?? [];
  const ret: MaskCharacter[] = [];

  if (sectionValue.length === 0) {
    ret.push({ char: '0', type: 'mask' as const });
    ret.push({ char: '0', type: 'mask' as const });
    ret.push({ char: '0', type: 'mask' as const });
  } else {
    for (let i = 0; i < sectionValue.length; i++) {
      ret.push({ char: sectionValue[i], type: 'value' as const });
    }

    for (let i = 0; i < Math.max(3 - sectionValue.length, 0); i++) {
      ret.push({ char: '0', type: 'mask' as const });
    }
  }

  return ret;
};

const prefixSpinFn = (
  direction: 'up' | 'down',
  values: Record<string, string[]>,
  sectionSlug: string,
  metaPressed: boolean,
  shiftPressed: boolean,
  altPressed: boolean,
): Record<string, string[]> => {
  const newValues = { ...values };

  if (sectionSlug === 'prefix') {
    const currentValue = newValues[sectionSlug]?.join('');

    if (currentValue === '978') {
      newValues[sectionSlug] = ['9', '7', '9'];
    } else {
      newValues[sectionSlug] = ['9', '7', '8'];
    }
  }

  return autoCalculateCheckDigit(newValues);
};

const registrationGroupSectionMaskFn = (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
  const sectionValue = values[sectionSlug] ?? [];
  const ret: MaskCharacter[] = [];

  if (sectionValue.length === 0) {
    ret.push({ char: '0', type: 'mask' as const });
  } else {
    for (let i = 0; i < sectionValue.length; i++) {
      ret.push({ char: sectionValue[i], type: 'value' as const });
    }
  }

  return ret;
};

const registrationGroupSpinFn = (
  direction: 'up' | 'down',
  values: Record<string, string[]>,
  sectionSlug: string,
  metaPressed: boolean,
  shiftPressed: boolean,
  altPressed: boolean,
): Record<string, string[]> => {
  const newValues = { ...values };

  if (sectionSlug === 'group') {
    let currentPrefix = newValues['prefix']?.join('');

    if (currentPrefix === '') {
      currentPrefix = '978';
      newValues['prefix'] = ['9', '7', '8'];
    }

    const currentGroupValue = newValues[sectionSlug]?.join('');
    const groups = (ISBNRanges as Record<string, any>).groups as Record<string, any>;
    const validGroupStrings = [];

    for (const groupKey in groups) {
      if (groupKey.startsWith(`${currentPrefix}-`)) {
        validGroupStrings.push(groupKey.split('-')[1]);
      }
    }

    if (direction === 'up') {
      const validLargerGroups = validGroupStrings.filter((groupString) => groupString > currentGroupValue).sort();

      if (validLargerGroups.length > 0) {
        newValues[sectionSlug] = splitStringIntoGraphemes(validLargerGroups[0]);
      } else {
        newValues[sectionSlug] = splitStringIntoGraphemes(validGroupStrings[0]);
      }
    } else {
      const validSmallerGroups = validGroupStrings.filter((groupString) => groupString < currentGroupValue).sort();

      if (validSmallerGroups.length > 0) {
        newValues[sectionSlug] = splitStringIntoGraphemes(validSmallerGroups[validSmallerGroups.length - 1]);
      } else {
        newValues[sectionSlug] = splitStringIntoGraphemes(validGroupStrings[validGroupStrings.length - 1]);
      }
    }
  }

  return autoCalculateCheckDigit(newValues);
};

const registrationGroupAutoAdvanceFn = (values: Record<string, string[]>): boolean => {
  const sectionLengths = getBestGuessForSectionLengths(values);
  const groupValue = values['group'] ?? [];

  return groupValue.length === sectionLengths.groupLength;
};

const publisherSectionMaskFn = (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
  const sectionValue = values[sectionSlug] ?? [];
  const ret: MaskCharacter[] = [];
  const sectionLengths = getBestGuessForSectionLengths(values);

  for (let i = 0; i < sectionValue.length; i++) {
    ret.push({ char: sectionValue[i], type: 'value' as const });
  }

  for (let i = 0; i < Math.max(sectionLengths.publisherLength - sectionValue.length, 0); i++) {
    ret.push({ char: '0', type: 'mask' as const });
  }

  return ret;
};
const publisherSpinFn = (
  direction: 'up' | 'down',
  values: Record<string, string[]>,
  sectionSlug: string,
  metaPressed: boolean,
  shiftPressed: boolean,
  altPressed: boolean,
): Record<string, string[]> => {
  const newValues = { ...values };

  if (sectionSlug === 'publisher') {
    const prefixValue = newValues['prefix']?.join('') || '978';
    const groupValue = newValues['group']?.join('') || '';
    const currentPublisherValue = newValues['publisher']?.join('') || '';
    const currentPublisherIntValue = currentPublisherValue !== '' ? parseInt(currentPublisherValue.padEnd(7, '0'), 10) : Number.NaN;

    if (!groupValue) {
      return newValues;
    }

    const prefixGroupKey = `${prefixValue}-${groupValue}`;
    const groups = (ISBNRanges as Record<string, any>).groups as Record<string, any>;

    if (!groups[prefixGroupKey]) {
      return newValues;
    }

    const publisherRanges = groups[prefixGroupKey]?.ranges as [number, number, number, number][];
    const validRanges = publisherRanges.filter(([start, end, publisherLength, titleLength]) => publisherLength > 0);

    let currentRangeIndex = -1;
    let newPublisherValue: number = -1;
    const spinAmount = shiftPressed ? 10 : 1;

    for (let i = 0; i < validRanges.length; i++) {
      const [start, end, publisherLength] = validRanges[i];

      if (currentPublisherIntValue >= start && currentPublisherIntValue <= end) {
        currentRangeIndex = i;
        newPublisherValue = currentPublisherIntValue + (direction === 'up' ? 1 : -1) * spinAmount * Math.pow(10, 7 - publisherLength);
        break;
      }
    }

    if (newPublisherValue === -1) {
      if (direction === 'up') {
        newPublisherValue = validRanges[0][0];
      } else {
        const lastRange = validRanges[validRanges.length - 1];
        newPublisherValue = lastRange[1];
      }
    } else {
      const [start, end] = validRanges[currentRangeIndex];

      if (direction === 'up') {
        if (newPublisherValue > end) {
          if (currentRangeIndex < validRanges.length - 1) {
            newPublisherValue = validRanges[currentRangeIndex + 1][0];
          } else {
            newPublisherValue = validRanges[0][0];
          }
        }
      } else {
        if (newPublisherValue < start) {
          if (currentRangeIndex > 0) {
            newPublisherValue = validRanges[currentRangeIndex - 1][1];
          } else {
            newPublisherValue = validRanges[validRanges.length - 1][1];
          }
        }
      }
    }

    const targetRange = validRanges.find(([start, end]) => newPublisherValue >= start && newPublisherValue <= end);

    if (targetRange) {
      const [, , publisherLength] = targetRange;
      const publisherString = newPublisherValue.toString().padStart(7, '0').substring(0, publisherLength);
      newValues[sectionSlug] = splitStringIntoGraphemes(publisherString);
    }
  }

  return autoCalculateCheckDigit(newValues);
};

const publisherAutoAdvanceFn = (values: Record<string, string[]>): boolean => {
  const sectionLengths = getBestGuessForSectionLengths(values);
  const publisherValue = values['publisher'] ?? [];

  return publisherValue.length === sectionLengths.publisherLength;
};

const titleSectionMaskFn = (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
  const sectionValue = values[sectionSlug] ?? [];
  const ret: MaskCharacter[] = [];
  const sectionLengths = getBestGuessForSectionLengths(values);

  for (let i = 0; i < Math.max(sectionLengths.titleLength - sectionValue.length, 0); i++) {
    ret.push({ char: '0', type: 'mask' as const });
  }

  for (let i = 0; i < sectionValue.length; i++) {
    ret.push({ char: sectionValue[i], type: 'value' as const });
  }

  return ret;
};

const titleSpinFn = (
  direction: 'up' | 'down',
  values: Record<string, string[]>,
  sectionSlug: string,
  metaPressed: boolean,
  shiftPressed: boolean,
  altPressed: boolean,
): Record<string, string[]> => {
  const newValues = { ...values };

  if (sectionSlug === 'title') {
    const sectionLengths = getBestGuessForSectionLengths(values);
    const currentValue = parseInt(newValues[sectionSlug]?.join('') || '0', 10);
    const maxTitleValue = Math.pow(10, sectionLengths.titleLength) - 1;
    const spinAmount = shiftPressed ? (sectionLengths.titleLength > 2 ? 100 : 10) : 1;
    let newValue = currentValue + spinAmount * (direction === 'up' ? 1 : -1);

    if (newValue < 0) {
      newValue = maxTitleValue;
    } else if (newValue > maxTitleValue) {
      newValue = 0;
    }

    newValues[sectionSlug] = splitStringIntoGraphemes(newValue.toString().padStart(sectionLengths.titleLength, '0'));
  }

  return autoCalculateCheckDigit(newValues);
};

const titleAutoAdvanceFn = (values: Record<string, string[]>): boolean => {
  const sectionLengths = getBestGuessForSectionLengths(values);
  const titleValue = values['title'] ?? [];

  return titleValue.length === sectionLengths.titleLength;
};

const checkDigitMaskFn = (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
  const sectionValue = values[sectionSlug] ?? [];
  const ret: MaskCharacter[] = [];

  if (sectionValue.length === 0) {
    ret.push({ char: '0', type: 'mask' as const });
  } else {
    ret.push({ char: sectionValue[0], type: 'value' as const });
  }

  return ret;
};

const checkDigitSpinFn = (
  direction: 'up' | 'down',
  values: Record<string, string[]>,
  sectionSlug: string,
  metaPressed: boolean,
  shiftPressed: boolean,
  altPressed: boolean,
): Record<string, string[]> => {
  return autoCalculateCheckDigit(values);
};

export const IsbnMask = (): MaskDefinition => {
  const sectionPrefix = MaskSectionInput('prefix', {
    maskingFn: prefixMaskFn,
    alignment: 'left',
    syntacticValidationFn: validationFnFromRegexString(`^(978|979|)$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    spinFn: prefixSpinFn,
    maxLength: 3,
  });

  const sectionRegistrationGroup = MaskSectionInput('group', {
    maskingFn: registrationGroupSectionMaskFn,
    alignment: 'left',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,5}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    autoAdvanceFn: registrationGroupAutoAdvanceFn,
    maxLength: 7,
    spinFn: registrationGroupSpinFn,
  });

  const sectionPublisher = MaskSectionInput('publisher', {
    maskingFn: publisherSectionMaskFn,
    alignment: 'left',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,7}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    autoAdvanceFn: publisherAutoAdvanceFn,
    maxLength: 7,
    spinFn: publisherSpinFn,
  });

  const sectionTitle = MaskSectionInput('title', {
    maskingFn: titleSectionMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,6}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    autoAdvanceFn: titleAutoAdvanceFn,
    maxLength: 6,
    spinFn: titleSpinFn,
  });

  const sectionCheckDigit = MaskSectionInput('checkDigit', {
    maskingFn: checkDigitMaskFn,
    alignment: 'left',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9X]{0,1}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9X]$`),
    maxLength: 1,
    spinFn: checkDigitSpinFn,
  });

  const sections: MaskSectionDefinition[] = [
    sectionPrefix,
    MaskSectionFixed('-', ['-', '/', ' ']),
    sectionRegistrationGroup,
    MaskSectionFixed('-', ['-', '/', ' ']),
    sectionPublisher,
    MaskSectionFixed('-', ['-', '/', ' ']),
    sectionTitle,
    MaskSectionFixed('-', ['-', '/', ' ']),
    sectionCheckDigit,
  ];

  return {
    encodeValidatedValue: isbnEncodeValidatedValue,
    semanticValidationFn: isbnSemanticValidationFn,
    sections,
  };
};
