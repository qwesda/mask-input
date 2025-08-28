import type { MaskCharacter, MaskDefinition } from '../base/types';
import { MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from '../base/index';
import { splitStringIntoGraphemes } from '../base/helper';

const ipv4AddressEncodeValidatedValue = (values: Record<string, string[]>): string | undefined => {
  const block1 = Number.parseInt((values['block1'] ?? []).join(''));
  const block2 = Number.parseInt((values['block2'] ?? []).join(''));
  const block3 = Number.parseInt((values['block3'] ?? []).join(''));
  const block4 = Number.parseInt((values['block4'] ?? []).join(''));

  if (Number.isNaN(block1) || Number.isNaN(block2) || Number.isNaN(block3) || Number.isNaN(block4)) {
    return undefined;
  }

  if (block1 < 0 || block1 > 255 || block2 < 0 || block2 > 255 || block3 < 0 || block3 > 255 || block4 < 0 || block4 > 255) {
    return undefined;
  }

  return `${block1}.${block2}.${block3}.${block4}`;
};

const ipv4AddressBlockMaskFn = (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
  const sectionValue = values[sectionSlug] ?? [];

  if (sectionValue.length === 0) {
    return [{ char: '0', type: 'mask' as const }];
  }

  return sectionValue.map((c) => {
    return { char: c, type: 'value' as const };
  });
};

const ipv4AddressBlockSpinFn = (
  direction: 'up' | 'down',
  values: Record<string, string[]>,
  sectionSlug: string,
  metaPressed: boolean,
  shiftPressed: boolean,
  altPressed: boolean,
): Record<string, string[]> => {
  const spinDirection = direction === 'up' ? 1 : -1;
  let spinAmount = (shiftPressed ? 10 : 1) * spinDirection;
  const minValue = 0;
  const maxValue = 255;
  const newValues = {} as Record<string, string[]>;

  for (const [key, value] of Object.entries(values)) {
    newValues[key] = value.length ? value : !altPressed ? splitStringIntoGraphemes(minValue.toString()) : [];
  }

  if (altPressed) {
    const sectionValue = Number.parseInt((newValues[sectionSlug] ?? []).join(''));

    if (Number.isNaN(sectionValue)) {
      newValues[sectionSlug] = ['0'];
    } else if (sectionValue + spinAmount >= minValue && sectionValue + spinAmount <= maxValue) {
      newValues[sectionSlug] = splitStringIntoGraphemes((sectionValue + spinAmount).toString());
    } else if (sectionValue + spinAmount > maxValue) {
      newValues[sectionSlug] = splitStringIntoGraphemes((sectionValue + spinAmount - (maxValue + 1)).toString());
    } else {
      newValues[sectionSlug] = splitStringIntoGraphemes(minValue.toString());
    }
  } else {
    const allBlockSlugs = Object.keys(newValues).sort().reverse();
    const blockSlugsToHandle = allBlockSlugs.slice(allBlockSlugs.indexOf(sectionSlug));
    let everyBlockOverflowed = true;

    for (const blockSlug of blockSlugsToHandle) {
      const sectionValue = Number.parseInt((newValues[blockSlug] ?? []).join(''));

      if (Number.isNaN(sectionValue)) {
        newValues[sectionSlug] = ['0'];
      } else if (sectionValue + spinAmount >= minValue && sectionValue + spinAmount <= maxValue) {
        newValues[blockSlug] = splitStringIntoGraphemes((sectionValue + spinAmount).toString());
        everyBlockOverflowed = false;
        break;
      } else if (sectionValue + spinAmount > maxValue) {
        newValues[blockSlug] = splitStringIntoGraphemes((sectionValue + spinAmount - (maxValue + 1)).toString());
        spinAmount = 1;
      } else {
        newValues[blockSlug] = splitStringIntoGraphemes(minValue.toString());
        everyBlockOverflowed = false;
      }
    }

    if (everyBlockOverflowed) {
      for (const blockSlug of blockSlugsToHandle) {
        newValues[blockSlug] = splitStringIntoGraphemes(maxValue.toString());
      }
    }

    if (allBlockSlugs.length === 0) {
      newValues['block1'] = ['0'];
      newValues['block2'] = ['0'];
      newValues['block3'] = ['0'];
      newValues['block4'] = ['0'];
    }
  }

  return newValues;
};

export const IPv4AddressMask = (): MaskDefinition => {
  const ipv4AddressBlockOptions = {
    maskingFn: ipv4AddressBlockMaskFn,
    maxLength: 3,
    alignment: 'right' as const,

    syntacticValidationFn: validationFnFromRegexString(`^([0-9]{0,3})$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),

    spinFn: ipv4AddressBlockSpinFn,
  };

  const separatorSection = MaskSectionFixed('.', ['.', ' ']);

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
