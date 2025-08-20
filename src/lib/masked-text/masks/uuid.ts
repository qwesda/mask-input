import type { MaskCharacter, MaskDefinition } from '../base/types';
import { MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from '../base/index';
import { splitStringIntoGraphemes } from '../base/helper';

type UuidVersion = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8' | undefined;

const uuidEncodeValidatedValue = (values: Record<string, string[]>, version: UuidVersion): string | undefined => {
  const part1 = (values['part1'] ?? []).join('');
  const part2 = (values['part2'] ?? []).join('');
  const part3 = (values['part3'] ?? []).join('');
  const part4 = (values['part4'] ?? []).join('');
  const part5 = (values['part5'] ?? []).join('');

  if (part1.length !== 8 || part2.length !== 4 || part3.length !== 4 || part4.length !== 4 || part5.length !== 12) {
    return undefined;
  }

  return `${part1}-${part2}-${part3}-${part4}-${part5}`.toLowerCase();
};

const uuidHexMaskFn = (sectionValue: string[]): MaskCharacter[] => {
  if (sectionValue.length === 0) {
    return [{ char: '0', type: 'mask' as const }];
  }

  return sectionValue.map((c) => {
    return { char: c.toLowerCase(), type: 'value' as const };
  });
};

const uuidInputCharacterSubstitutionFn = (character: string): string => {
  if (/^[A-F]$/.test(character)) {
    return character.toLowerCase();
  } else {
    return character;
  }
};

const uuidSemanticValidationFn = (version: UuidVersion) => {
  const versionNumber = version ? version.substring(1) : undefined;

  return (values: Record<string, string[]>): [boolean, string] => {
    const part1 = (values['part1'] ?? []).join('').toLowerCase();
    const part2 = (values['part2'] ?? []).join('').toLowerCase();
    const part3 = (values['part3'] ?? []).join('').toLowerCase();
    const part4 = (values['part4'] ?? []).join('').toLowerCase();
    const part5 = (values['part5'] ?? []).join('').toLowerCase();

    const allParts = [part1, part2, part3, part4, part5].join('') as string;

    if (
      !/^[0-9a-f]{8}$/.test(part1) ||
      !/^[0-9a-f]{4}$/.test(part2) ||
      !/^[0-9a-f]{4}$/.test(part3) ||
      !/^[0-9a-f]{4}$/.test(part4) ||
      !/^[0-9a-f]{12}$/.test(part5)
    ) {
      return [false, 'Invalid UUID'];
    } else if (allParts === '00000000000000000000000000000000' || allParts === 'ffffffffffffffffffffffffffffffff') {
      return [true, ''];
    } else if (versionNumber && part3[0] !== versionNumber) {
      return [false, `Invalid UUID: expected version number must be ${versionNumber}`];
    } else if (versionNumber && !['8', '9', 'a', 'A', 'b', 'B'].includes(part4[0])) {
      return [false, 'Invalid UUID: expected variant number must be 8, 9, a, or b'];
    } else {
      return [true, ''];
    }
  };
};

export const UuidMask = (version: UuidVersion): MaskDefinition => {
  const part1Options = {
    maskingFn: uuidHexMaskFn,
    maxLength: 8,
    alignment: 'left' as const,
    inputBehavior: 'replace' as const,
    syntacticValidationFn: validationFnFromRegexString(`^([0-9a-fA-F]{0,8})$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9a-fA-F]$`),
    inputCharacterSubstitutionFn: uuidInputCharacterSubstitutionFn,
  };

  const part2Options = {
    maskingFn: uuidHexMaskFn,
    maxLength: 4,
    alignment: 'left' as const,
    inputBehavior: 'replace' as const,
    syntacticValidationFn: validationFnFromRegexString(`^([0-9a-fA-F]{0,4})$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9a-fA-F]$`),
    inputCharacterSubstitutionFn: uuidInputCharacterSubstitutionFn,
  };

  const part3Options = {
    maskingFn: uuidHexMaskFn,
    maxLength: 4,
    alignment: 'left' as const,
    inputBehavior: 'replace' as const,
    syntacticValidationFn: validationFnFromRegexString(`^([0-9a-fA-F]{0,4})$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9a-fA-F]$`),
    inputCharacterSubstitutionFn: uuidInputCharacterSubstitutionFn,
  };

  const part4Options = {
    maskingFn: uuidHexMaskFn,
    maxLength: 4,
    alignment: 'left' as const,
    inputBehavior: 'replace' as const,
    syntacticValidationFn: validationFnFromRegexString(`^([0-9a-fA-F]{0,4})$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9a-fA-F]$`),
    inputCharacterSubstitutionFn: uuidInputCharacterSubstitutionFn,
  };

  const part5Options = {
    maskingFn: uuidHexMaskFn,
    maxLength: 12,
    alignment: 'left' as const,
    inputBehavior: 'replace' as const,
    syntacticValidationFn: validationFnFromRegexString(`^([0-9a-fA-F]{0,12})$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9a-fA-F]$`),
    inputCharacterSubstitutionFn: uuidInputCharacterSubstitutionFn,
  };

  const separatorSection = MaskSectionFixed('-', ['-']);

  return {
    encodeValidatedValue: (values) => uuidEncodeValidatedValue(values, version),
    semanticValidationFn: uuidSemanticValidationFn(version),
    sections: [
      MaskSectionInput('part1', part1Options),
      separatorSection,
      MaskSectionInput('part2', part2Options),
      separatorSection,
      MaskSectionInput('part3', part3Options),
      separatorSection,
      MaskSectionInput('part4', part4Options),
      separatorSection,
      MaskSectionInput('part5', part5Options),
    ],
  };
};
