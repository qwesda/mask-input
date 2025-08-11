export interface MaskSectionDefinitionFixed {
  type: 'fixed';
  mask: string;
  skipKeys?: string[];
}

export const MaskSectionFixed = (mask: string, skipKeys?: string[]): MaskSectionDefinitionFixed => ({
  type: 'fixed',
  mask,
  skipKeys,
});

export interface MaskSectionDefinitionInput {
  type: 'input';
  inputBehavior: 'replace' | 'insert';
  alignment: 'left' | 'right';
  maskingFn: (sectionValue: string) => MaskCharacter[];
  validationFn: (sectionValue: string) => boolean;
  maxLength: number;
}

export const MaskSectionInput = (
  inputBehavior: 'replace' | 'insert',
  alignment: 'left' | 'right',
  maskingFn: (sectionValue: string) => MaskCharacter[],
  validationFn: (sectionValue: string) => boolean,
  maxLength: number,
): MaskSectionDefinitionInput => ({
  type: 'input',
  inputBehavior,
  alignment,
  maskingFn,
  validationFn,
  maxLength,
});

export interface MaskSectionInput extends MaskSectionDefinitionInput {
  valueIndex: number;
}

export type MaskCharacter = {
  char: string;
  type: 'mask' | 'value';
};

export type MaskCharacterWithBounds = MaskCharacter & {
  valueBounds: [number, number];
  displayBounds: [number, number];
};

export type MaskSectionFixedWithCalculatedProperties = MaskSectionDefinitionFixed & {
  type: 'fixed';
  index: number;
  bounds: [number, number];

  displayValue: string;
  displayHTML: string;

  validCursorDisplayPositions: number[];
};

export type MaskSectionInputWithCalculatedProperties = MaskSectionInput & {
  type: 'input';
  index: number;
  bounds: [number, number];

  displayValue: string;
  displayHTML: string;

  validCursorDisplayPositions: number[];
  maxValidCursorPosition: number;
  minValidCursorPosition: number;
  valueRelPositionToDisplayBounds: Map<number, [number, number]>;
};

export type MaskSectionFixedState = {
  type: 'fixed';
  index: number;
  bounds: [number, number];

  displayValue: string;
  displayHTML: string;

  validCursorDisplayPositions: number[];
};

export type MaskSectionInputState = {
  type: 'input';
  index: number;
  bounds: [number, number];

  displayValue: string;
  displayHTML: string;

  validCursorDisplayPositions: number[];
  maxValidCursorPosition: number;
  minValidCursorPosition: number;
  valueRelPositionToDisplayBounds: Map<number, [number, number]>;
};

export type MaskDefinitionSection = MaskSectionDefinitionFixed | MaskSectionDefinitionInput;

export type MaskDefinition = {
  sections: MaskDefinitionSection[];
};

export const validationFnFromRegexString = (regexString: string): ((sectionValue: string) => boolean) => {
  const regex = new RegExp(regexString);

  return (sectionValue: string) => regex.test(sectionValue);
};
