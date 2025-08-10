<template>
  <div class="masked-text-container">
    <input
      ref="inputRef"
      @input.capture="handleInput"
      @keydown.capture="handleKeydown"
      @focus="handleFocus"
      @blur="handleBlur"
      @click="handleClick"
      class="masked-text-input"
      autofocus
    />

    <span class="text-overlay" ref="textOverlayRef" />
  </div>

  <pre v-if="hasFocus" class="masked-text-debug">
currentSectionIndex: {{ currentSectionIndex }}
currentCursorPos: {{ currentCursorPos }}
sectionBounds: [
<template v-for="(section, index) in maskSections" :key="index">  [{{section.bounds.join(', ')}}],
</template>]
validCursorPositions: [
<template v-for="(section, index) in maskSections" :key="index">  [{{ section.validCursorDisplayPositions.join(', ') }}],
</template>]
sectionValues: {{ sectionValues }}
displayValueParts: {{ maskSections.map((section) => section.displayValue) }}
displayHTMLParts: {{ maskSections.map((section) => section.displayHTML) }}
displayBounds: [
<template v-for="(section, index) in maskSections" :key="index">  [{{ section }}],
</template>]
</pre>
</template>

<script setup lang="ts">
  import { ref, watch, nextTick, type Ref } from 'vue';

  export interface MaskSectionPropsFixed {
    type: 'fixed';
    mask: string;
    value: string;
    key?: string;
    skipKeys?: string[];
  }

  export interface MaskSectionPropsInput {
    type: 'input';
    inputBehavior: 'replace' | 'insert';
    inputAlign: 'left' | 'right';
    maxLength?: number;
    defaultValue?: string;
    maskFn: (x: string) => MaskCharacter[];
    validationFn: (x: string) => boolean;
  }

  interface MaskSectionInput extends MaskSectionPropsInput {
    valueIndex: number;
  }

  // interface MaskCalculatedProperties

  type MaskCharacter = {
    char: string;
    type: 'mask' | 'value';
  };

  type MaskCharacterWithBounds = MaskCharacter & {
    valueBounds: [number, number];
    displayBounds: [number, number];
  };

  type MaskSectionFixedWithCalculatedProperties = MaskSectionPropsFixed & {
    type: 'fixed';
    index: number;
    bounds: [number, number];

    displayValue: string;
    displayHTML: string;

    validCursorDisplayPositions: number[];
  };
  type MaskSectionInputWithCalculatedProperties = MaskSectionInput & {
    type: 'input';
    index: number;
    bounds: [number, number];

    displayValue: string;
    displayHTML: string;

    validCursorDisplayPositions: number[];
    maxValidCursorPosition: number;
    minValidCursorPosition: number;
    valueRelPositionToDisplayBounds: Record<number, [number, number]>;
  };

  interface Props {
    mask: (MaskSectionPropsFixed | MaskSectionPropsInput)[];
    modelValue?: string[];
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
  });

  defineEmits<{
    'update:modelValue': [value: string[]];
  }>();

  const inputRef = ref<HTMLInputElement>();
  const textOverlayRef = ref<HTMLSpanElement>();

  const maskSections: Ref<(MaskSectionFixedWithCalculatedProperties | MaskSectionInputWithCalculatedProperties)[]> = ref([]);

  const updateMaskCharacters = (maskCharacters: MaskCharacter[], _section: MaskSectionPropsInput) => {
    const ret: MaskCharacterWithBounds[] = [];

    let valueIndex = 0;
    let displayIndex = 0;

    for (const maskChar of maskCharacters) {
      if (maskChar.type === 'value') {
        ret.push({
          ...maskChar,
          valueBounds: [valueIndex, valueIndex + 1],
          displayBounds: [displayIndex, displayIndex + maskChar.char.length],
        });

        valueIndex += 1;
      } else {
        ret.push({
          ...maskChar,
          valueBounds: [displayIndex, displayIndex + maskChar.char.length],
          displayBounds: [displayIndex, displayIndex + maskChar.char.length],
        });
      }

      displayIndex += maskChar.char.length;
    }

    return ret;
  };

  const updateMaskSections = () => {
    const updatedMaskSections: (MaskSectionFixedWithCalculatedProperties | MaskSectionInputWithCalculatedProperties)[] = [];

    let currentEnd = 0;
    let currentValueIndex = 0;

    for (let i = 0; i < props.mask.length; i++) {
      const displayHTMLChars: { char: string; class: string }[] = [];
      const section = props.mask[i];

      if (section.type === 'input') {
        const value = sectionValues.value[i] || '';
        const maskCharacters = updateMaskCharacters(section.maskFn(value) || [], section);

        const displayValue = maskCharacters.map((char) => char.char).join('');
        const validCursorPositions: number[] = [];
        const valueRelPositionToDisplayBounds: Record<number, [number, number]> = {};

        for (const maskChar of maskCharacters.values()) {
          if (maskChar.type === 'value' && maskChar.displayBounds && maskChar.valueBounds) {
            validCursorPositions.push(maskChar.displayBounds[0]);
            validCursorPositions.push(maskChar.displayBounds[1]);

            valueRelPositionToDisplayBounds[maskChar.valueBounds[0]] = maskChar.displayBounds;
          }
        }

        if (validCursorPositions.length === 0) {
          if (section.inputAlign === 'left') {
            validCursorPositions.push(0);
            valueRelPositionToDisplayBounds[0] = maskCharacters[0].displayBounds;
          } else {
            validCursorPositions.push(displayValue.length);
            valueRelPositionToDisplayBounds[0] = maskCharacters[maskCharacters.length - 1].displayBounds;
          }
        }

        const uniquePositions = [...new Set(validCursorPositions)].sort((a, b) => a - b);

        for (const maskChar of maskCharacters.values()) {
          const lastChar = displayHTMLChars[displayHTMLChars.length - 1];
          const displayHTMLClass = maskChar.type === 'value' ? 'input-mask-char-input' : 'input-mask-char-mask';

          if (lastChar?.class === displayHTMLClass) {
            displayHTMLChars[displayHTMLChars.length - 1].char += maskChar.char;
          } else {
            displayHTMLChars.push({ char: maskChar.char, class: displayHTMLClass });
          }
        }

        const displayHTML = displayHTMLChars.map((char) => `<span class="${char.class}">${char.char}</span>`).join('');

        updatedMaskSections.push({
          ...section,
          index: i,
          valueIndex: currentValueIndex,
          bounds: [currentEnd, currentEnd + displayValue.length],
          displayValue,
          displayHTML,
          validCursorDisplayPositions: uniquePositions,
          valueRelPositionToDisplayBounds,
          maxValidCursorPosition: Math.max(...uniquePositions),
          minValidCursorPosition: Math.min(...uniquePositions),
        });

        currentValueIndex += 1;
        currentEnd += displayValue.length;
      } else {
        const displayValue = section.mask;
        const displayHTML = '<span class="fixed-mask">' + section.mask + '</span>';

        updatedMaskSections.push({
          ...section,
          index: i,
          bounds: [currentEnd, currentEnd + section.mask?.length],
          displayValue,
          displayHTML,
          validCursorDisplayPositions: [],
        });

        currentEnd = currentEnd + section.mask?.length;
      }
    }

    maskSections.value = updatedMaskSections;

    if (inputRef.value && textOverlayRef.value) {
      updateInput();
    } else {
      nextTick(() => {
        updateInput();
      });
    }
  };
  const updateInput = () => {
    const displayValue = maskSections.value.map((section) => section.displayValue).join('');
    const displayHTML = maskSections.value.map((section) => section.displayHTML).join('');

    if (!inputRef.value || !textOverlayRef.value) {
      return;
    }

    inputRef.value.value = displayValue;
    textOverlayRef.value.innerHTML = displayHTML;
  };

  const sectionValues = ref<string[]>([]);
  const currentSectionIndex = ref(0);
  const currentCursorPos = ref(0);
  const hasFocus = ref(false);

  const initializeSectionValues = () => {
    const newSectionValues: string[] = [];

    let valueIndex = 0;

    for (const section of props.mask) {
      if (section.type === 'input') {
        if (props.modelValue && props.modelValue.length > valueIndex && section.validationFn(props.modelValue[valueIndex])) {
          newSectionValues.push(props.modelValue[valueIndex]);
        } else {
          newSectionValues.push(section.defaultValue || '');
        }

        valueIndex += 1;
      } else if (section.type === 'fixed') {
        newSectionValues.push(section.value);
      } else {
        newSectionValues.push('');
      }
    }

    sectionValues.value = newSectionValues;
  };

  const handleInput = (event: Event) => {
    event.preventDefault();
  };

  const getSectionsAtPosition = (
    position: number,
    type: 'input' | 'fixed' | undefined = undefined,
  ): (MaskSectionFixedWithCalculatedProperties | MaskSectionInputWithCalculatedProperties)[] => {
    const returnSections: (MaskSectionFixedWithCalculatedProperties | MaskSectionInputWithCalculatedProperties)[] = [];

    for (const section of maskSections.value) {
      const [start, end] = section.bounds;

      if (position >= start && position <= end && (!type || section.type === type)) {
        returnSections.push(section);
      }
    }

    return returnSections;
  };

  const chooseBestSection = (sectionCandidates: (MaskSectionFixedWithCalculatedProperties | MaskSectionInputWithCalculatedProperties)[]) => {
    for (let i = 0; i < sectionCandidates.length; i++) {
      if (sectionCandidates[i].index === currentSectionIndex.value) {
        return sectionCandidates[i];
      }
    }

    for (let i = 0; i < sectionCandidates.length; i++) {
      if (sectionCandidates[i].type === 'input') {
        return sectionCandidates[i];
      }
    }

    if (sectionCandidates.length >= 1) {
      const bestFixedSection = sectionCandidates[0];

      const firstLeftAdjacentInputSection = findSection({ startIndex: bestFixedSection.index, direction: 'left', type: 'input' });
      const firstRightAdjacentInputSection = findSection({ startIndex: bestFixedSection.index, direction: 'right', type: 'input' });

      if (firstLeftAdjacentInputSection && firstRightAdjacentInputSection) {
        const leftDistance = firstLeftAdjacentInputSection?.bounds[0] - bestFixedSection.bounds[0];
        const rightDistance = bestFixedSection.bounds[1] - firstRightAdjacentInputSection?.bounds[1];

        if (leftDistance < rightDistance) {
          return firstLeftAdjacentInputSection;
        } else {
          return firstRightAdjacentInputSection;
        }
      } else if (firstLeftAdjacentInputSection) {
        return firstLeftAdjacentInputSection;
      } else if (firstRightAdjacentInputSection) {
        return firstRightAdjacentInputSection;
      }

      return bestFixedSection;
    } else {
      return undefined;
    }
  };

  const findSection = (options: {
    startIndex: number;
    direction: 'left' | 'right';
    type?: 'input' | 'fixed';
    includeStartIndex?: boolean;
    allowSameBounds?: boolean;
  }): (MaskSectionFixedWithCalculatedProperties | MaskSectionInputWithCalculatedProperties) | undefined => {
    const needleIndex = options.startIndex;
    const direction = options.direction;
    const type = options.type;
    const includeStartIndex = options.includeStartIndex ?? false;
    const allowSameBounds = options.allowSameBounds ?? includeStartIndex;
    const searchStartIndex = direction === 'right' ? needleIndex + (includeStartIndex ? 0 : 1) : needleIndex - (includeStartIndex ? 0 : 1);

    if (needleIndex < 0 || needleIndex >= props.mask.length || searchStartIndex < 0 || searchStartIndex >= props.mask.length) {
      return undefined;
    }

    const needleSection = maskSections.value[needleIndex];
    const [needleStart, needleEnd] = needleSection.bounds;

    if (direction === 'right') {
      for (let i = searchStartIndex; i < props.mask.length; i++) {
        const candidateSection = maskSections.value[i];
        const [candidateStart, candidateEnd] = candidateSection.bounds;

        if (
          candidateStart >= needleStart &&
          candidateEnd >= needleEnd &&
          (!type || candidateSection.type === type) &&
          (allowSameBounds || candidateStart > needleStart || candidateEnd > needleEnd)
        ) {
          return { ...candidateSection, index: i };
        }
      }
    } else {
      for (let i = searchStartIndex; i >= 0; i--) {
        const candidateSection = maskSections.value[i];
        const [candidateStart, candidateEnd] = candidateSection.bounds;

        if (
          candidateStart <= needleStart &&
          candidateEnd <= needleEnd &&
          (!type || candidateSection.type === type) &&
          (allowSameBounds || candidateStart < needleStart || candidateEnd < needleEnd)
        ) {
          return { ...candidateSection, index: i };
        }
      }
    }

    return undefined;
  };

  const getPatchedValue = (section: MaskSectionInputWithCalculatedProperties, key: string): [string, number, 'left' | 'right' | undefined] => {
    const currentValue = sectionValues.value[section.index] || '';
    const currentDisplayCursorPosition = currentCursorPos.value - section.bounds[0];
    const currentValueCursorPosition = section.validCursorDisplayPositions.findIndex((position) => position === currentDisplayCursorPosition);

    // Handle special keys
    if (key === 'Backspace') {
      if (currentValueCursorPosition > 0) {
        switch (section.inputBehavior) {
          case 'replace': // Replace character with empty (delete) at current position - 1
            return [
              currentValue.substring(0, currentDisplayCursorPosition - 1) + currentValue.substring(currentDisplayCursorPosition),
              currentValueCursorPosition - 1,
              'left',
            ];

          case 'insert': // Insert behavior: remove character and shift based on alignment
            if (section.inputAlign === 'left') {
              return [
                currentValue.slice(0, currentValueCursorPosition - 1) + currentValue.slice(currentValueCursorPosition),
                currentValueCursorPosition - 1,
                'left',
              ];
            } else {
              return [
                currentValue.slice(0, currentValueCursorPosition - 1) + currentValue.slice(currentValueCursorPosition),
                currentValueCursorPosition - 2,
                'right',
              ];
            }
        }
      }

      return [currentValue, currentDisplayCursorPosition, undefined];
    }

    if (key === 'Delete') {
      if (currentValueCursorPosition < currentValue.length) {
        switch (section.inputBehavior) {
          case 'replace': // Delete character at current position (default behavior)
            return [
              currentValue.slice(0, currentValueCursorPosition) + currentValue.slice(currentValueCursorPosition + 1),
              currentValueCursorPosition + 1,
              'right',
            ];

          case 'insert': // Insert behavior: delete character and shift based on alignment
            if (section.inputAlign === 'left') {
              // Delete character at current position and shift remaining characters left
              return [
                currentValue.slice(0, currentValueCursorPosition) + currentValue.slice(currentValueCursorPosition + 1),
                currentValueCursorPosition,
                'left',
              ];
            } else {
              // Remove character from the end of the string (right alignment)
              return [
                currentValue.slice(0, currentValueCursorPosition) + currentValue.slice(currentValueCursorPosition + 1),
                currentValueCursorPosition - 1,
                'right',
              ];
            }
        }
      }

      return [currentValue, currentDisplayCursorPosition, undefined];
    }

    // Handle regular character input based on inputBehavior
    if (key.length === 1) {
      switch (section.inputBehavior) {
        case 'replace': // Replace character at current position
          return [
            currentValue.substring(0, currentValueCursorPosition) + key + currentValue.substring(currentValueCursorPosition + 1),
            currentValueCursorPosition + 1,
            'right',
          ];

        case 'insert': // Insert character and shift based on alignment
          if (section.inputAlign === 'left') {
            // Insert character and shift existing characters to the right
            return [
              currentValue.substring(0, currentValueCursorPosition) + key + currentValue.substring(currentValueCursorPosition),
              currentValueCursorPosition + 1,
              'left',
            ];
          } else {
            // Insert character at the end and shift left (right alignment)
            return [
              currentValue.substring(0, currentValueCursorPosition) + key + currentValue.substring(currentValueCursorPosition),
              currentValueCursorPosition,
              'right',
            ];
          }
      }
    }

    // For any other keys, return unchanged
    return [currentValue, currentValueCursorPosition, undefined];
  };

  const handleKeydown = (event: KeyboardEvent) => {
    let section = chooseBestSection(getSectionsAtPosition(currentCursorPos.value));

    if (!section || section.type === 'fixed') {
      return;
    }

    const firstRightAdjacentInputSection = findSection({ startIndex: section.index, direction: 'right', type: 'input' });
    const firstRightAdjacentSection = findSection({ startIndex: section.index, direction: 'right' });
    const firstLeftAdjacentInputSection = findSection({ startIndex: section.index, direction: 'left', type: 'input' });

    const currentSectionRelCursorPosition = currentCursorPos.value - section.bounds[0];

    if (event.key === 'Tab' && !event.shiftKey) {
      if (firstRightAdjacentInputSection) {
        setCaretToSection(firstRightAdjacentInputSection, 0);

        event.preventDefault();
      }
    } else if (event.key === 'Tab' && event.shiftKey) {
      if (firstLeftAdjacentInputSection) {
        setCaretToSection(firstLeftAdjacentInputSection, -1);

        event.preventDefault();
      }
    } else if (event.key === 'ArrowRight') {
      if (currentSectionRelCursorPosition < section.maxValidCursorPosition) {
        const nextValidPosition = Math.min(...section.validCursorDisplayPositions.filter((position) => position > currentSectionRelCursorPosition));
        setCaretToSection(section, nextValidPosition);
      } else if (firstRightAdjacentInputSection) {
        setCaretToSection(firstRightAdjacentInputSection, 0);
      }

      event.preventDefault();
    } else if (event.key === 'ArrowLeft') {
      if (currentSectionRelCursorPosition > section.minValidCursorPosition) {
        const nextValidPosition = Math.max(...section.validCursorDisplayPositions.filter((position) => position < currentSectionRelCursorPosition));
        setCaretToSection(section, nextValidPosition);
      } else if (firstLeftAdjacentInputSection) {
        setCaretToSection(firstLeftAdjacentInputSection, -1);
      }

      event.preventDefault();
    } else if (event.key === 'Backspace' && currentSectionRelCursorPosition === section.minValidCursorPosition) {
      if (firstLeftAdjacentInputSection) {
        setCaretToSection(firstLeftAdjacentInputSection, -1);
      }

      event.preventDefault();
    } else if (event.key === 'Delete' && currentSectionRelCursorPosition === section.maxValidCursorPosition) {
      if (firstRightAdjacentInputSection) {
        setCaretToSection(firstRightAdjacentInputSection, 0);
      }

      event.preventDefault();
    } else if (
      firstRightAdjacentInputSection &&
      firstRightAdjacentSection?.type === 'fixed' &&
      firstRightAdjacentSection?.skipKeys?.includes(event.key) &&
      firstRightAdjacentSection.bounds[0] === currentCursorPos.value
    ) {
      setCaretToSection(firstRightAdjacentInputSection, 0);

      event.preventDefault();
    } else if (firstLeftAdjacentInputSection && event.key === 'ArrowLeft' && section.minValidCursorPosition === currentSectionRelCursorPosition) {
      setCaretToSection(firstLeftAdjacentInputSection, -1);

      event.preventDefault();
    } else if (section.type === 'input') {
      event.preventDefault();

      let [patchedValue, newValueCursorPosition, direction] = getPatchedValue(section, event.key);

      if (newValueCursorPosition < 0) {
        newValueCursorPosition = 0;
        direction = 'left';
      } else if (newValueCursorPosition >= patchedValue.length && newValueCursorPosition > 0) {
        newValueCursorPosition = patchedValue.length - 1;
        direction = 'right';
      }

      if (direction !== undefined && section.validationFn(patchedValue)) {
        sectionValues.value[section.index] = patchedValue;

        updateMaskSections();

        section = maskSections.value[section.index];

        const newFirstRightAdjacentInputSection = findSection({ startIndex: section.index, direction: 'right', type: 'input' });
        const newFirstRightAdjacentSection = findSection({ startIndex: section.index, direction: 'right' });

        const newRelDisplayCursorPosition = (section as MaskSectionInputWithCalculatedProperties).valueRelPositionToDisplayBounds[
          newValueCursorPosition
        ][direction === 'right' ? 1 : 0];
        const newAbsDisplayCursorPosition = newRelDisplayCursorPosition + section.bounds[0];

        if (
          section.type === 'input' &&
          section.maxLength === patchedValue.length &&
          newFirstRightAdjacentInputSection &&
          newFirstRightAdjacentSection?.type === 'fixed' &&
          newFirstRightAdjacentSection.bounds[0] === newAbsDisplayCursorPosition
        ) {
          setCaretToSection(newFirstRightAdjacentInputSection, 0);
        } else {
          setCaretToSection(section, newRelDisplayCursorPosition);
        }

        console.log('patch value', event.key);
      }
    } else {
      event.preventDefault();
    }
  };

  const setCaretToSection = (section: MaskSectionFixedWithCalculatedProperties | MaskSectionInputWithCalculatedProperties, relPosition: number) => {
    if (section?.type === 'input') {
      let clampedPosition;

      if (section.validCursorDisplayPositions.includes(relPosition)) {
        clampedPosition = relPosition;
      } else if (relPosition === -1) {
        clampedPosition = section.maxValidCursorPosition;
      } else if (relPosition > section.maxValidCursorPosition) {
        clampedPosition = section.maxValidCursorPosition;
      } else {
        clampedPosition = [...section.validCursorDisplayPositions].sort((a, b) => Math.abs(a - relPosition) - Math.abs(b - relPosition))[0];
      }

      currentCursorPos.value = section.bounds[0] + clampedPosition;
      currentSectionIndex.value = section.index;

      inputRef.value?.setSelectionRange(currentCursorPos.value, currentCursorPos.value);
    }
  };

  const handleFocus = () => {
    hasFocus.value = true;

    const firstInputSection = findSection({
      startIndex: 0,
      direction: 'right',
      type: 'input',
      includeStartIndex: true,
    });

    if (firstInputSection) {
      currentSectionIndex.value = firstInputSection.index;

      setCaretToSection(firstInputSection, 0);
    }
  };

  const handleBlur = () => {
    hasFocus.value = false;
  };

  const handleClick = () => {
    if (!inputRef.value) {
      return;
    }

    const clickPosition = inputRef.value.selectionStart ?? 0;

    const sectionCandidates = getSectionsAtPosition(clickPosition);
    const section = chooseBestSection(sectionCandidates);

    if (!section || section.type === 'fixed') {
      return;
    }

    const relativePosition = clickPosition - section.bounds[0];

    setCaretToSection(section, relativePosition);
  };

  watch(
    () => [props.mask, props.modelValue],
    () => {
      initializeSectionValues();
      updateMaskSections();
    },
    { immediate: true },
  );
</script>

<style scoped>
  .masked-text-container {
    display: flex;
    flex-direction: row;
    position: relative;
  }

  .masked-text-input {
    font-family: monospace;
    white-space: pre;
    padding: 0;
    margin: 0;
    font-size: 1rem;

    border: none;
    outline: none;
    flex-grow: 1;
    color: rgba(0, 0, 0, 0.1);
    caret-color: rgba(0, 0, 0, 1);
  }

  .masked-text-input:focus {
    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
  }

  .text-overlay {
    position: absolute;
    top: 0;
    left: 0;
    font-size: 1rem;
    pointer-events: none;

    padding: 0;
    border: none;
    outline: none;

    font-family: monospace;
    white-space: pre;
  }

  .text-overlay :deep(.input-mask-char-input) {
    color: rgba(0, 0, 0, 1);
  }
  .text-overlay :deep(.input-mask-char-mask) {
    color: rgba(0, 0, 0, 0.2);
  }
  .text-overlay :deep(.fixed-mask) {
    color: oklch(71.5% 0.143 215.221);
  }

  .masked-text-debug {
    font-size: 0.6rem;
  }
</style>
