import type { MaskCharacter, MaskDefinition, MaskSectionDefinition } from '../base/types';
import { MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from '../base/index';
import { splitStringIntoGraphemes } from '../base/helper';

const yearMonthEncodeValidatedValue = (values: Record<string, string[]>): string | undefined => {
  const year = (values['year'] ?? []).join('');
  const month = (values['month'] ?? []).join('');

  if (!year || !month) {
    return undefined;
  }

  return year + '-' + month.padStart(2, '0');
};

const yearMonthYearMaskFn = (sectionValue: string[]): MaskCharacter[] => {
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

const yearMonthMonthMaskFn = (sectionValue: string[]): MaskCharacter[] => {
  const ret: MaskCharacter[] = [];

  if (sectionValue.length === 0) {
    return [
      { char: 'M', type: 'mask' as const },
      { char: 'M', type: 'mask' as const },
    ];
  }

  for (let i = 0; i < Math.max(2 - sectionValue.length, 0); i++) {
    ret.push({ char: '0', type: 'mask' as const });
  }

  for (const char of sectionValue) {
    ret.push({ char, type: 'value' as const });
  }

  return ret;
};

const yearMonthSemanticValidationFn = (minYearMonthISOString: string, maxYearMonthISOString: string) => {
  const minDate = new Date(`${minYearMonthISOString}-01T00:00:00.000Z`);
  const maxDate = new Date(`${maxYearMonthISOString}-01T00:00:00.000Z`);

  return (values: Record<string, string[]>): [boolean, string] => {
    const yearStr = (values['year'] ?? []).join('');
    const monthStr = (values['month'] ?? []).join('');

    if (!yearStr || !monthStr) {
      return [true, ''];
    }

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return [false, 'invalid year/month'];
    }

    const encodedDateTimeValue = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-01T00:00:00.000Z`;

    try {
      const valueDate = new Date(encodedDateTimeValue);

      if (valueDate.getUTCFullYear() !== year || valueDate.getUTCMonth() + 1 !== month) {
        return [false, 'invalid year/month'];
      }

      if (valueDate > maxDate) {
        return [false, `year/month larger than max ${maxYearMonthISOString}`];
      }

      if (valueDate < minDate) {
        return [false, `year/month smaller than min ${minYearMonthISOString}`];
      }

      return [true, ''];
    } catch (e) {
      return [false, 'invalid year/month'];
    }
  };
};

const yearMonthSpinUpFn = (minYearMonthISOString: string, maxYearMonthISOString: string) => {
  const maxDate = new Date(`${maxYearMonthISOString}-01T00:00:00.000Z`);
  const minDate = new Date(`${minYearMonthISOString}-01T00:00:00.000Z`);
  const minDateYearStr = minDate.getUTCFullYear().toString();
  const minDateMonthStr = (minDate.getUTCMonth() + 1).toString();

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
    const todaysDateMonthStr = (todaysDate.getUTCMonth() + 1).toString();

    if (altPressed) {
      const currentValue = parseInt(newValues[sectionSlug].join('') || '0', 10);
      const spinAmount = shiftPressed ? 10 : 1;
      let newValue = currentValue;

      if (sectionSlug === 'year') {
        if (newValues[sectionSlug].length === 0) {
          newValues[sectionSlug] = splitStringIntoGraphemes(todaysDateYearStr);
        } else {
          newValue = currentValue + spinAmount;
          newValues[sectionSlug] = splitStringIntoGraphemes(newValue.toString());
        }
      } else if (sectionSlug === 'month') {
        newValue = currentValue + spinAmount;

        if (newValue > 12) {
          newValue = ((newValue - 1) % 12) + 1;
        } else if (newValue < 1) {
          newValue = 12 + ((newValue - 1) % 12) + 1;
        }

        newValues[sectionSlug] = splitStringIntoGraphemes(newValue.toString());
      }
    } else {
      const allSectionsEmpty = Object.values(newValues).every((section) => section.length === 0);

      if (allSectionsEmpty) {
        newValues['year'] = splitStringIntoGraphemes(todaysDateYearStr);
        newValues['month'] = splitStringIntoGraphemes(todaysDateMonthStr);
      } else {
        const yearStr = newValues['year'].length > 0 ? newValues['year'].join('') : todaysDateYearStr;
        const monthStr = newValues['month'].length > 0 ? newValues['month'].join('') : todaysDateYearStr === yearStr ? todaysDateMonthStr : '1';

        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);

        let newDate: Date;
        const currentDate = new Date(Date.UTC(year, month - 1, 1));
        const spinAmount = shiftPressed ? 10 : 1;

        if (sectionSlug === 'year') {
          newDate = new Date(Date.UTC(year + spinAmount, month - 1, 1));
        } else if (sectionSlug === 'month') {
          newDate = new Date(Date.UTC(year, month - 1 + spinAmount, 1));
        } else {
          newDate = currentDate;
        }

        if (newDate < minDate) {
          newDate.setTime(minDate.getTime());
        } else if (newDate > maxDate) {
          newDate.setTime(maxDate.getTime());
        }

        newValues['year'] = splitStringIntoGraphemes(newDate.getFullYear().toString());
        newValues['month'] = splitStringIntoGraphemes((newDate.getMonth() + 1).toString());
      }
    }

    return newValues;
  };
};

const yearMonthSpinDownFn = (minYearMonthISOString: string, maxYearMonthISOString: string) => {
  const maxDate = new Date(`${maxYearMonthISOString}-01T00:00:00.000Z`);
  const minDate = new Date(`${minYearMonthISOString}-01T00:00:00.000Z`);
  const maxDateYearStr = maxDate.getUTCFullYear().toString();
  const maxDateMonthStr = (maxDate.getUTCMonth() + 1).toString();

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
    const todaysDateMonthStr = (todaysDate.getUTCMonth() + 1).toString();

    if (altPressed) {
      const currentValue = parseInt(newValues[sectionSlug].join('') || '0', 10);
      const spinAmount = shiftPressed ? 10 : 1;
      let newValue = currentValue;

      if (sectionSlug === 'year') {
        if (newValues[sectionSlug].length === 0) {
          newValues[sectionSlug] = splitStringIntoGraphemes(todaysDateYearStr);
        } else {
          newValue = currentValue - spinAmount;
          newValues[sectionSlug] = splitStringIntoGraphemes(newValue.toString());
        }
      } else if (sectionSlug === 'month') {
        newValue = currentValue - spinAmount;

        if (newValue < 1) {
          newValue = 12 + ((newValue - 1) % 12) + 1;
        } else if (newValue > 12) {
          newValue = ((newValue - 1) % 12) + 1;
        }

        newValues[sectionSlug] = splitStringIntoGraphemes(newValue.toString());
      }
    } else {
      const allSectionsEmpty = Object.values(newValues).every((section) => section.length === 0);
      if (allSectionsEmpty) {
        newValues['year'] = splitStringIntoGraphemes(todaysDateYearStr);
        newValues['month'] = splitStringIntoGraphemes(todaysDateMonthStr);
      } else {
        const yearStr = newValues['year'].length > 0 ? newValues['year'].join('') : maxDate ? maxDateYearStr : '2000';
        const monthStr = newValues['month'].length > 0 ? newValues['month'].join('') : maxDate && maxDateYearStr === yearStr ? maxDateMonthStr : '12';

        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);

        let newDate: Date;
        const currentDate = new Date(Date.UTC(year, month - 1, 1));
        const spinAmount = shiftPressed ? 10 : 1;

        if (sectionSlug === 'year') {
          newDate = new Date(Date.UTC(year - spinAmount, month - 1, 1));
        } else if (sectionSlug === 'month') {
          newDate = new Date(Date.UTC(year, month - 1 - spinAmount, 1));
        } else {
          newDate = currentDate;
        }

        if (newDate < minDate) {
          newDate.setTime(minDate.getTime());
        } else if (newDate > maxDate) {
          newDate.setTime(maxDate.getTime());
        }

        newValues['year'] = splitStringIntoGraphemes(newDate.getFullYear().toString());
        newValues['month'] = splitStringIntoGraphemes((newDate.getMonth() + 1).toString());
      }
    }

    return newValues;
  };
};

const yearMonthValueNormalizationFn = (values: Record<string, string[]>): Record<string, string[]> => {
  const normalizedValues = { ...values };

  if (values.year && values.year.length <= 2) {
    const yearValue = parseInt(values.year.join(''));
    const century = yearValue < 90 ? 2000 : 1900;

    normalizedValues.year = (century + yearValue).toString().split('');
  }

  return normalizedValues;
};

export const YearMonthMask = (style: 'iso' | 'de' | 'en' | 'us' | 'jp' | 'kr', minYearMonth?: Date, maxYearMonth?: Date): MaskDefinition => {
  const minYearMonthISOString = minYearMonth ? `${minYearMonth.getFullYear()}-${(minYearMonth.getMonth() + 1).toString().padStart(2, '0')}` : '1900-01';
  const maxYearMonthISOString = maxYearMonth ? `${maxYearMonth.getFullYear()}-${(maxYearMonth.getMonth() + 1).toString().padStart(2, '0')}` : '2100-12';

  const sectionYear = MaskSectionInput('year', {
    maskingFn: yearMonthYearMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,4}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 4,
    spinUpFn: yearMonthSpinUpFn(minYearMonthISOString, maxYearMonthISOString),
    spinDownFn: yearMonthSpinDownFn(minYearMonthISOString, maxYearMonthISOString),
  });

  const sectionMonth = MaskSectionInput('month', {
    maskingFn: yearMonthMonthMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,2}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 2,
    spinUpFn: yearMonthSpinUpFn(minYearMonthISOString, maxYearMonthISOString),
    spinDownFn: yearMonthSpinDownFn(minYearMonthISOString, maxYearMonthISOString),
  });

  const skipKeys = ['/', '.', '-', ' '];
  const semanticValidationFn = yearMonthSemanticValidationFn(minYearMonthISOString, maxYearMonthISOString);
  let sections: MaskSectionDefinition[];

  if (style === 'en') {
    sections = [sectionMonth, MaskSectionFixed('/', skipKeys), sectionYear];
  } else if (style === 'us') {
    sections = [sectionMonth, MaskSectionFixed('/', skipKeys), sectionYear];
  } else if (style === 'de') {
    sections = [sectionMonth, MaskSectionFixed('.', skipKeys), sectionYear];
  } else if (style === 'jp') {
    sections = [sectionYear, MaskSectionFixed('年', skipKeys), sectionMonth, MaskSectionFixed('月')];
  } else if (style === 'kr') {
    sections = [sectionYear, MaskSectionFixed('년', skipKeys), sectionMonth, MaskSectionFixed('월')];
  } else {
    sections = [sectionYear, MaskSectionFixed('-', skipKeys), sectionMonth];
  }

  return {
    encodeValidatedValue: yearMonthEncodeValidatedValue,
    semanticValidationFn,
    valueNormalizationFn: yearMonthValueNormalizationFn,
    sections,
  };
};
