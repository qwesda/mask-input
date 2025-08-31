import type { MaskDefinition, MaskDerivedState, MaskSectionDerivedState } from './types';

export const splitStringIntoGraphemes = function (value: string | undefined | null): string[] {
  const segmenter = new Intl.Segmenter('und', { granularity: 'grapheme' });

  return Array.from(segmenter.segment(value ?? ''), (segment) => segment.segment);
};

export const modelValuesEqual = (valuesA: Record<string, string>, valuesB: Record<string, string>): boolean => {
  const keysASet = new Set(Object.keys(valuesA));
  const keysBSet = new Set(Object.keys(valuesB));
  const allKeys = new Set([...keysASet, ...keysBSet]);

  if (allKeys.size !== keysBSet.size) {
    return false;
  }

  for (const key of allKeys) {
    if (valuesA[key] !== valuesB[key]) {
      return false;
    }
  }

  return true;
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

export const getExternalModelValueFromInternalModel = (internalModelValue: Record<string, string[]>): Record<string, string> => {
  const externalModelValue: Record<string, string> = {};

  for (const [key, value] of Object.entries(internalModelValue)) {
    externalModelValue[key] = value.join('');
  }

  return externalModelValue;
};

export const getInternalModelValueExternalFromModel = (
  externalModelValue: Record<string, string>,
  maskDefinition: MaskDefinition,
): Record<string, string[]> => {
  const internalModelValue: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(externalModelValue)) {
    internalModelValue[key] = splitStringIntoGraphemes(value);
  }

  for (const section of maskDefinition.sections.values()) {
    if (section.type === 'input') {
      if (internalModelValue[section.slug] === undefined) {
        internalModelValue[section.slug] = [];
      }
    }
  }

  return internalModelValue;
};

