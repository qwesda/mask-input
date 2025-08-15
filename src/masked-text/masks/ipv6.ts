import { type MaskCharacter, type MaskDefinition, MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from './base/index.ts';
import { splitStringIntoGraphemes } from '@/masked-text/masks/base/helper.ts';

const ipv6BlockMaskFn = (sectionValue: string): MaskCharacter[] => {
  if (sectionValue === '') {
    return [{ char: '0', type: 'mask' as const }];
  }

  return splitStringIntoGraphemes(sectionValue).map((c) => {
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
