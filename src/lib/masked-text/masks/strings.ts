import type { MaskCharacter, MaskDefinition } from '../base/types';
import { MaskSectionFixed, MaskSectionInput } from '../base/index';

const stringsEncodeValidatedValue = (values: Record<string, string[]>): string | undefined => {
  const block1 = (values['block1'] || []).join('');
  const block2 = (values['block2'] || []).join('');
  const block3 = (values['block3'] || []).join('');
  const block4 = (values['block4'] || []).join('');

  return `${block1}.${block2}.${block3}.${block4}`;
};

const stringsBlockMaskFn = (sectionValue: string[]): MaskCharacter[] => {
  return sectionValue.map((c) => {
    return { char: c, type: 'value' as const };
  });
};

export const StringsMask = (): MaskDefinition => {
  const stringsBlockOptions = {
    maskingFn: stringsBlockMaskFn,
    alignment: 'left' as const,
  };

  const separatorSection = MaskSectionFixed(' | ');

  return {
    encodeValidatedValue: stringsEncodeValidatedValue,
    sections: [
      MaskSectionInput('block1', stringsBlockOptions),
      separatorSection,
      MaskSectionInput('block2', stringsBlockOptions),
      separatorSection,
      MaskSectionInput('block3', stringsBlockOptions),
      separatorSection,
      MaskSectionInput('block4', stringsBlockOptions),
    ],
  };
};
