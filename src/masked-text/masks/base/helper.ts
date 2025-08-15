import type { MaskDerivedState, MaskSectionDerivedState } from '@/masked-text/masks/base/types.ts';

export const splitStringIntoGraphemes = function (value: string | undefined | null): string[] {
  const segmenter = new Intl.Segmenter('und', { granularity: 'grapheme' });

  return Array.from(segmenter.segment(value || ''), (segment) => segment.segment);
};

export const compareSpaceCoordinates = (a: string | undefined, b: string | undefined): number | undefined => {
  if (a === undefined || b === undefined) {
    return undefined;
  }

  const [aSection, aPosition] = a.split(':').map((x) => Number.parseInt(x));
  const [bSection, bPosition] = b.split(':').map((x) => Number.parseInt(x));

  if (aSection < bSection) {
    return -1;
  } else if (aSection > bSection) {
    return 1;
  } else {
    return aPosition - bPosition;
  }
};

export const findSection = (
  derivedState: MaskDerivedState,
  options: {
    startIndex: number;
    direction: 'left' | 'right';
    alignment?: 'left' | 'right';
    type?: 'input' | 'fixed';
    includeStartIndex?: boolean;
  },
): MaskSectionDerivedState | undefined => {
  const includeStartIndex = options.includeStartIndex ?? false;
  const searchStartIndex =
    options.direction === 'right' ? options.startIndex + (includeStartIndex ? 0 : 1) : options.startIndex - (includeStartIndex ? 0 : 1);

  if (
    options.startIndex < 0 ||
    options.startIndex >= derivedState.sections.length ||
    searchStartIndex < 0 ||
    searchStartIndex >= derivedState.sections.length
  ) {
    return undefined;
  }

  const needleSection = derivedState.sections[options.startIndex];

  if (options.direction === 'right') {
    for (let i = searchStartIndex; i < derivedState.sections.length; i++) {
      const candidateSection = derivedState.sections[i];

      if (
        (!options.type || candidateSection.type === options.type) &&
        (!options.alignment || (candidateSection.type === 'input' && candidateSection.alignment === options.alignment))
      ) {
        return { ...candidateSection };
      }
    }
  } else {
    for (let i = searchStartIndex; i >= 0; i--) {
      const candidateSection = derivedState.sections[i];

      if (
        (!options.type || candidateSection.type === options.type) &&
        (!options.alignment || (candidateSection.type === 'input' && candidateSection.alignment === options.alignment))
      ) {
        return { ...candidateSection };
      }
    }
  }

  return undefined;
};

export const findClosestValidValueSpaceCoordinates = (derivedState: MaskDerivedState, searchCoordinates: string): string | undefined => {
  const [searchCoordinatesSectionIndex, searchCoordinatesPosition] = searchCoordinates.split(':').map((x) => Number.parseInt(x));

  if (searchCoordinatesSectionIndex >= 0 && searchCoordinatesSectionIndex < derivedState.sections.length) {
    const section = derivedState.sections[searchCoordinatesSectionIndex];

    if (section.type === 'input') {
      const validValueSpaceSortedByDistance = section.valueSpace
        .map((x) => x.split(':').map((y) => Number.parseInt(y)))
        .sort((a, b) => Math.abs(a[1] - searchCoordinatesPosition) - Math.abs(b[1] - searchCoordinatesPosition));

      if (validValueSpaceSortedByDistance) {
        return `${searchCoordinatesSectionIndex}:${validValueSpaceSortedByDistance[0]}`;
      }
    } else {
      const firstLeftInputSection = findSection(derivedState, {
        startIndex: searchCoordinatesSectionIndex,
        direction: 'left',
        type: 'input',
        includeStartIndex: true,
      });

      const firstRightInputSection = findSection(derivedState, {
        startIndex: searchCoordinatesSectionIndex,
        direction: 'right',
        type: 'input',
        includeStartIndex: true,
      });

      if (firstLeftInputSection && firstLeftInputSection.type === 'input') {
        return firstLeftInputSection.valueSpace[firstLeftInputSection.valueSpace.length - 1];
      }

      if (firstRightInputSection && firstRightInputSection.type === 'input') {
        return firstRightInputSection.valueSpace[0];
      }
    }
  }

  return undefined;
};
