export interface MaskSectionFixedDefinition {
  type: 'fixed';
  mask: string;
  skipKeys?: string[];
}

export interface MaskSectionInputDefinition {
  type: 'input';
  maskingFn: (sectionValue: string) => MaskCharacter[];

  inputBehavior: 'replace' | 'insert';
  alignment: 'left' | 'right';

  inputCharacterFilterFn: ((inputCharacter: string) => boolean) | undefined;
  inputCharacterSubstitutionFn: ((inputCharacter: string) => string) | undefined;

  syntacticValidationFn: ((sectionValue: string) => boolean) | undefined;
  semanticValidationFn: ((values: string[], sectionIndex: number) => boolean) | undefined;

  spinUpFn: ((sectionValue: string, metaPressed: boolean, shiftPressed: boolean, altPressed: boolean) => string) | undefined;
  spinDownFn: ((sectionValue: string, metaPressed: boolean, shiftPressed: boolean, altPressed: boolean) => string) | undefined;

  sectionCommitValueTransformation: ((sectionValue: string) => string) | undefined;

  maxLength: number | undefined;
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

  caretValueSpaceIndex: number;
  caretValueSpacePosition: number;

  caretDisplaySpaceIndex: number;
  caretDisplaySpacePosition: number;

  valueSpaceToDisplaySpaceMap: Map<string, string>;
  displaySpaceToValueSpaceMap: Map<string, string>;

  textInputDisplayString: string;
  textInputDisplayStringWithSelection: string;

  preInputHTMLString: string;
  postInputHTMLString: string;

  sections: MaskSectionDerivedState[];
};

export type PatchOperationMoveCursor = {
  op: 'move-cursor';
  direction: 'left' | 'right';
  level: 'character' | 'section' | 'line';
  keepSelectionEnd: boolean;
};

export type PatchOperationSelectNextSection = {
  op: 'select-next-section';
  direction: 'left' | 'right';
};

export type PatchOperationSetCursorPosition = {
  op: 'set-cursor-position';
  keepSelectionEnd: boolean;
};

export type PatchOperationInsertCharacter = {
  op: 'insert-character';
  character: string;
};

export type PatchOperationDeleteBackwards = {
  op: 'delete-backwards';
};

export type PatchOperationDeleteForwards = {
  op: 'delete-forwards';
};

export type PatchOperationClearSelection = {
  op: 'clear-selection';
  direction: 'left' | 'right';
};

export type PatchOperationDeleteSelection = {
  op: 'delete-selection';
};

export type PatchOperationSpin = {
  op: 'spin';
  direction: 'up' | 'down';
  metaPressed: boolean;
  shiftPressed: boolean;
  altPressed: boolean;
};

export type PatchOperationMovement = PatchOperationMoveCursor | PatchOperationSetCursorPosition | PatchOperationSelectNextSection;
export type PatchOperationEdit =
  | PatchOperationInsertCharacter
  | PatchOperationDeleteBackwards
  | PatchOperationDeleteForwards
  | PatchOperationDeleteSelection
  | PatchOperationSpin;
export type PatchOperation = PatchOperationClearSelection | PatchOperationMovement | PatchOperationEdit;
