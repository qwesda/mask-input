import type { Ref } from 'vue';

export interface MaskSectionFixedDefinition {
  type: 'fixed';
  mask: string;
  skipKeys?: string[];
}

export interface MaskSectionInputDefinition {
  type: 'input';
  inputBehavior: 'replace' | 'insert';
  alignment: 'left' | 'right';
  maskingFn: (sectionValue: string) => MaskCharacter[];
  validationFn: (sectionValue: string) => boolean;
  maxLength: number;
}

export interface MaskSectionInput extends MaskSectionInputDefinition {
  valueIndex: number;
}

export type MaskCharacter = {
  char: string;
  type: 'mask' | 'value';
};

export type MaskSectionFixedDerivedState = {
  type: 'fixed';
  index: number;

  textInputDisplayString: string;

  displaySpace: string[];
};

export type MaskSectionInputDerivedState = {
  type: 'input';
  alignment: 'left' | 'right';
  index: number;
  value: string;
  valueIndex: number;

  maskCharacters: MaskCharacter[];
  textInputDisplayString: string;

  valueSpace: string[];
  displaySpace: string[];

  valueSpaceToDisplaySpaceMap: Map<string, string>;
  displaySpaceToValueSpaceMap: Map<string, string>;
};

export type MaskSectionDefinition = MaskSectionFixedDefinition | MaskSectionInputDefinition;
export type MaskSectionDerivedState = MaskSectionFixedDerivedState | MaskSectionInputDerivedState;

export type MaskDefinition = {
  sections: MaskSectionDefinition[];
};

export type MaskState = {
  values: string[];

  caretPositionInValueSpace: string;
  selectionEndPositionInValueSpace: string;
};

export type MaskDerivedState = {
  encodedState: string;

  valueSpace: string[];
  displaySpace: string[];
  valueSpaceToDisplaySpaceMap: Map<string, string>;
  displaySpaceToValueSpaceMap: Map<string, string>;

  textInputDisplayString: string;
  textInputDisplayStringWithSelection: string;

  preInputHTMLString: string;
  postInputHTMLString: string;

  sections: MaskSectionDerivedState[];
};
