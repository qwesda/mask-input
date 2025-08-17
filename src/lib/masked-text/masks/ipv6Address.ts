import { type MaskCharacter, type MaskDefinition, MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from '../base/index';
import { splitStringIntoGraphemes } from '../base/helper';

const ipv6AddressEncodeValidatedValue = (values: Record<string, string>): string | undefined => {
  const blocks = [
    values['block1'] || '0',
    values['block2'] || '0',
    values['block3'] || '0',
    values['block4'] || '0',
    values['block5'] || '0',
    values['block6'] || '0',
    values['block7'] || '0',
    values['block8'] || '0',
  ];

  let longestZeroStart = -1;
  let longestZeroLength = 0;
  let currentZeroStart = -1;
  let currentZeroLength = 0;

  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i] === '0') {
      if (currentZeroStart === -1) {
        currentZeroStart = i;
        currentZeroLength = 1;
      } else {
        currentZeroLength++;
      }
    } else {
      if (currentZeroLength > longestZeroLength) {
        longestZeroStart = currentZeroStart;
        longestZeroLength = currentZeroLength;
      }
      currentZeroStart = -1;
      currentZeroLength = 0;
    }
  }

  if (currentZeroLength > longestZeroLength) {
    longestZeroStart = currentZeroStart;
    longestZeroLength = currentZeroLength;
  }

  if (longestZeroLength >= 2) {
    const beforeCompression = blocks.slice(0, longestZeroStart);
    const afterCompression = blocks.slice(longestZeroStart + longestZeroLength);

    if (beforeCompression.length === 0 && afterCompression.length === 0) {
      return '::';
    } else if (beforeCompression.length === 0) {
      return '::' + afterCompression.join(':');
    } else if (afterCompression.length === 0) {
      return beforeCompression.join(':') + '::';
    } else {
      return beforeCompression.join(':') + '::' + afterCompression.join(':');
    }
  }

  return blocks.join(':');
};

const ipv6AddressBlockMaskFn = (sectionValue: string): MaskCharacter[] => {
  if (sectionValue === '') {
    return [{ char: '0', type: 'mask' as const }];
  }

  return splitStringIntoGraphemes(sectionValue).map((c) => {
    return { char: c, type: 'value' as const };
  });
};

const ipv6AddressBlockSemanticValidationFn = (values: Record<string, string>, sectionSlug: string): boolean => {
  const value = values[sectionSlug];

  if (!value) {
    return true;
  }

  const hexRegex = /^[0-9a-fA-F]+$/;

  return hexRegex.test(value) && value.length <= 4;
};

const ipv6AddressBlockSpinUpFn = (values: Record<string, string>, sectionSlug: string): string => {
  const sectionValue = values[sectionSlug];
  const hexValue = sectionValue || '0';
  const parsedIntValue = parseInt(hexValue, 16);

  if (!isNaN(parsedIntValue)) {
    if (parsedIntValue >= 0 && parsedIntValue <= 0xfffe) {
      return (parsedIntValue + 1).toString(16);
    }
  }

  return '0';
};

const ipv6AddressBlockSpinDownFn = (values: Record<string, string>, sectionSlug: string): string => {
  const sectionValue = values[sectionSlug];
  const hexValue = sectionValue || '0';
  const parsedIntValue = parseInt(hexValue, 16);

  if (!isNaN(parsedIntValue)) {
    if (parsedIntValue >= 1 && parsedIntValue <= 0xffff) {
      return (parsedIntValue - 1).toString(16);
    }
  }

  return 'ffff';
};

export const IPv6AddressMask = (): MaskDefinition => {
  const ipv6BlockOptions = {
    maskingFn: ipv6AddressBlockMaskFn,
    maxLength: 4,
    alignment: 'right' as const,

    syntacticValidationFn: validationFnFromRegexString(`^([0-9a-fA-F]{0,4})$`),
    semanticValidationFn: ipv6AddressBlockSemanticValidationFn,

    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9a-fA-F]$`),

    spinUpFn: ipv6AddressBlockSpinUpFn,
    spinDownFn: ipv6AddressBlockSpinDownFn,
  };

  const separatorSection = MaskSectionFixed(':');

  return {
    encodeValidatedValue: ipv6AddressEncodeValidatedValue,
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
