import { type MaskCharacter, type MaskDefinition, MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from './base/index.ts';
import { splitStringIntoGraphemes } from '@/masked-text/masks/base/helper.ts';

const ipv4BlockMaskFn = (sectionValue: string): MaskCharacter[] => {
  if (sectionValue === '') {
    return [{ char: '0', type: 'mask' as const }];
  }

  return splitStringIntoGraphemes(sectionValue).map((c) => {
    return { char: c, type: 'value' as const };
  });
};

const ipv4BlockSemanticValidationFn = (values: string[], sectionIndex: number): boolean => {
  const parsedIntValue = Number.parseInt(values[sectionIndex]);

  if (!Number.isNaN(parsedIntValue)) {
    if (parsedIntValue >= 0 && parsedIntValue <= 255) {
      return true;
    }
  }

  return false;
};

const ipv4BlockSpinUpFn = (sectionValue: string): string => {
  const parsedIntValue = Number.parseInt(sectionValue);

  if (!Number.isNaN(parsedIntValue)) {
    if (parsedIntValue >= 0 && parsedIntValue <= 254) {
      return (parsedIntValue + 1).toString();
    }
  }

  return '0';
};
const ipv4BlockSpinDownFn = (sectionValue: string): string => {
  const parsedIntValue = Number.parseInt(sectionValue);

  if (!Number.isNaN(parsedIntValue)) {
    if (parsedIntValue >= 1 && parsedIntValue <= 255) {
      return (parsedIntValue - 1).toString();
    }
  }

  return '255';
};

export const IPv4Mask = (): MaskDefinition => {
  const ipv4BlockOptions = {
    maskingFn: ipv4BlockMaskFn,
    maxLength: 3,
    alignment: 'right' as const,

    syntacticValidationFn: validationFnFromRegexString(`^([0-9]{0,3})$`),
    semanticValidationFn: ipv4BlockSemanticValidationFn,

    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),

    spinUpFn: ipv4BlockSpinUpFn,
    spinDownFn: ipv4BlockSpinDownFn,
  };

  const separatorSection = MaskSectionFixed('.');

  return {
    sections: [
      MaskSectionInput('block1', ipv4BlockOptions),
      separatorSection,
      MaskSectionInput('block2', ipv4BlockOptions),
      separatorSection,
      MaskSectionInput('block3', ipv4BlockOptions),
      separatorSection,
      MaskSectionInput('block4', ipv4BlockOptions),
    ],
  };
};