const getClosestMaskCharTargetNode = (
  containerNode: HTMLElement,
  startNode: Node | null,
  startOffset: number,
  preferredDirection: 'left' | 'right',
  maskDefinition: MaskDefinition,
): [HTMLElement | undefined, number] => {
  if (!startNode) {
    return [undefined, 0];
  }

  const startNodeElement = startNode.nodeType === Node.ELEMENT_NODE ? (startNode as HTMLElement) : (startNode.parentNode as HTMLElement);

  type TargetNode = {
    validTarget: boolean;
    element: HTMLElement;
    positionInValueSpace?: string;
    offset: number;
    length: number;
  };

  const flattenedElements: TargetNode[] = [];

  let sectionValueIndex = -1;
  let textOffset = 0;

  for (let sectionDisplayIndex = 0; containerNode.childNodes.length > sectionDisplayIndex; sectionDisplayIndex += 1) {
    const sectionNode = containerNode.childNodes[sectionDisplayIndex] as HTMLElement;
    const section = maskDefinition.sections[sectionDisplayIndex];
    const sectionStartTextOffset = textOffset;

    if (sectionNode.nodeType === Node.ELEMENT_NODE && sectionNode.classList.contains('section-fixed')) {
      textOffset += sectionNode.innerText?.length ?? 0;

      flattenedElements.push({
        validTarget: false,
        element: sectionNode,
        offset: textOffset,
        length: sectionNode.innerText?.length ?? 0,
      });
    } else if (sectionNode.nodeType === Node.ELEMENT_NODE && sectionNode.classList.contains('section-input')) {
      sectionValueIndex += 1;

      let sectionValuePosition = 0;

      for (let maskCharIndex = 0; maskCharIndex < sectionNode.childNodes.length; maskCharIndex += 1) {
        const maskCharNode = sectionNode.childNodes[maskCharIndex] as HTMLElement;

        if (maskCharNode.classList.contains('mask-char-value-placeholder')) {
          flattenedElements.push({
            validTarget: true,
            element: maskCharNode,
            positionInValueSpace: `${sectionValueIndex}:${sectionValuePosition}`,
            offset: textOffset,
            length: 1,
          });
        } else if (maskCharNode.classList.contains('mask-char-value')) {
          if (sectionValuePosition === 0) {
            flattenedElements.push({
              validTarget: true,
              element: maskCharNode,
              positionInValueSpace: `${sectionValueIndex}:${sectionValuePosition}`,
              offset: textOffset,
              length: 1,
            });
          }

          sectionValuePosition += 1;
          textOffset += 1;

          flattenedElements.push({
            validTarget: true,
            element: maskCharNode,
            positionInValueSpace: `${sectionValueIndex}:${sectionValuePosition}`,
            offset: textOffset,
            length: 1,
          });
        } else if (maskCharNode.classList.contains('mask-char-mask')) {
          textOffset += maskCharNode.innerText?.length ?? 0;

          flattenedElements.push({
            validTarget: false,
            element: maskCharNode,
            offset: textOffset,
            length: sectionNode.innerText?.length ?? 0,
          });
        }
      }

      if (sectionValuePosition === 0 && section.type === 'input') {
        if (section.alignment === 'left') {
          const firstChild = sectionNode.childNodes[0] as HTMLElement;

          flattenedElements.push({
            validTarget: true,
            element: firstChild as HTMLElement,
            positionInValueSpace: `${sectionValueIndex}:${0}`,
            offset: sectionStartTextOffset,
            length: firstChild.innerText?.length ?? 0,
          });
        } else {
          const lastChild = sectionNode.childNodes[sectionNode.childNodes.length - 1] as HTMLElement;

          flattenedElements.push({
            validTarget: true,
            element: lastChild as HTMLElement,
            positionInValueSpace: `${sectionValueIndex}:${0}`,
            offset: textOffset,
            length: lastChild.innerText?.length ?? 0,
          });
        }
      }
    }
  }

  const targetNodeIndex = flattenedElements.findLastIndex((x) => x.element === startNodeElement);

  if (targetNodeIndex !== -1) {
    const targetNode = flattenedElements[targetNodeIndex];

    if (targetNode.validTarget) {
      return [targetNode.element, startOffset > targetNode.length / 2 ? targetNode.length : 0];
    } else {
      let closestLeftValidTarget: TargetNode | undefined = undefined;
      let closestLeftValidTargetOffset = Infinity;
      let closestRightValidTarget: TargetNode | undefined = undefined;
      let closestRightValidTargetOffset = Infinity;

      for (let i = targetNodeIndex - 1; i >= 0; i--) {
        closestLeftValidTargetOffset -= flattenedElements[i].length;

        if (flattenedElements[i].validTarget) {
          closestLeftValidTarget = flattenedElements[i];
          break;
        }
      }

      for (let i = targetNodeIndex + 1; i < flattenedElements.length; i++) {
        closestRightValidTargetOffset += flattenedElements[i].length;

        if (flattenedElements[i].validTarget) {
          closestRightValidTarget = flattenedElements[i];
          break;
        }
      }

      if (closestLeftValidTarget && closestRightValidTarget) {
        if (closestLeftValidTargetOffset < closestRightValidTargetOffset) {
          return [closestLeftValidTarget.element, closestLeftValidTarget.length];
        } else if (closestLeftValidTargetOffset > closestRightValidTargetOffset) {
          return [closestRightValidTarget.element, 0];
        } else if (preferredDirection === 'left') {
          return [closestLeftValidTarget.element, closestLeftValidTarget.length];
        } else {
          return [closestRightValidTarget.element, 0];
        }
      } else if (closestLeftValidTarget) {
        return [closestLeftValidTarget.element, closestLeftValidTarget.length];
      } else if (closestRightValidTarget) {
        return [closestRightValidTarget.element, 0];
      }
    }
  }

  return [undefined, 0];
};

export const getValueSpaceCoordinatesFromSelection = (
  containerNode: HTMLElement,
  selection: Selection,
  maskDefinition: MaskDefinition,
): [string | undefined, string | undefined, boolean] => {
  let caretCoordinates: string | undefined = undefined;
  let selectionEndCoordinates: string | undefined = undefined;

  const { anchorNode, anchorOffset, focusNode, focusOffset, direction } = selection;

  const [targetAnchorNode, targetAnchorOffset] = getClosestMaskCharTargetNode(
    containerNode,
    anchorNode,
    anchorOffset,
    direction === 'backward' ? 'left' : 'right',
    maskDefinition,
  );
  const [targetFocusNode, targetFocusOffset] = getClosestMaskCharTargetNode(
    containerNode,
    focusNode,
    focusOffset,
    direction === 'backward' ? 'left' : 'right',
    maskDefinition,
  );

  if (!targetAnchorNode || !targetFocusNode) {
    return [undefined, undefined, false];
  }

  const exactMatch =
    (targetAnchorNode === anchorNode || targetAnchorNode === anchorNode?.parentNode) &&
    targetAnchorOffset === anchorOffset &&
    (targetFocusNode === focusNode || targetFocusNode === focusNode?.parentNode) &&
    targetFocusOffset === focusOffset;

  let valueSectionIndex = -1;

  for (let i = 0; i < containerNode.childNodes.length; i++) {
    const sectionNode = containerNode.childNodes[i] as HTMLElement;
    let valueSectionPosition = 0;

    if (sectionNode.nodeType === Node.ELEMENT_NODE && sectionNode.classList.contains('section-input')) {
      const sectionNodeElement = sectionNode as HTMLElement;
      valueSectionIndex += 1;

      for (let i = 0; i < sectionNodeElement.childNodes.length; i++) {
        const maskCharacterNode = sectionNodeElement.childNodes[i] as HTMLElement;

        if (maskCharacterNode === targetAnchorNode && anchorOffset === 0) {
          selectionEndCoordinates = `${valueSectionIndex}:${valueSectionPosition}`;
        }

        if (maskCharacterNode === targetFocusNode && focusOffset === 0) {
          caretCoordinates = `${valueSectionIndex}:${valueSectionPosition}`;
        }

        if (maskCharacterNode.classList.contains('mask-char-value') && !maskCharacterNode.classList.contains('mask-char-value-placeholder')) {
          valueSectionPosition += 1;
        }

        if (maskCharacterNode === targetAnchorNode && anchorOffset > 0) {
          selectionEndCoordinates = `${valueSectionIndex}:${valueSectionPosition}`;
        }

        if (maskCharacterNode === targetFocusNode && focusOffset > 0) {
          caretCoordinates = `${valueSectionIndex}:${valueSectionPosition}`;
        }

        if (caretCoordinates && selectionEndCoordinates) {
          break;
        }
      }
    }
  }

  return [caretCoordinates, selectionEndCoordinates, exactMatch];
};

