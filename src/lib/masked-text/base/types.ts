export interface MaskSectionFixedDefinition {
  type: 'fixed';
  mask: string;
  skipKeys?: string[];
}

export interface MaskSectionInputDefinition {
  type: 'input';
  slug: string;
  maskingFn: (sectionValue: string[]) => MaskCharacter[];

  inputBehavior: 'replace' | 'insert';
  alignment: 'left' | 'right';

  inputCharacterFilterFn: ((inputCharacter: string) => boolean) | undefined;
  inputCharacterSubstitutionFn: ((inputCharacter: string) => string) | undefined;

  syntacticValidationFn: ((sectionValue: string) => boolean) | undefined;

  spinUpFn:
    | ((
        values: Record<string, string[]>,
        sectionSlug: string,
        metaPressed: boolean,
        shiftPressed: boolean,
        altPressed: boolean,
      ) => Record<string, string[]>)
    | undefined;
  spinDownFn:
    | ((
        values: Record<string, string[]>,
        sectionSlug: string,
        metaPressed: boolean,
        shiftPressed: boolean,
        altPressed: boolean,
      ) => Record<string, string[]>)
    | undefined;

  sectionCommitValueTransformation: ((sectionValue: string[]) => string) | undefined;

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
  slug: string;
  value: string[];
  valueString: string;
  valueIndex: number;

  maskCharacters: MaskCharacter[];
  textInputDisplayString: string;

  valueSpace: string[];
  displaySpace: string[];

  syntacticValidationStatus: boolean | undefined;

  valueSpaceToDisplaySpaceMap: Map<string, string>;
  displaySpaceToValueSpaceMap: Map<string, string>;
};

export type MaskSectionDefinition = MaskSectionFixedDefinition | MaskSectionInputDefinition;
export type MaskSectionDerivedState = MaskSectionFixedDerivedState | MaskSectionInputDerivedState;

export type MaskDefinition = {
  encodeValidatedValue: (values: Record<string, string[]>) => string | undefined;
  semanticValidationFn?: (values: Record<string, string[]>) => [boolean, string];
  valueNormalizationFn?: (values: Record<string, string[]>) => Record<string, string[]>;
  getValuesFromStringRepresentation?: (stringRepresentation: string) => Record<string, string[]>;
  sections: MaskSectionDefinition[];
};

export type MaskState = {
  values: Record<string, string[]>;

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

  inputHTMLString: string;

  sections: MaskSectionDerivedState[];

  semanticValidationStatus: boolean | undefined;
  semanticValidationMessage: string;

  syntacticValidationStatus: Record<string, boolean | undefined>;

  validatedStringEncodedValue: string | undefined;
};

export type PatchOperationMoveCursor = {
  op: 'move-cursor';
  direction: 'left' | 'right';
  level: 'character' | 'section' | 'line';
  keepSelectionEnd: boolean;
};

export type PatchOperationSetCursorPosition = {
  op: 'set-cursor-position';
  caretPositionInValueSpace: string;
  keepSelectionEnd: boolean;
};

export type PatchOperationSetSelection = {
  op: 'set-selection';
  caretPositionInValueSpace: string;
  selectionEndPositionInValueSpace: string;
};

export type PatchOperationSetValues = {
  op: 'set-values';
  values: Record<string, string[]>;
};

export type PatchOperationSelectNextSection = {
  op: 'select-next-section';
  direction: 'left' | 'right';
};

export type PatchOperationSelectAll = {
  op: 'select-all';
};

export type PatchOperationInsertCharacter = {
  op: 'insert-character';
  character: string;
  inputBehavior?: 'replace' | 'insert';
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

export type PatchOperationApplyValueNormalization = {
  op: 'apply-value-normalization';
};

export type PatchOperationSpin = {
  op: 'spin';
  direction: 'up' | 'down';
  metaPressed: boolean;
  shiftPressed: boolean;
  altPressed: boolean;
};

export type PatchOperationMovement =
  | PatchOperationMoveCursor
  | PatchOperationSetSelection
  | PatchOperationSetCursorPosition
  | PatchOperationSelectNextSection
  | PatchOperationSetValues
  | PatchOperationSelectAll;

export type PatchOperationEdit =
  | PatchOperationInsertCharacter
  | PatchOperationDeleteBackwards
  | PatchOperationDeleteForwards
  | PatchOperationDeleteSelection
  | PatchOperationApplyValueNormalization
  | PatchOperationSpin;

export type PatchOperation = PatchOperationClearSelection | PatchOperationMovement | PatchOperationEdit;
