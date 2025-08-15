import { type MaskDefinition, type MaskCharacter, MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from './base/index.ts';

const ipv4BlockMaskFn = (sectionValue: string): MaskCharacter[] => {
  if (sectionValue === '') {
    return [{ char: '0', type: 'mask' as const }];
  }

  return [...sectionValue].map((c) => {
    return { char: c, type: 'value' as const };
  });
};

export const IPv4Mask = (): MaskDefinition => {
  const inputBlockSection = MaskSectionInput(ipv4BlockMaskFn, {
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^([0-9]{0,3})$`),
    maxLength: 3,
  });

  const separatorSection = MaskSectionFixed('.');

  return {
    sections: [inputBlockSection, separatorSection, inputBlockSection, separatorSection, inputBlockSection, separatorSection, inputBlockSection],
  };
};
