import type { MaskCharacter, MaskDefinition, MaskSectionDefinition } from '../base/types';
import { MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from '../base/index';

const dateEncodeValidatedValue = (values: Record<string, string[]>): string | undefined => {
  const year = (values['year'] || []).join('');
  const month = (values['month'] || []).join('');
  const day = (values['day'] || []).join('');

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
    const yearStr = (values['year'] || []).join('');
    const monthStr = (values['month'] || []).join('');
    const dayStr = (values['day'] || []).join('');

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

export const DateMask = (style: 'iso' | 'de' | 'en' | 'us' | 'jp' | 'kr', minDate?: Date, maxDate?: Date): MaskDefinition => {
  const sectionYear = MaskSectionInput('year', {
    maskingFn: dateYearMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,4}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 4,
  });

  const sectionMonth = MaskSectionInput('month', {
    maskingFn: dateMonthMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,2}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 2,
  });

  const sectionDay = MaskSectionInput('day', {
    maskingFn: dateDayMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,2}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 2,
  });

  const semanticValidationFn = dateSemanticValidationFn(minDate?.toISOString() ?? '1900-01-01', maxDate?.toISOString() ?? '2100-12-31');
  let sections: MaskSectionDefinition[];

  if (style === 'en') {
    sections = [sectionDay, MaskSectionFixed('/'), sectionMonth, MaskSectionFixed('/'), sectionYear];
  } else if (style === 'us') {
    sections = [sectionMonth, MaskSectionFixed('/'), sectionDay, MaskSectionFixed('/'), sectionYear];
  } else if (style === 'de') {
    sections = [sectionDay, MaskSectionFixed('.'), sectionMonth, MaskSectionFixed('.'), sectionYear];
  } else if (style === 'jp') {
    sections = [sectionYear, MaskSectionFixed('年'), sectionMonth, MaskSectionFixed('月'), sectionDay, MaskSectionFixed('日')];
  } else if (style === 'kr') {
    sections = [sectionYear, MaskSectionFixed('년'), sectionMonth, MaskSectionFixed('월'), sectionDay, MaskSectionFixed('일')];
  } else {
    sections = [sectionYear, MaskSectionFixed('-'), sectionMonth, MaskSectionFixed('-'), sectionDay];
  }

  return {
    encodeValidatedValue: dateEncodeValidatedValue,
    semanticValidationFn,
    sections,
  };
};
