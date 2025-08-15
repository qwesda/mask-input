import { type MaskCharacter, type MaskDefinition, MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from './base/index.ts';

const sectionMaskFnYear = (sectionValue: string): MaskCharacter[] => {
  const ret: MaskCharacter[] = [];

  for (let i = 0; i < Math.max(4 - sectionValue.length, 0); i++) {
    ret.push({ char: 'Y', type: 'mask' as const });
  }

  for (const char of sectionValue) {
    ret.push({ char, type: 'value' as const });
  }

  return ret;
};

const sectionMaskFnMonth = (sectionValue: string): MaskCharacter[] => {
  const ret: MaskCharacter[] = [];

  for (let i = 0; i < Math.max(2 - sectionValue.length, 0); i++) {
    ret.push({ char: 'M', type: 'mask' as const });
  }

  for (const char of sectionValue) {
    ret.push({ char, type: 'value' as const });
  }

  return ret;
};

const sectionMaskFnDay = (sectionValue: string): MaskCharacter[] => {
  const ret: MaskCharacter[] = [];

  for (let i = 0; i < Math.max(2 - sectionValue.length, 0); i++) {
    ret.push({ char: 'D', type: 'mask' as const });
  }

  for (const char of sectionValue) {
    ret.push({ char, type: 'value' as const });
  }

  return ret;
};

const sectionSemanticValidationFnYear = (values: string[], sectionIndex: number): boolean => {
  const parsedIntValue = Number.parseInt(values[sectionIndex]);

  if (!Number.isNaN(parsedIntValue)) {
    if (parsedIntValue >= 1 && parsedIntValue <= 12) {
      return true;
    }
  }

  return false;
};

const sectionSemanticValidationFnMonth = (values: string[], sectionIndex: number): boolean => {
  const parsedIntValue = Number.parseInt(values[sectionIndex]);

  if (!Number.isNaN(parsedIntValue)) {
    if (parsedIntValue >= 1 && parsedIntValue <= 12) {
      return true;
    }
  }

  return false;
};

const sectionSemanticValidationFnDay = (values: string[], sectionIndex: number): boolean => {
  const parsedYearIntValue = Number.parseInt(values[0]);
  const parsedMonthIntValue = Number.parseInt(values[1]);
  const parsedDayIntValue = Number.parseInt(values[2]);

  if (!Number.isNaN(parsedDayIntValue)) {
    if (parsedDayIntValue >= 1 && parsedDayIntValue <= 31) {
      if (!Number.isNaN(parsedYearIntValue) && !Number.isNaN(parsedMonthIntValue)) {
        const daysInMonth = new Date(parsedYearIntValue, parsedMonthIntValue, 0).getDate();

        if (parsedDayIntValue > daysInMonth) {
          return false;
        }
      }

      return true;
    }
  }

  return false;
};

export const DateMask = (): MaskDefinition => {
  const sectionYear = MaskSectionInput(sectionMaskFnYear, {
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,4}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    semanticValidationFn: sectionSemanticValidationFnYear,
    maxLength: 4,
  });

  const sectionMonth = MaskSectionInput(sectionMaskFnMonth, {
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,2}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    semanticValidationFn: sectionSemanticValidationFnMonth,
    maxLength: 2,
  });

  const sectionDay = MaskSectionInput(sectionMaskFnDay, {
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,2}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    semanticValidationFn: sectionSemanticValidationFnDay,
    maxLength: 2,
  });

  const separatorSection = MaskSectionFixed('/');

  return {
    sections: [sectionYear, separatorSection, sectionMonth, separatorSection, sectionDay],
  };
};
