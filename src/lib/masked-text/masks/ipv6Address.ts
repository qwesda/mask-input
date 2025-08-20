import type { MaskCharacter, MaskDefinition } from '../base/types';
import { MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from '../base/index';
import { splitStringIntoGraphemes } from '../base/helper';

const ipv6AddressEncodeValidatedValue = (values: Record<string, string[]>): string | undefined => {
  const blocks = [
    (values['block1'] ?? []).join('') || '0',
    (values['block2'] ?? []).join('') || '0',
    (values['block3'] ?? []).join('') || '0',
    (values['block4'] ?? []).join('') || '0',
    (values['block5'] ?? []).join('') || '0',
    (values['block6'] ?? []).join('') || '0',
    (values['block7'] ?? []).join('') || '0',
    (values['block8'] ?? []).join('') || '0',
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

const ipv6AddressBlockMaskFn = (sectionValue: string[]): MaskCharacter[] => {
  if (sectionValue.length === 0) {
    return [{ char: '0', type: 'mask' as const }];
  }

  return sectionValue.map((c) => {
    return { char: c, type: 'value' as const };
  });
};

const ipv6AddressBlockSemanticValidationFn = (values: Record<string, string[]>, sectionSlug: string): boolean => {
  const value = (values[sectionSlug] ?? []).join('');

  if (!value) {
    return true;
  }

  const hexRegex = /^[0-9a-f]+$/;

  return hexRegex.test(value) && value.length <= 4;
};

const ipv6AddressBlockSpinUpFn = (
  values: Record<string, string[]>,
  sectionSlug: string,
  metaPressed: boolean,
  shiftPressed: boolean,
  altPressed: boolean,
): Record<string, string[]> => {
  let spinAmount = shiftPressed ? 16 : 1;
  const minValue = 0;
  const maxValue = 0xffff;
  const newValues = {} as Record<string, string[]>;

  for (const [key, value] of Object.entries(values)) {
    newValues[key] = value.length ? value : !altPressed ? splitStringIntoGraphemes(minValue.toString(16)) : [];
  }

  if (altPressed) {
    const sectionValue = parseInt((newValues[sectionSlug] ?? []).join('') || '0', 16);

    if (!Number.isNaN(sectionValue)) {
      if (sectionValue + spinAmount >= minValue && sectionValue + spinAmount <= maxValue) {
        newValues[sectionSlug] = splitStringIntoGraphemes((sectionValue + spinAmount).toString(16));
      } else if (sectionValue + spinAmount > maxValue) {
        newValues[sectionSlug] = splitStringIntoGraphemes((sectionValue + spinAmount - (maxValue + 1)).toString(16));
      } else {
        newValues[sectionSlug] = splitStringIntoGraphemes(minValue.toString(16));
      }
    }
  } else {
    const allBlockSlugs = Object.keys(newValues).sort().reverse();
    const blockSlugsToHandle = allBlockSlugs.slice(allBlockSlugs.indexOf(sectionSlug));
    let everyBlockOverflowed = true;

    for (const blockSlug of blockSlugsToHandle) {
      const sectionValue = parseInt((newValues[blockSlug] ?? []).join('') || '0', 16);

      if (!Number.isNaN(sectionValue)) {
        if (sectionValue + spinAmount >= minValue && sectionValue + spinAmount <= maxValue) {
          newValues[blockSlug] = splitStringIntoGraphemes((sectionValue + spinAmount).toString(16));
          everyBlockOverflowed = false;
          break;
        } else if (sectionValue + spinAmount > maxValue) {
          newValues[blockSlug] = splitStringIntoGraphemes((sectionValue + spinAmount - (maxValue + 1)).toString(16));
          spinAmount = 1;
        } else {
          newValues[blockSlug] = splitStringIntoGraphemes(minValue.toString(16));
          everyBlockOverflowed = false;
        }
      }
    }

    if (everyBlockOverflowed) {
      for (const blockSlug of blockSlugsToHandle) {
        newValues[blockSlug] = splitStringIntoGraphemes(maxValue.toString(16));
      }
    }
  }

  return newValues;
};

const ipv6AddressBlockSpinDownFn = (
  values: Record<string, string[]>,
  sectionSlug: string,
  metaPressed: boolean,
  shiftPressed: boolean,
  altPressed: boolean,
): Record<string, string[]> => {
  let spinAmount = shiftPressed ? 0x10 : 1;
  const minValue = 0;
  const maxValue = 0xffff;
  const newValues = {} as Record<string, string[]>;

  for (const [key, value] of Object.entries(values)) {
    newValues[key] = value.length ? value : !altPressed ? splitStringIntoGraphemes(maxValue.toString(16)) : [];
  }

  if (altPressed) {
    const sectionValue = parseInt((newValues[sectionSlug] ?? []).join('') || '0', 16);

    if (!Number.isNaN(sectionValue)) {
      if (sectionValue - spinAmount >= minValue && sectionValue - spinAmount < maxValue) {
        newValues[sectionSlug] = splitStringIntoGraphemes((sectionValue - spinAmount).toString(16));
      } else if (sectionValue - spinAmount < minValue) {
        newValues[sectionSlug] = splitStringIntoGraphemes((sectionValue - spinAmount + (maxValue + 1)).toString(16));
      } else {
        newValues[sectionSlug] = splitStringIntoGraphemes(maxValue.toString(16));
      }
    }
  } else {
    const allBlockSlugs = Object.keys(newValues).sort().reverse();
    const blockSlugsToHandle = allBlockSlugs.slice(allBlockSlugs.indexOf(sectionSlug));
    let everyBlockUnderflowed = true;

    for (const blockSlug of blockSlugsToHandle) {
      const sectionValue = parseInt((newValues[blockSlug] ?? []).join('') || '0', 16);

      if (!Number.isNaN(sectionValue)) {
        if (sectionValue - spinAmount >= minValue && sectionValue - spinAmount < maxValue) {
          newValues[blockSlug] = splitStringIntoGraphemes((sectionValue - spinAmount).toString(16));
          everyBlockUnderflowed = false;
          break;
        } else if (sectionValue - spinAmount < minValue) {
          newValues[blockSlug] = splitStringIntoGraphemes((sectionValue - spinAmount + (maxValue + 1)).toString(16));
          spinAmount = 1;
        } else {
          newValues[sectionSlug] = splitStringIntoGraphemes(maxValue.toString(16));
          everyBlockUnderflowed = false;
        }
      }
    }

    if (everyBlockUnderflowed) {
      for (const blockSlug of blockSlugsToHandle) {
        newValues[blockSlug] = splitStringIntoGraphemes(minValue.toString(16));
      }
    }
  }

  return newValues;
};

const ipv6InputCharacterSubstitutionFn = (character: string): string => {
  if (/^[A-F]$/.test(character)) {
    return character.toLowerCase();
  } else {
    return character;
  }
};

export const IPv6AddressMask = (): MaskDefinition => {
  const ipv6BlockOptions = {
    maskingFn: ipv6AddressBlockMaskFn,
    maxLength: 4,
    alignment: 'right' as const,

    syntacticValidationFn: validationFnFromRegexString(`^([0-9a-fA-F]{0,4})$`),
    semanticValidationFn: ipv6AddressBlockSemanticValidationFn,

    inputCharacterSubstitutionFn: ipv6InputCharacterSubstitutionFn,
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9a-fA-F]$`),

    spinUpFn: ipv6AddressBlockSpinUpFn,
    spinDownFn: ipv6AddressBlockSpinDownFn,
  };

  const separatorSection = MaskSectionFixed(':', [':', '.', ' ']);

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
