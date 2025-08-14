import { type MaskDefinition, type MaskCharacter, MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from './base/index.ts';

const ipv6BlockMaskFn = (sectionValue: string): MaskCharacter[] => {
  if (sectionValue === '') {
    return [{ char: '0', type: 'mask' as const }];
  }

  return [...sectionValue].map((c) => {
    return { char: c, type: 'value' as const };
  });
};

export const IPv6Mask = (): MaskDefinition => {
  const inputBlockSection = MaskSectionInput(ipv6BlockMaskFn, {
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^([0-9a-f]{0,6})$`),
    maxLength: 4,
  });

  const separatorSection = MaskSectionFixed(':');

  return {
    sections: [
      inputBlockSection,
      separatorSection,
      inputBlockSection,
      separatorSection,
      inputBlockSection,
      separatorSection,
      inputBlockSection,
      separatorSection,
      inputBlockSection,
      separatorSection,
      inputBlockSection,
      separatorSection,
      inputBlockSection,
      separatorSection,
      inputBlockSection,
    ],
  };
};
