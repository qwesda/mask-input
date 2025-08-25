import type { MaskCharacter, MaskDefinition, MaskSectionDefinition } from '../base/types';
import { MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from '../base/index';
import { splitStringIntoGraphemes } from '../base/helper';

const dateEncodeValidatedValue = (values: Record<string, string[]>): string | undefined => {
  const year = (values['year'] ?? []).join('');
  const month = (values['month'] ?? []).join('');
  const day = (values['day'] ?? []).join('');

  if (!year || !month || !day) {
    return undefined;
  }

  return year + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0');
};

const dateYearMaskFn = (sectionValue: string[]): MaskCharacter[] => {
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

const dateMonthMaskFn = (sectionValue: string[]): MaskCharacter[] => {
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

const dateDayMaskFn = (sectionValue: string[]): MaskCharacter[] => {
  const ret: MaskCharacter[] = [];

  if (sectionValue.length === 0) {
    return [
      { char: 'D', type: 'mask' as const },
      { char: 'D', type: 'mask' as const },
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

const dateSemanticValidationFn = (minDateISOString: string, maxDateISOString: string) => {
  const minDate = new Date(`${minDateISOString}T00:00:00.000Z`);
  const maxDate = new Date(`${maxDateISOString}T00:00:00.000Z`);

  return (values: Record<string, string[]>): [boolean, string] => {
    const yearStr = (values['year'] ?? []).join('');
    const monthStr = (values['month'] ?? []).join('');
    const dayStr = (values['day'] ?? []).join('');

    if (!yearStr || !monthStr || !dayStr) {
      return [true, ''];
    }

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1) {
      return [false, 'invalid date'];
    }

    const encodedDateTimeValue = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T00:00:00.000Z`;

    try {
      const valueDate = new Date(encodedDateTimeValue);

      if (valueDate.getUTCFullYear() !== year || valueDate.getUTCMonth() + 1 !== month || valueDate.getUTCDate() !== day) {
        return [false, 'invalid date'];
      }

      if (valueDate > maxDate) {
        return [false, `date larger than max date ${maxDateISOString}`];
      }

      if (valueDate < minDate) {
        return [false, `date smaller than min date ${minDateISOString}`];
      }

      return [true, ''];
    } catch (e) {
      return [false, 'invalid date'];
    }
  };
};

const dateSpinUpFn = (minDateISOString: string, maxDateISOString: string) => {
  const maxDate = new Date(`${maxDateISOString}T00:00:00.000Z`);
  const minDate = new Date(`${minDateISOString}T00:00:00.000Z`);
  const minDateYearStr = minDate.getUTCFullYear().toString();
  const minDateMonthStr = (minDate.getUTCMonth() + 1).toString();
  const minDateDayStr = minDate.getUTCDate().toString();

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
    const todaysDateDayStr = todaysDate.getUTCDate().toString();

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
      } else if (sectionSlug === 'day') {
        const currentMonth = parseInt(newValues['month'].join('') || '1', 10);
        const currentYear = parseInt(newValues['year'].join('') || '2000', 10);
        const maxDays = new Date(Date.UTC(currentYear, currentMonth, 0)).getDate();

        newValue = currentValue + spinAmount;

        if (newValue > maxDays) {
          newValue = ((newValue - 1) % maxDays) + 1;
        } else if (newValue < 1) {
          newValue = maxDays + ((newValue - 1) % maxDays) + 1;
        }

        newValues[sectionSlug] = splitStringIntoGraphemes(newValue.toString());
      }
    } else {
      const allSectionsEmpty = Object.values(newValues).every((section) => section.length === 0);

      if (allSectionsEmpty) {
        newValues['year'] = splitStringIntoGraphemes(todaysDateYearStr);
        newValues['month'] = splitStringIntoGraphemes(todaysDateMonthStr);
        newValues['day'] = splitStringIntoGraphemes(todaysDateDayStr);
      } else {
        const yearStr = newValues['year'].length > 0 ? newValues['year'].join('') : todaysDateYearStr;
        const monthStr = newValues['month'].length > 0 ? newValues['month'].join('') : todaysDateYearStr === yearStr ? todaysDateMonthStr : '1';
        const dayStr =
          newValues['day'].length > 0
            ? newValues['day'].join('')
            : todaysDateYearStr === yearStr && todaysDateMonthStr === monthStr
              ? minDateDayStr
              : '1';

        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const day = parseInt(dayStr, 10);

        let newDate: Date;
        const currentDate = new Date(Date.UTC(year, month - 1, day));
        const spinAmount = shiftPressed ? 10 : 1;

        if (sectionSlug === 'year') {
          newDate = new Date(Date.UTC(year + spinAmount, month, 0));
          newDate.setUTCDate(Math.min(newDate.getUTCDate(), currentDate.getUTCDate()));
        } else if (sectionSlug === 'month') {
          newDate = new Date(Date.UTC(year, month + spinAmount, 0));
          newDate.setUTCDate(Math.min(newDate.getUTCDate(), currentDate.getUTCDate()));
        } else {
          newDate = new Date(Date.UTC(year, month - 1, day + spinAmount));
        }

        if (newDate < minDate) {
          newDate.setTime(minDate.getTime());
        } else if (newDate > maxDate) {
          newDate.setTime(maxDate.getTime());
        }

        newValues['year'] = splitStringIntoGraphemes(newDate.getFullYear().toString());
        newValues['month'] = splitStringIntoGraphemes((newDate.getMonth() + 1).toString());
        newValues['day'] = splitStringIntoGraphemes(newDate.getDate().toString());
      }
    }

    return newValues;
  };
};

const dateSpinDownFn = (minDateISOString: string, maxDateISOString: string) => {
  const minDate = new Date(`${minDateISOString}T00:00:00.000Z`);
  const maxDate = new Date(`${maxDateISOString}T00:00:00.000Z`);
  const maxDateYearStr = maxDate.getUTCFullYear().toString();
  const maxDateMonthStr = (maxDate.getUTCMonth() + 1).toString();
  const maxDateDayStr = maxDate.getUTCDate().toString();

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
    const todaysDateDayStr = todaysDate.getUTCDate().toString();

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
      } else if (sectionSlug === 'day') {
        const currentMonth = parseInt(newValues['month'].join('') || '1', 10);
        const currentYear = parseInt(newValues['year'].join('') || '2000', 10);
        const maxDays = new Date(currentYear, currentMonth, 0).getDate();

        newValue = currentValue - spinAmount;

        if (newValue < 1) {
          newValue = maxDays + ((newValue - 1) % maxDays) + 1;
        } else if (newValue > maxDays) {
          newValue = ((newValue - 1) % maxDays) + 1;
        }

        newValues[sectionSlug] = splitStringIntoGraphemes(newValue.toString());
      }
    } else {
      const allSectionsEmpty = Object.values(newValues).every((section) => section.length === 0);
      if (allSectionsEmpty) {
        newValues['year'] = splitStringIntoGraphemes(todaysDateYearStr);
        newValues['month'] = splitStringIntoGraphemes(todaysDateMonthStr);
        newValues['day'] = splitStringIntoGraphemes(todaysDateDayStr);
      } else {
        const yearStr = newValues['year'].length > 0 ? newValues['year'].join('') : minDate ? maxDateYearStr : '2000';
        const monthStr = newValues['month'].length > 0 ? newValues['month'].join('') : minDate && maxDateYearStr === yearStr ? maxDateMonthStr : '1';
        const dayStr =
          newValues['day'].length > 0
            ? newValues['day'].join('')
            : minDate && maxDateYearStr === yearStr && maxDateMonthStr === monthStr
              ? maxDateDayStr
              : '31';

        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const day = parseInt(dayStr, 10);

        let newDate: Date;
        const currentDate = new Date(Date.UTC(year, month - 1, day));
        const spinAmount = shiftPressed ? 10 : 1;

        if (sectionSlug === 'year') {
          newDate = new Date(Date.UTC(year - spinAmount, month, 0));
          newDate.setUTCDate(Math.min(newDate.getUTCDate(), currentDate.getUTCDate()));
        } else if (sectionSlug === 'month') {
          newDate = new Date(Date.UTC(year, month - spinAmount, 0));
          newDate.setUTCDate(Math.min(newDate.getUTCDate(), currentDate.getUTCDate()));
        } else {
          newDate = new Date(Date.UTC(year, month - 1, day - spinAmount));
        }

        if (newDate < minDate) {
          newDate.setTime(minDate.getTime());
        } else if (newDate > maxDate) {
          newDate.setTime(maxDate.getTime());
        }

        newValues['year'] = splitStringIntoGraphemes(newDate.getFullYear().toString());
        newValues['month'] = splitStringIntoGraphemes((newDate.getMonth() + 1).toString());
        newValues['day'] = splitStringIntoGraphemes(newDate.getDate().toString());
      }
    }

    return newValues;
  };
};

const valueNormalizationFn = (values: Record<string, string[]>): Record<string, string[]> => {
  const normalizedValues = { ...values };

  if (values.year && values.year.length <= 2) {
    const yearValue = parseInt(values.year.join(''));
    const century = yearValue < 90 ? 2000 : 1900;

    normalizedValues.year = (century + yearValue).toString().split('');
  }

  return normalizedValues;
};

export const DateMask = (style: 'iso' | 'de' | 'en' | 'us' | 'jp' | 'kr', minDate?: Date, maxDate?: Date): MaskDefinition => {
  const minDateISOString = minDate?.toISOString() ?? '1900-01-01';
  const maxDateISOString = maxDate?.toISOString() ?? '2100-12-31';

  const sectionYear = MaskSectionInput('year', {
    maskingFn: dateYearMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,4}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 4,
    spinUpFn: dateSpinUpFn(minDateISOString, maxDateISOString),
    spinDownFn: dateSpinDownFn(minDateISOString, maxDateISOString),
  });

  const sectionMonth = MaskSectionInput('month', {
    maskingFn: dateMonthMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,2}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 2,
    spinUpFn: dateSpinUpFn(minDateISOString, maxDateISOString),
    spinDownFn: dateSpinDownFn(minDateISOString, maxDateISOString),
  });

  const sectionDay = MaskSectionInput('day', {
    maskingFn: dateDayMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,2}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 2,
    spinUpFn: dateSpinUpFn(minDateISOString, maxDateISOString),
    spinDownFn: dateSpinDownFn(minDateISOString, maxDateISOString),
  });

  const skipKeys = ['/', '.', '-', ' '];
  const semanticValidationFn = dateSemanticValidationFn(minDateISOString, maxDateISOString);
  let sections: MaskSectionDefinition[];

  if (style === 'en') {
    sections = [sectionDay, MaskSectionFixed('/', skipKeys), sectionMonth, MaskSectionFixed('/', skipKeys), sectionYear];
  } else if (style === 'us') {
    sections = [sectionMonth, MaskSectionFixed('/', skipKeys), sectionDay, MaskSectionFixed('/', skipKeys), sectionYear];
  } else if (style === 'de') {
    sections = [sectionDay, MaskSectionFixed('.', skipKeys), sectionMonth, MaskSectionFixed('.', skipKeys), sectionYear];
  } else if (style === 'jp') {
    sections = [sectionYear, MaskSectionFixed('年', skipKeys), sectionMonth, MaskSectionFixed('月', skipKeys), sectionDay, MaskSectionFixed('日')];
  } else if (style === 'kr') {
    sections = [sectionYear, MaskSectionFixed('년', skipKeys), sectionMonth, MaskSectionFixed('월', skipKeys), sectionDay, MaskSectionFixed('일')];
  } else {
    sections = [sectionYear, MaskSectionFixed('-', skipKeys), sectionMonth, MaskSectionFixed('-', skipKeys), sectionDay];
  }

  return {
    encodeValidatedValue: dateEncodeValidatedValue,
    semanticValidationFn,
    valueNormalizationFn,
    sections,
  };
};
