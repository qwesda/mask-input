import type { MaskCharacter, MaskDefinition, MaskSectionDefinition } from '../base/types';
import { MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from '../base/index';
import { splitStringIntoGraphemes } from '../base/helper';

type DateStyle = 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'DD.MM.YYYY' | 'YYYY年MM月DD日' | 'YYYY년MM월DD일' | 'DD-MM-YYYY' | 'MM-DD-YYYY';
type DateFormatValueField = 'year' | 'month' | 'day';

type DateFormat = {
  valueFieldOrder: DateFormatValueField[];
  associatedDateStyles: DateStyle[];
};

type DateFormatGroup = {
  syntaxRegexp: RegExp;
  dateFormats: DateFormat[];
};

const isValidDate = (yearStr: string, monthStr: string, dayStr: string): boolean => {
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return false;
  } else if (year < 1000 || year > 9999) {
    return false;
  } else if (month < 1 || month > 12) {
    return false;
  } else if (day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const dateFormatGroupDefinitions: DateFormatGroup[] = [
  {
    syntaxRegexp: /^\s*(\d{4})-(\d{1,2})-(\d{1,2})\s*$/,
    dateFormats: [
      {
        valueFieldOrder: ['year', 'month', 'day'],
        associatedDateStyles: ['YYYY-MM-DD'],
      },
    ],
  },
  {
    syntaxRegexp: /^\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*$/,
    dateFormats: [
      {
        valueFieldOrder: ['month', 'day', 'year'],
        associatedDateStyles: ['MM/DD/YYYY'],
      },
      {
        valueFieldOrder: ['day', 'month', 'year'],
        associatedDateStyles: ['DD/MM/YYYY'],
      },
    ],
  },
  {
    syntaxRegexp: /^\s*(\d{1,2})\.(\d{1,2})\.(\d{2,4})\s*$/,
    dateFormats: [
      {
        valueFieldOrder: ['day', 'month', 'year'],
        associatedDateStyles: ['DD.MM.YYYY'],
      },
    ],
  },
  {
    // Japanese format:
    syntaxRegexp: /^\s*(\d{2,4})年(\d{1,2})月(\d{1,2})日\s*$/,
    dateFormats: [
      {
        valueFieldOrder: ['year', 'month', 'day'],
        associatedDateStyles: ['YYYY年MM月DD日'],
      },
    ],
  },
  {
    // Korean format:
    syntaxRegexp: /^\s*(\d{2,4})년(\d{1,2})월(\d{1,2})일\s*$/,
    dateFormats: [
      {
        valueFieldOrder: ['year', 'month', 'day'],
        associatedDateStyles: ['YYYY년MM월DD일'],
      },
    ],
  },
  {
    // Generic formats with dash separators (alternative orders)
    syntaxRegexp: /^\s*(\d{1,2})-(\d{1,2})-(\d{2,4})\s*$/,
    dateFormats: [
      {
        valueFieldOrder: ['day', 'month', 'year'],
        associatedDateStyles: ['DD-MM-YYYY'],
      },
      {
        valueFieldOrder: ['month', 'day', 'year'],
        associatedDateStyles: ['MM-DD-YYYY'],
      },
    ],
  },
];

const dateGetValuesFromStringRepresentation = (mainStyle: DateStyle): ((stringRepresentation: string) => Record<string, string[]> | undefined) => {
  return (stringRepresentation: string): Record<string, string[]> | undefined => {
    const dateFormatCandidates: { associatedDateStyles: DateStyle[]; parsedValues: { year: string; month: string; day: string } }[] = [];

    for (const dateFormatGroupDefinition of dateFormatGroupDefinitions) {
      const match = stringRepresentation.match(dateFormatGroupDefinition.syntaxRegexp);

      if (match) {
        for (const dateFormat of dateFormatGroupDefinition.dateFormats) {
          const parsedValues: { year: string; month: string; day: string } = { year: '', month: '', day: '' };

          for (const [i, field] of dateFormat.valueFieldOrder.entries()) {
            parsedValues[field] = match[i + 1];
          }

          dateFormatCandidates.push({ associatedDateStyles: dateFormat.associatedDateStyles, parsedValues });
        }
      }
    }

    let bestCandidate: { year: string; month: string; day: string } | undefined = undefined;

    if (dateFormatCandidates.length === 1) {
      bestCandidate = dateFormatCandidates[0].parsedValues;
    } else if (dateFormatCandidates.length > 1) {
      for (const dateFormatCandidate of dateFormatCandidates) {
        if (dateFormatCandidate.associatedDateStyles.includes(mainStyle)) {
          bestCandidate = dateFormatCandidate.parsedValues;
        }
      }
    }

    if (bestCandidate === undefined) {
      const filteredDateFormatCandidates = dateFormatCandidates.filter(({ parsedValues }) =>
        isValidDate(parsedValues.year, parsedValues.month, parsedValues.day),
      );

      if (filteredDateFormatCandidates.length === 1) {
        bestCandidate = filteredDateFormatCandidates[0].parsedValues;
      }
    }

    if (bestCandidate) {
      return {
        year: splitStringIntoGraphemes(bestCandidate.year),
        month: splitStringIntoGraphemes(bestCandidate.month),
        day: splitStringIntoGraphemes(bestCandidate.day),
      };
    }
  };
};

const dateEncodeValidatedValue = (values: Record<string, string[]>): string | undefined => {
  const year = (values['year'] ?? []).join('');
  const month = (values['month'] ?? []).join('');
  const day = (values['day'] ?? []).join('');

  if (!year || !month || !day) {
    return undefined;
  }

  return year + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0');
};

const dateYearMaskFn = (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
  const sectionValue = values[sectionSlug] ?? [];
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

const dateMonthMaskFn = (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
  const sectionValue = values[sectionSlug] ?? [];
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

const dateDayMaskFn = (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
  const sectionValue = values[sectionSlug] ?? [];
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

const dateSpinFn = (minDateISOString: string, maxDateISOString: string) => {
  const maxDate = new Date(`${maxDateISOString}T00:00:00.000Z`);
  const minDate = new Date(`${minDateISOString}T00:00:00.000Z`);
  const minDateYearStr = minDate.getUTCFullYear().toString();
  const minDateMonthStr = (minDate.getUTCMonth() + 1).toString();
  const minDateDayStr = minDate.getUTCDate().toString();

  return (
    direction: 'up' | 'down',
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
      const spinDirection = direction === 'up' ? 1 : -1;
      const spinAmount = (sectionSlug === 'month' ? (shiftPressed ? 6 : 1) : shiftPressed ? 10 : 1) * spinDirection;
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
        const spinDirection = direction === 'up' ? 1 : -1;
        const spinAmount = (sectionSlug === 'month' ? (shiftPressed ? 6 : 1) : shiftPressed ? 10 : 1) * spinDirection;

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

const dateValueNormalizationFn = (values: Record<string, string[]>): Record<string, string[]> => {
  const normalizedValues = { ...values };

  if (values.year && values.year.length >= 1 && values.year.length <= 2) {
    const yearValue = parseInt(values.year.join(''));

    if (!isNaN(yearValue)) {
      const century = yearValue < 90 ? 2000 : 1900;

      normalizedValues.year = (century + yearValue).toString().split('');
    }
  }

  return normalizedValues;
};

export const DateMask = (style: DateStyle, minDate?: Date, maxDate?: Date): MaskDefinition => {
  const minDateISOString = minDate?.toISOString() ?? '1900-01-01';
  const maxDateISOString = maxDate?.toISOString() ?? '2100-12-31';

  const sectionYear = MaskSectionInput('year', {
    maskingFn: dateYearMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,4}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 4,
    spinFn: dateSpinFn(minDateISOString, maxDateISOString),
  });

  const sectionMonth = MaskSectionInput('month', {
    maskingFn: dateMonthMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,2}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 2,
    spinFn: dateSpinFn(minDateISOString, maxDateISOString),
  });

  const sectionDay = MaskSectionInput('day', {
    maskingFn: dateDayMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,2}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 2,
    spinFn: dateSpinFn(minDateISOString, maxDateISOString),
  });

  const skipKeys = ['/', '.', '-', ' '];
  const semanticValidationFn = dateSemanticValidationFn(minDateISOString, maxDateISOString);
  let sections: MaskSectionDefinition[];

  if (style === 'DD/MM/YYYY') {
    sections = [sectionDay, MaskSectionFixed('/', skipKeys), sectionMonth, MaskSectionFixed('/', skipKeys), sectionYear];
  } else if (style === 'MM/DD/YYYY') {
    sections = [sectionMonth, MaskSectionFixed('/', skipKeys), sectionDay, MaskSectionFixed('/', skipKeys), sectionYear];
  } else if (style === 'DD.MM.YYYY') {
    sections = [sectionDay, MaskSectionFixed('.', skipKeys), sectionMonth, MaskSectionFixed('.', skipKeys), sectionYear];
  } else if (style === 'YYYY年MM月DD日') {
    sections = [sectionYear, MaskSectionFixed('年', skipKeys), sectionMonth, MaskSectionFixed('月', skipKeys), sectionDay, MaskSectionFixed('日')];
  } else if (style === 'YYYY년MM월DD일') {
    sections = [sectionYear, MaskSectionFixed('년', skipKeys), sectionMonth, MaskSectionFixed('월', skipKeys), sectionDay, MaskSectionFixed('일')];
  } else {
    sections = [sectionYear, MaskSectionFixed('-', skipKeys), sectionMonth, MaskSectionFixed('-', skipKeys), sectionDay];
  }

  return {
    encodeValidatedValue: dateEncodeValidatedValue,
    semanticValidationFn,
    valueNormalizationFn: dateValueNormalizationFn,
    sections,
    getValuesFromStringRepresentation: dateGetValuesFromStringRepresentation(style),
  };
};
