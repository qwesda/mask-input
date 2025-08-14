import {
  type MaskDefinition,
  type MaskCharacter,
  MaskSectionFixed,
  MaskSectionInput,
  validationFnFromRegexString,
} from './base/index.ts';

const intersperse = (arr: T[], sep: T): T[] => arr.flatMap(e => [sep, e]).slice(1)

const componentMaskFn = (sectionValue: string): MaskCharacter[] => {
  return [...sectionValue].map(c => { return {char: c, type: 'value' as const} });
};

export const IPv4Mask = (): MaskDefinition => {
  const componentValidationFn = validationFnFromRegexString(`^([0-9]|[1-9][0-9]{0,2)$`);

  // use 3 and it will fail with
  // TypeError: can't access property Symbol.iterator, sectionValue is undefined
  const inputSections = Array(2).fill(
    MaskSectionInput('insert', 'right', componentMaskFn, componentValidationFn, 3)
  );

  // using this below (with intersperse) fails with
  // TypeError: sectionDefinition.maskingFn is not a function
  const separator = {char: '.', type: 'mask' as const};

  return {
    sections: intersperse(inputSections, separator),
    // sections: inputSections,
  };
};
