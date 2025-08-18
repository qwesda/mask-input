import type { MaskCharacter, MaskDefinition } from '../base/types';
import { MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from '../base/index';
import { splitStringIntoGraphemes } from '../base/helper';

const ipv4AddressEncodeValidatedValue = (values: Record<string, string[]>): string | undefined => {
  const block1 = Number.parseInt((values['block1'] || []).join(''));
  const block2 = Number.parseInt((values['block2'] || []).join(''));
  const block3 = Number.parseInt((values['block3'] || []).join(''));
  const block4 = Number.parseInt((values['block4'] || []).join(''));

  if (Number.isNaN(block1) || Number.isNaN(block2) || Number.isNaN(block3) || Number.isNaN(block4)) {
    return undefined;
  }

  if (block1 < 0 || block1 > 255 || block2 < 0 || block2 > 255 || block3 < 0 || block3 > 255 || block4 < 0 || block4 > 255) {
    return undefined;
  }

  return `${block1}.${block2}.${block3}.${block4}`;
};

const ipv4AddressBlockMaskFn = (sectionValue: string[]): MaskCharacter[] => {
  if (sectionValue.length === 0) {
    return [{ char: '0', type: 'mask' as const }];
  }

  return sectionValue.map((c) => {
    return { char: c, type: 'value' as const };
  });
};

const ipv4AddressBlockSpinUpFn = (values: Record<string, string[]>, sectionSlug: string): string[] => {
  const sectionValue = (values[sectionSlug] || []).join('');
  const parsedIntValue = Number.parseInt(sectionValue);

  if (!Number.isNaN(parsedIntValue)) {
    if (parsedIntValue >= 0 && parsedIntValue <= 254) {
      return splitStringIntoGraphemes((parsedIntValue + 1).toString());
    }
  }

  return ['0'];
};

const ipv4AddressBlockSpinDownFn = (values: Record<string, string[]>, sectionSlug: string): string[] => {
  const sectionValue = (values[sectionSlug] || []).join('');
  const parsedIntValue = Number.parseInt(sectionValue);

  if (!Number.isNaN(parsedIntValue)) {
    if (parsedIntValue >= 1 && parsedIntValue <= 255) {
      return splitStringIntoGraphemes((parsedIntValue - 1).toString());
    }
  }

  return ['2', '5', '5'];
};

export const IPv4AddressMask = (): MaskDefinition => {
  const ipv4AddressBlockOptions = {
    maskingFn: ipv4AddressBlockMaskFn,
    maxLength: 3,
    alignment: 'right' as const,

    syntacticValidationFn: validationFnFromRegexString(`^([0-9]{0,3})$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),

    spinUpFn: ipv4AddressBlockSpinUpFn,
    spinDownFn: ipv4AddressBlockSpinDownFn,
  };

  const separatorSection = MaskSectionFixed('.');

  return {
    encodeValidatedValue: ipv4AddressEncodeValidatedValue,
    sections: [
      MaskSectionInput('block1', ipv4AddressBlockOptions),
      separatorSection,
      MaskSectionInput('block2', ipv4AddressBlockOptions),
      separatorSection,
      MaskSectionInput('block3', ipv4AddressBlockOptions),
      separatorSection,
      MaskSectionInput('block4', ipv4AddressBlockOptions),
    ],
  };
};
