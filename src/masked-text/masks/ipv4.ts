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

const ipv4BlockSemanticValidationFn = (values: Record<string, string>, sectionSlug: string): boolean => {
  const parsedIntValue = Number.parseInt(values[sectionSlug]);

  if (!Number.isNaN(parsedIntValue)) {
    if (parsedIntValue >= 0 && parsedIntValue <= 255) {
      return true;
    }
  }

  return false;
};

const ipv4BlockSpinUpFn = (values: Record<string, string>, sectionSlug: string): string => {
  const sectionValue = values[sectionSlug];
  const parsedIntValue = Number.parseInt(sectionValue);

  if (!Number.isNaN(parsedIntValue)) {
    if (parsedIntValue >= 0 && parsedIntValue <= 254) {
      return (parsedIntValue + 1).toString();
    }
  }

  return '0';
};

const ipv4BlockSpinDownFn = (values: Record<string, string>, sectionSlug: string): string => {
  const sectionValue = values[sectionSlug];
  const parsedIntValue = Number.parseInt(sectionValue);

  if (!Number.isNaN(parsedIntValue)) {
    if (parsedIntValue >= 1 && parsedIntValue <= 255) {
      return (parsedIntValue - 1).toString();
    }
  }

  return '255';
};

const ipv4EncodeValidatedValue = (values: Record<string, string>): string | undefined => {
  const block1 = Number.parseInt(values['block1']);
  const block2 = Number.parseInt(values['block2']);
  const block3 = Number.parseInt(values['block3']);
  const block4 = Number.parseInt(values['block4']);

  if (Number.isNaN(block1) || Number.isNaN(block2) || Number.isNaN(block3) || Number.isNaN(block4)) {
    return undefined;
  }

  if (block1 < 0 || block1 > 255 || block2 < 0 || block2 > 255 || block3 < 0 || block3 > 255 || block4 < 0 || block4 > 255) {
    return undefined;
  }

  return `${block1}.${block2}.${block3}.${block4}`;
};

export const IPv4Mask = (): MaskDefinition => {
  const ipv4BlockOptions = {
    maskingFn: ipv4BlockMaskFn,
    maxLength: 3,
    alignment: 'right' as const,

    syntacticValidationFn: validationFnFromRegexString(`^([0-9]{0,3})$`),

    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),

    spinUpFn: ipv4BlockSpinUpFn,
    spinDownFn: ipv4BlockSpinDownFn,
  };

  const separatorSection = MaskSectionFixed('.');

  return {
    encodeValidatedValue: ipv4EncodeValidatedValue,
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
