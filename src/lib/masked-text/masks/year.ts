import type { MaskCharacter, MaskDefinition, MaskSectionDefinition } from '../base/types';
import { MaskSectionInput, validationFnFromRegexString } from '../base/index';
import { splitStringIntoGraphemes } from '../base/helper';

const yearEncodeValidatedValue = (values: Record<string, string[]>): string | undefined => {
  const year = (values['year'] ?? []).join('');

  if (!year) {
    return undefined;
  }

  return `${year}-01-01`;
};

const yearMaskFn = (sectionValue: string[]): MaskCharacter[] => {
  const ret: MaskCharacter[] = [];

  if (sectionValue.length === 0) {
    return [
      { char: 'Y', type: 'mask' as const },
      { char: 'Y', type: 'mask' as const },
      { char: 'Y', type: 'mask' as const },
      { char: 'Y', type: 'mask' as const },
    ];
  }

  for (let i = 0; i < Math.max(4 - sectionValue.length, 0); i++) {
    ret.push({ char: '0', type: 'mask' as const });
  }

  for (const char of sectionValue) {
    ret.push({ char, type: 'value' as const });
  }

  return ret;
};

const yearSemanticValidationFn = (minYearString: string, maxYearString: string) => {
  const minYear = parseInt(minYearString, 10);
  const maxYear = parseInt(maxYearString, 10);

  return (values: Record<string, string[]>): [boolean, string] => {
    const yearStr = (values['year'] ?? []).join('');

    if (!yearStr) {
      return [true, ''];
    }

    const year = parseInt(yearStr, 10);

    if (isNaN(year)) {
      return [false, 'invalid year'];
    }

    if (year > maxYear) {
      return [false, `year larger than max ${maxYearString}`];
    }

    if (year < minYear) {
      return [false, `year smaller than min ${minYearString}`];
    }

    return [true, ''];
  };
};

const yearSpinUpFn = (minYearString: string, maxYearString: string) => {
  const minYear = parseInt(minYearString, 10);
  const maxYear = parseInt(maxYearString, 10);

  return (
    values: Record<string, string[]>,
    sectionSlug: string,
    metaPressed: boolean,
    shiftPressed: boolean,
    altPressed: boolean,
  ): Record<string, string[]> => {
    const newValues = { ...values } as Record<string, string[]>;

    const todaysDate = new Date();
    const todaysDateYearStr = todaysDate.getUTCFullYear().toString();

    if (altPressed) {
      const currentValue = parseInt(newValues[sectionSlug].join('') || '0', 10);
      const spinAmount = shiftPressed ? 10 : 1;
      let newValue = currentValue;

      if (sectionSlug === 'year') {
        if (newValues[sectionSlug].length === 0) {
          newValues[sectionSlug] = splitStringIntoGraphemes(todaysDateYearStr);
        } else {
          newValue = Math.max(Math.min(currentValue + spinAmount, maxYear), minYear);
          newValues[sectionSlug] = splitStringIntoGraphemes(newValue.toString());
        }
      }
    } else {
      const allSectionsEmpty = Object.values(newValues).every((section) => section.length === 0);

      if (allSectionsEmpty) {
        newValues['year'] = splitStringIntoGraphemes(todaysDateYearStr);
      } else {
        const yearStr = newValues['year'].length > 0 ? newValues['year'].join('') : todaysDateYearStr;
        const year = parseInt(yearStr, 10);
        const spinAmount = shiftPressed ? 10 : 1;
        const newYear = Math.max(Math.min(year + spinAmount, maxYear), minYear);

        newValues['year'] = splitStringIntoGraphemes(newYear.toString());
      }
    }

    return newValues;
  };
};

const yearSpinDownFn = (minYearString: string, maxYearString: string) => {
  const minYear = parseInt(minYearString, 10);
  const maxYear = parseInt(maxYearString, 10);

  return (
    values: Record<string, string[]>,
    sectionSlug: string,
    metaPressed: boolean,
    shiftPressed: boolean,
    altPressed: boolean,
  ): Record<string, string[]> => {
    const newValues = { ...values } as Record<string, string[]>;

    const todaysDate = new Date();
    const todaysDateYearStr = todaysDate.getUTCFullYear().toString();

    if (altPressed) {
      const currentValue = parseInt(newValues[sectionSlug].join('') || '0', 10);
      const spinAmount = shiftPressed ? 10 : 1;
      let newValue = currentValue;

      if (sectionSlug === 'year') {
        if (newValues[sectionSlug].length === 0) {
          newValues[sectionSlug] = splitStringIntoGraphemes(todaysDateYearStr);
        } else {
          newValue = Math.min(Math.max(currentValue - spinAmount, minYear), maxYear);
          newValues[sectionSlug] = splitStringIntoGraphemes(newValue.toString());
        }
      }
    } else {
      const allSectionsEmpty = Object.values(newValues).every((section) => section.length === 0);

      if (allSectionsEmpty) {
        newValues['year'] = splitStringIntoGraphemes(todaysDateYearStr);
      } else {
        const yearStr = newValues['year'].length > 0 ? newValues['year'].join('') : todaysDateYearStr;
        const year = parseInt(yearStr, 10);
        const spinAmount = shiftPressed ? 10 : 1;
        const newYear = Math.min(Math.max(year - spinAmount, minYear), maxYear);

        newValues['year'] = splitStringIntoGraphemes(newYear.toString());
      }
    }

    return newValues;
  };
};

const yearValueNormalizationFn = (values: Record<string, string[]>): Record<string, string[]> => {
  const normalizedValues = { ...values };

  if (values.year && values.year.length <= 2) {
    const yearValue = parseInt(values.year.join(''));

    if (!isNaN(yearValue)) {
      const century = yearValue < 90 ? 2000 : 1900;

      normalizedValues.year = (century + yearValue).toString().split('');
    }
  }

  return normalizedValues;
};

export const YearMask = (minYear?: number, maxYear?: number): MaskDefinition => {
  const minYearString = (minYear ?? 1900).toString();
  const maxYearString = (maxYear ?? 2100).toString();

  const sectionYear = MaskSectionInput('year', {
    maskingFn: yearMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,4}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 4,
    spinUpFn: yearSpinUpFn(minYearString, maxYearString),
    spinDownFn: yearSpinDownFn(minYearString, maxYearString),
  });

  const semanticValidationFn = yearSemanticValidationFn(minYearString, maxYearString);
  const sections: MaskSectionDefinition[] = [sectionYear];

  return {
    encodeValidatedValue: yearEncodeValidatedValue,
    semanticValidationFn,
    valueNormalizationFn: yearValueNormalizationFn,
    sections,
  };
};
