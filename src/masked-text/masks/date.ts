import { type MaskDefinition, type MaskCharacter, MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from './base/index.ts';

const sectionMaskFnYear = (sectionValue: string): MaskCharacter[] => {
  if (sectionValue === '') {
    return [{ char: 'YYYY', type: 'mask' as const }];
  }

  return [...sectionValue].map((c) => {
    return { char: c, type: 'value' as const };
  });
};

const sectionMaskFnMonth = (sectionValue: string): MaskCharacter[] => {
  if (sectionValue === '') {
    return [{ char: 'MM', type: 'mask' as const }];
  }

  return [...sectionValue].map((c) => {
    return { char: c, type: 'value' as const };
  });
};

const sectionMaskFnDay = (sectionValue: string): MaskCharacter[] => {
  if (sectionValue === '') {
    return [{ char: 'DD', type: 'mask' as const }];
  }

  return [...sectionValue].map((c) => {
    return { char: c, type: 'value' as const };
  });
};

export const DateMask = (): MaskDefinition => {
  const sectionYear = MaskSectionInput(sectionMaskFnYear, {
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,4}$`),
    maxLength: 4,
  });

  const sectionMonth = MaskSectionInput(sectionMaskFnMonth, {
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,2}$`),
    maxLength: 2,
  });

  const sectionDay = MaskSectionInput(sectionMaskFnDay, {
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,2}$`),
    maxLength: 2,
  });

  const separatorSection = MaskSectionFixed('/');

  return {
    sections: [sectionYear, separatorSection, sectionMonth, separatorSection, sectionDay],
  };
};
