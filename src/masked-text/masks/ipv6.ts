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

const ipv6BlockSemanticValidationFn = (values: string[], sectionIndex: number): boolean => {
  const value = values[sectionIndex];

  if (!value) {
    return true;
  }

  const hexRegex = /^[0-9a-fA-F]+$/;

  return hexRegex.test(value) && value.length <= 4;
};

const ipv6BlockSpinUpFn = (sectionValue: string): string => {
  const hexValue = sectionValue || '0';
  const parsedIntValue = parseInt(hexValue, 16);

  if (!isNaN(parsedIntValue)) {
    if (parsedIntValue >= 0 && parsedIntValue <= 0xfffe) {
      return (parsedIntValue + 1).toString(16);
    }
  }

  return '0';
};

const ipv6BlockSpinDownFn = (sectionValue: string): string => {
  const hexValue = sectionValue || '0';
  const parsedIntValue = parseInt(hexValue, 16);

  if (!isNaN(parsedIntValue)) {
    if (parsedIntValue >= 1 && parsedIntValue <= 0xffff) {
      return (parsedIntValue - 1).toString(16);
    }
  }

  return 'ffff';
};

export const IPv6Mask = (): MaskDefinition => {
  const ipv6BlockOptions = {
    maskingFn: ipv6BlockMaskFn,
    maxLength: 4,
    alignment: 'right' as const,

    syntacticValidationFn: validationFnFromRegexString(`^([0-9a-fA-F]{0,4})$`),
    semanticValidationFn: ipv6BlockSemanticValidationFn,

    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9a-fA-F]$`),

    spinUpFn: ipv6BlockSpinUpFn,
    spinDownFn: ipv6BlockSpinDownFn,
  };

  const separatorSection = MaskSectionFixed(':');

  return {
    sections: [
      MaskSectionInput('block1', ipv6BlockOptions),
      separatorSection,
      MaskSectionInput('block2', ipv6BlockOptions),
      separatorSection,
      MaskSectionInput('block3', ipv6BlockOptions),
      separatorSection,
      MaskSectionInput('block4', ipv6BlockOptions),
      separatorSection,
      MaskSectionInput('block5', ipv6BlockOptions),
      separatorSection,
      MaskSectionInput('block6', ipv6BlockOptions),
      separatorSection,
      MaskSectionInput('block7', ipv6BlockOptions),
      separatorSection,
      MaskSectionInput('block8', ipv6BlockOptions),
    ],
  };
};
