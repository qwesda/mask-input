import { type MaskDefinition, type MaskCharacter, MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from './base/index.ts';

const SectionMaskFnYear = (sectionValue: string): MaskCharacter[] => {
  if (sectionValue === '') {
    return [{ char: 'YYYY', type: 'mask' as const }];
  }

  return [...sectionValue].map((c) => {
    return { char: c, type: 'value' as const };
  });
};

const SectionMaskFnMonth = (sectionValue: string): MaskCharacter[] => {
  if (sectionValue === '') {
    return [{ char: 'MM', type: 'mask' as const }];
  }

  return [...sectionValue].map((c) => {
    return { char: c, type: 'value' as const };
  });
};

const SectionMaskFnDay = (sectionValue: string): MaskCharacter[] => {
  if (sectionValue === '') {
    return [{ char: 'DD', type: 'mask' as const }];
  }

  return [...sectionValue].map((c) => {
    return { char: c, type: 'value' as const };
  });
};

export const DateMask = (): MaskDefinition => {
  const SectionValidationFnYear = validationFnFromRegexString(`^[0-9]{0,4}$`);
  const SectionValidationFnMonth = validationFnFromRegexString(`^[0-9]{0,2}$`);
  const SectionValidationFnDay = validationFnFromRegexString(`^[0-9]{0,2}$`);

  return {
    sections: [
      MaskSectionInput('insert', 'right', SectionMaskFnYear, SectionValidationFnYear, 3),
      MaskSectionFixed('-'),
      MaskSectionInput('insert', 'right', SectionMaskFnMonth, SectionValidationFnMonth, 3),
      MaskSectionFixed('-'),
      MaskSectionInput('insert', 'right', SectionMaskFnDay, SectionValidationFnDay, 3),
    ],
  };
};
