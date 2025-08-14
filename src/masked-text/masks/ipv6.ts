import { type MaskDefinition, type MaskCharacter, MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from './base/index.ts';

const componentMaskFn = (sectionValue: string): MaskCharacter[] => {
  if (sectionValue === '') {
    return [{ char: '0', type: 'mask' as const }];
  }

  return [...sectionValue].map((c) => {
    return { char: c, type: 'value' as const };
  });
};

export const IPv6Mask = (): MaskDefinition => {
  const inputBlock = MaskSectionInput('insert', 'right', componentMaskFn, validationFnFromRegexString(`^([0-9a-f]{0,6})$`), 4);
  const separator = MaskSectionFixed(':');

  return {
    sections: [
      inputBlock,
      separator,
      inputBlock,
      separator,
      inputBlock,
      separator,
      inputBlock,
      separator,
      inputBlock,
      separator,
      inputBlock,
      separator,
      inputBlock,
      separator,
      inputBlock,
    ],
  };
};