export const getSelectionNodeAndOffsetFromPositionInValueSpace = (
  containerNode: HTMLElement,
  positionInValueSpace: string,
  derivedState: MaskDerivedState,
  maskDefinition: MaskDefinition,
): [HTMLElement | undefined, number] => {
  const [targetSectionIndex, targetValuePositionInSection] = positionInValueSpace.split(':').map((x) => Number.parseInt(x));
  const sectionNodes = containerNode.querySelectorAll('.section-input');

  let valueSpacePosition = 0;

  if (targetSectionIndex >= 0 && targetSectionIndex < sectionNodes.length) {
    const sectionNode = sectionNodes[targetSectionIndex] as HTMLElement;

    for (let i = 0; i < sectionNode.childNodes.length; i++) {
      const maskCharacterNode = sectionNode.childNodes[i] as HTMLElement;

      if (maskCharacterNode.classList.contains('mask-char-value') && !maskCharacterNode.classList.contains('mask-char-value-placeholder')) {
        if (valueSpacePosition === 0 && targetValuePositionInSection === 0) {
          return [maskCharacterNode as HTMLElement, 0];
        }

        valueSpacePosition += 1;

        if (valueSpacePosition === targetValuePositionInSection) {
          return [maskCharacterNode as HTMLElement, 1];
        }
      }
    }

    if (targetValuePositionInSection === 0 && sectionNode.childNodes.length > 0) {
      let inputSectionIndex = -1;

      for (let i = 0; i < maskDefinition.sections.length; i++) {
        const targetSection = maskDefinition.sections[i];

        if (targetSection.type === 'input') {
          inputSectionIndex += 1;

          if (inputSectionIndex === targetSectionIndex) {
            if (targetSection.alignment == 'left') {
              return [sectionNode.childNodes[0] as HTMLElement, 0];
            } else {
              const lastChild = sectionNode.childNodes[sectionNode.childNodes.length - 1] as HTMLElement;

              return [lastChild, lastChild.innerText.length];
            }
          }
        }
      }
    }
  }

  return [undefined, -1];
};

export const encodeValuesAsHtml = (maskDefinition: MaskDefinition, values: Record<string, string[]>): string => {
  const spans = [];

  for (const section of maskDefinition.sections) {
    if (section.type === 'input') {
      const className = `masked-text-value-${section.slug}`;

      for (const value of values[section.slug]) {
        spans.push(`<span class="${className}">${value}</span>`);
      }
    } else if (section.type === 'fixed') {
      spans.push(`<span>${section.mask}</span>`);
    }
  }

  return `<div class="masked-text-clipboard-data">${spans.join('')}</div>`;
};

export const parseValuesFromHtml = (html: string): Record<string, string[]> | null => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const container = doc.querySelector('.masked-text-clipboard-data');

    if (!container) {
      return null;
    }

    const values: Record<string, string[]> = {};
    const spans = container.querySelectorAll('span[class^="masked-text-value-"]');

    spans.forEach((span) => {
      const match = span.className.match(/masked-text-value-(.+)/);

      if (match) {
        const key = match[1];
        const value = span.textContent || '';

        if (!values[key]) {
          values[key] = [];
        }

        values[key].push(value);
      }
    });

    return values;
  } catch (error) {
    console.error('Failed to parse HTML clipboard data:', error);

    return null;
  }
};
