import {
  type MaskDefinition,
  type MaskCharacter,
  MaskSectionFixed,
  MaskSectionInput,
  validationFnFromRegexString,
} from './base/index.ts';

const intersperse = (arr: T[], sep: T): T[] => arr.flatMap(e => [sep, e]).slice(1)

const componentMaskFn = (sectionValue: string): MaskCharacter[] => {
  // default to "0"
  let sectionArray = [...sectionValue || "0"];
  return sectionArray.map(c => { return {char: c, type: 'value' as const} });
};

export const IPv4Mask = (): MaskDefinition => {
  const componentValidationFn = validationFnFromRegexString(`^([0-9]|[1-9][0-9]{0,2)$`);

  const inputSections = Array(4).fill(
    MaskSectionInput('insert', 'right', componentMaskFn, componentValidationFn, 3)
  );

  const separator = MaskSectionFixed('.');

  return {
    sections: intersperse(inputSections, separator),
  };
};
