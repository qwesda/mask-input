import type { MaskCharacter, MaskDefinition, MaskSectionDefinition } from '../base/types';
import { MaskSectionFixed, MaskSectionInput, validationFnFromRegexString } from '../base/index';
import { splitStringIntoGraphemes } from '../base/helper';

const isrcEncodeValidatedValue = (values: Record<string, string[]>): string | undefined => {
  const countryCode = (values['countryCode'] ?? []).join('');
  const registrantCode = (values['registrantCode'] ?? []).join('');
  const year = (values['year'] ?? []).join('');
  const designation = (values['designation'] ?? []).join('');

  if (!countryCode || !registrantCode || !year || !designation) {
    return undefined;
  }

  return `${countryCode}-${registrantCode}-${year}-${designation}`;
};

const countryCodeMaskFn = (sectionValue: string[]): MaskCharacter[] => {
  const ret: MaskCharacter[] = [];

  if (sectionValue.length === 0) {
    return [
      { char: 'C', type: 'mask' as const },
      { char: 'C', type: 'mask' as const },
    ];
  }

  for (const char of sectionValue) {
    ret.push({ char: char.toUpperCase(), type: 'value' as const });
  }

  for (let i = 0; i < Math.max(2 - sectionValue.length, 0); i++) {
    ret.push({ char: 'C', type: 'mask' as const });
  }

  return ret;
};

const registrantCodeMaskFn = (sectionValue: string[]): MaskCharacter[] => {
  const ret: MaskCharacter[] = [];

  if (sectionValue.length === 0) {
    return [
      { char: 'X', type: 'mask' as const },
      { char: 'X', type: 'mask' as const },
      { char: 'X', type: 'mask' as const },
    ];
  }

  for (const char of sectionValue) {
    ret.push({ char: char.toUpperCase(), type: 'value' as const });
  }

  for (let i = 0; i < Math.max(3 - sectionValue.length, 0); i++) {
    ret.push({ char: 'X', type: 'mask' as const });
  }

  return ret;
};

const yearMaskFn = (sectionValue: string[]): MaskCharacter[] => {
  const ret: MaskCharacter[] = [];

  if (sectionValue.length === 0) {
    return [
      { char: 'Y', type: 'mask' as const },
      { char: 'Y', type: 'mask' as const },
    ];
  }

  for (let i = 0; i < Math.max(2 - sectionValue.length, 0); i++) {
    ret.push({ char: '0', type: 'mask' as const });
  }

  for (const char of sectionValue) {
    ret.push({ char, type: 'value' as const });
  }

  return ret;
};

const designationMaskFn = (sectionValue: string[]): MaskCharacter[] => {
  const ret: MaskCharacter[] = [];

  if (sectionValue.length === 0) {
    return [
      { char: 'N', type: 'mask' as const },
      { char: 'N', type: 'mask' as const },
      { char: 'N', type: 'mask' as const },
      { char: 'N', type: 'mask' as const },
      { char: 'N', type: 'mask' as const },
    ];
  }

  for (let i = 0; i < Math.max(5 - sectionValue.length, 0); i++) {
    ret.push({ char: '0', type: 'mask' as const });
  }

  for (const char of sectionValue) {
    ret.push({ char, type: 'value' as const });
  }

  return ret;
};

const isrcSemanticValidationFn = (values: Record<string, string[]>): [boolean, string] => {
  const countryCode = (values['countryCode'] ?? []).join('');
  const registrantCode = (values['registrantCode'] ?? []).join('');
  const year = (values['year'] ?? []).join('');
  const designation = (values['designation'] ?? []).join('');

  if (!countryCode || !registrantCode || !year || !designation) {
    return [true, ''];
  }

  // Validate country code (2 letters)
  if (countryCode.length !== 2 || !/^[A-Z]{2}$/.test(countryCode)) {
    return [false, 'Country code must be 2 uppercase letters'];
  }

  // Validate registrant code (3 alphanumeric characters)
  if (registrantCode.length !== 3 || !/^[A-Z0-9]{3}$/.test(registrantCode)) {
    return [false, 'Registrant code must be 3 alphanumeric characters'];
  }

  // Validate year (2 digits, should be reasonable)
  const yearNum = parseInt(year, 10);
  if (year.length !== 2 || isNaN(yearNum)) {
    return [false, 'Year must be 2 digits'];
  }

  // Validate designation (5 digits)
  if (designation.length !== 5 || !/^[0-9]{5}$/.test(designation)) {
    return [false, 'Designation must be 5 digits'];
  }

  return [true, ''];
};

const countryCodeInputCharacterSubstitutionFn = (char: string): string => {
  return char.toUpperCase();
};

const registrantCodeInputCharacterSubstitutionFn = (char: string): string => {
  return char.toUpperCase();
};

// Data sets for spinning through ISRC components
const allCountryCodes = [
  'AD',
  'AE',
  'AF',
  'AG',
  'AI',
  'AL',
  'AM',
  'AO',
  'AQ',
  'AR',
  'AS',
  'AT',
  'AU',
  'AW',
  'AX',
  'AZ',
  'BA',
  'BB',
  'BD',
  'BE',
  'BF',
  'BG',
  'BH',
  'BI',
  'BJ',
  'BL',
  'BM',
  'BN',
  'BO',
  'BQ',
  'BR',
  'BS',
  'BT',
  'BV',
  'BW',
  'BY',
  'BZ',
  'CA',
  'CC',
  'CD',
  'CF',
  'CG',
  'CH',
  'CI',
  'CK',
  'CL',
  'CM',
  'CN',
  'CO',
  'CR',
  'CU',
  'CV',
  'CW',
  'CX',
  'CY',
  'CZ',
  'DE',
  'DJ',
  'DK',
  'DM',
  'DO',
  'DZ',
  'EC',
  'EE',
  'EG',
  'EH',
  'ER',
  'ES',
  'ET',
  'FI',
  'FJ',
  'FK',
  'FM',
  'FO',
  'FR',
  'GA',
  'GB',
  'GD',
  'GE',
  'GF',
  'GG',
  'GH',
  'GI',
  'GL',
  'GM',
  'GN',
  'GP',
  'GQ',
  'GR',
  'GS',
  'GT',
  'GU',
  'GW',
  'GY',
  'HK',
  'HM',
  'HN',
  'HR',
  'HT',
  'HU',
  'ID',
  'IE',
  'IL',
  'IM',
  'IN',
  'IO',
  'IQ',
  'IR',
  'IS',
  'IT',
  'JE',
  'JM',
  'JO',
  'JP',
  'KE',
  'KG',
  'KH',
  'KI',
  'KM',
  'KN',
  'KP',
  'KR',
  'KW',
  'KY',
  'KZ',
  'LA',
  'LB',
  'LC',
  'LI',
  'LK',
  'LR',
  'LS',
  'LT',
  'LU',
  'LV',
  'LY',
  'MA',
  'MC',
  'MD',
  'ME',
  'MF',
  'MG',
  'MH',
  'MK',
  'ML',
  'MM',
  'MN',
  'MO',
  'MP',
  'MQ',
  'MR',
  'MS',
  'MT',
  'MU',
  'MV',
  'MW',
  'MX',
  'MY',
  'MZ',
  'NA',
  'NC',
  'NE',
  'NF',
  'NG',
  'NI',
  'NL',
  'NO',
  'NP',
  'NR',
  'NU',
  'NZ',
  'OM',
  'PA',
  'PE',
  'PF',
  'PG',
  'PH',
  'PK',
  'PL',
  'PM',
  'PN',
  'PR',
  'PS',
  'PT',
  'PW',
  'PY',
  'QA',
  'RE',
  'RO',
  'RS',
  'RU',
  'RW',
  'SA',
  'SB',
  'SC',
  'SD',
  'SE',
  'SG',
  'SH',
  'SI',
  'SJ',
  'SK',
  'SL',
  'SM',
  'SN',
  'SO',
  'SR',
  'SS',
  'ST',
  'SV',
  'SX',
  'SY',
  'SZ',
  'TC',
  'TD',
  'TF',
  'TG',
  'TH',
  'TJ',
  'TK',
  'TL',
  'TM',
  'TN',
  'TO',
  'TR',
  'TT',
  'TV',
  'TW',
  'TZ',
  'UA',
  'UG',
  'UM',
  'US',
  'UY',
  'UZ',
  'VA',
  'VC',
  'VE',
  'VG',
  'VI',
  'VN',
  'VU',
  'WF',
  'WS',
  'YE',
  'YT',
  'ZA',
  'ZM',
  'ZW',
];

// Helper functions for dynamic registrant code cycling
const registrantCodeToIndex = (code: string): number => {
  if (code.length !== 3) return 0;

  const letter = code.charCodeAt(0) - 65; // A=0, B=1, etc.
  const number = parseInt(code.slice(1), 10);

  if (letter < 0 || letter > 25 || isNaN(number) || number < 0 || number > 99) {
    return 0; // Default to A00 if invalid
  }

  return letter * 100 + number; // A00=0, A01=1, ..., A99=99, B00=100, etc.
};

const indexToRegistrantCode = (index: number): string => {
  const totalCodes = 26 * 100; // A00-Z99 = 2600 total codes
  const normalizedIndex = ((index % totalCodes) + totalCodes) % totalCodes; // Handle negative wrap

  const letter = Math.floor(normalizedIndex / 100);
  const number = normalizedIndex % 100;

  return String.fromCharCode(65 + letter) + number.toString().padStart(2, '0');
};

// Spin functions for country code
const countryCodeSpinUpFn = () => {
  return (
    values: Record<string, string[]>,
    sectionSlug: string,
    metaPressed: boolean,
    shiftPressed: boolean,
    altPressed: boolean,
  ): Record<string, string[]> => {
    const newValues = { ...values };

    if (sectionSlug === 'countryCode') {
      const currentValue = newValues[sectionSlug]?.join('') || '';
      const currentIndex = allCountryCodes.indexOf(currentValue);

      if (currentIndex === -1) {
        // If current value is not in the list, start with first item
        newValues[sectionSlug] = splitStringIntoGraphemes(allCountryCodes[0]);
      } else {
        // Move to next item, wrap around to beginning
        const nextIndex = (currentIndex + 1) % allCountryCodes.length;
        newValues[sectionSlug] = splitStringIntoGraphemes(allCountryCodes[nextIndex]);
      }
    }

    return newValues;
  };
};

const countryCodeSpinDownFn = () => {
  return (
    values: Record<string, string[]>,
    sectionSlug: string,
    metaPressed: boolean,
    shiftPressed: boolean,
    altPressed: boolean,
  ): Record<string, string[]> => {
    const newValues = { ...values };

    if (sectionSlug === 'countryCode') {
      const currentValue = newValues[sectionSlug]?.join('') || '';
      const currentIndex = allCountryCodes.indexOf(currentValue);

      if (currentIndex === -1) {
        // If current value is not in the list, start with last item
        newValues[sectionSlug] = splitStringIntoGraphemes(allCountryCodes[allCountryCodes.length - 1]);
      } else {
        // Move to previous item, wrap around to end
        const prevIndex = currentIndex === 0 ? allCountryCodes.length - 1 : currentIndex - 1;
        newValues[sectionSlug] = splitStringIntoGraphemes(allCountryCodes[prevIndex]);
      }
    }

    return newValues;
  };
};

// Spin functions for registrant code
const registrantCodeSpinUpFn = () => {
  return (
    values: Record<string, string[]>,
    sectionSlug: string,
    metaPressed: boolean,
    shiftPressed: boolean,
    altPressed: boolean,
  ): Record<string, string[]> => {
    const newValues = { ...values };

    if (sectionSlug === 'registrantCode') {
      const currentValue = newValues[sectionSlug]?.join('') || '';
      const currentIndex = currentValue ? registrantCodeToIndex(currentValue) : -1;
      const spinAmount = shiftPressed ? 100 : 1; // Jump by 100 positions (next letter) when shift is pressed

      if (currentIndex === -1) {
        // If current value is invalid or empty, start with A00
        newValues[sectionSlug] = splitStringIntoGraphemes('A00');
      } else {
        // Move to next code
        const nextCode = indexToRegistrantCode(currentIndex + spinAmount);
        newValues[sectionSlug] = splitStringIntoGraphemes(nextCode);
      }
    }

    return newValues;
  };
};

const registrantCodeSpinDownFn = () => {
  return (
    values: Record<string, string[]>,
    sectionSlug: string,
    metaPressed: boolean,
    shiftPressed: boolean,
    altPressed: boolean,
  ): Record<string, string[]> => {
    const newValues = { ...values };

    if (sectionSlug === 'registrantCode') {
      const currentValue = newValues[sectionSlug]?.join('') || '';
      const currentIndex = currentValue ? registrantCodeToIndex(currentValue) : -1;
      const spinAmount = shiftPressed ? 100 : 1; // Jump by 100 positions (previous letter) when shift is pressed

      if (currentIndex === -1) {
        // If current value is invalid or empty, start with Z99
        newValues[sectionSlug] = splitStringIntoGraphemes('Z99');
      } else {
        // Move to previous code
        const prevCode = indexToRegistrantCode(currentIndex - spinAmount);
        newValues[sectionSlug] = splitStringIntoGraphemes(prevCode);
      }
    }

    return newValues;
  };
};

// Spin functions for year
const yearSpinUpFn = () => {
  return (
    values: Record<string, string[]>,
    sectionSlug: string,
    metaPressed: boolean,
    shiftPressed: boolean,
    altPressed: boolean,
  ): Record<string, string[]> => {
    const newValues = { ...values };

    if (sectionSlug === 'year') {
      const currentValue = newValues[sectionSlug]?.join('') || '';
      const currentYear = currentValue ? parseInt(currentValue, 10) : new Date().getFullYear() % 100;
      const spinAmount = shiftPressed ? 10 : 1;

      let newYear = currentYear + spinAmount;
      if (newYear > 99) newYear = 0; // Wrap around for 2-digit years

      const yearStr = newYear.toString().padStart(2, '0');
      newValues[sectionSlug] = splitStringIntoGraphemes(yearStr);
    }

    return newValues;
  };
};

const yearSpinDownFn = () => {
  return (
    values: Record<string, string[]>,
    sectionSlug: string,
    metaPressed: boolean,
    shiftPressed: boolean,
    altPressed: boolean,
  ): Record<string, string[]> => {
    const newValues = { ...values };

    if (sectionSlug === 'year') {
      const currentValue = newValues[sectionSlug]?.join('') || '';
      const currentYear = currentValue ? parseInt(currentValue, 10) : new Date().getFullYear() % 100;
      const spinAmount = shiftPressed ? 10 : 1;

      let newYear = currentYear - spinAmount;
      if (newYear < 0) newYear = 99; // Wrap around for 2-digit years

      const yearStr = newYear.toString().padStart(2, '0');
      newValues[sectionSlug] = splitStringIntoGraphemes(yearStr);
    }

    return newValues;
  };
};

// Spin functions for designation
const designationSpinUpFn = () => {
  return (
    values: Record<string, string[]>,
    sectionSlug: string,
    metaPressed: boolean,
    shiftPressed: boolean,
    altPressed: boolean,
  ): Record<string, string[]> => {
    const newValues = { ...values };

    if (sectionSlug === 'designation') {
      const currentValue = newValues[sectionSlug]?.join('') || '';
      const currentDesignation = currentValue ? parseInt(currentValue, 10) : 0;
      const spinAmount = shiftPressed ? 1000 : altPressed ? 100 : 1;

      let newDesignation = currentDesignation + spinAmount;
      if (newDesignation > 99999) newDesignation = newDesignation % 100000; // Keep within 5 digits

      const designationStr = newDesignation.toString().padStart(5, '0');
      newValues[sectionSlug] = splitStringIntoGraphemes(designationStr);
    }

    return newValues;
  };
};

const designationSpinDownFn = () => {
  return (
    values: Record<string, string[]>,
    sectionSlug: string,
    metaPressed: boolean,
    shiftPressed: boolean,
    altPressed: boolean,
  ): Record<string, string[]> => {
    const newValues = { ...values };

    if (sectionSlug === 'designation') {
      const currentValue = newValues[sectionSlug]?.join('') || '';
      const currentDesignation = currentValue ? parseInt(currentValue, 10) : 0;
      const spinAmount = shiftPressed ? 1000 : altPressed ? 100 : 1;

      let newDesignation = currentDesignation - spinAmount;
      if (newDesignation < 0) newDesignation = 99999 + (newDesignation + 1); // Wrap around

      const designationStr = newDesignation.toString().padStart(5, '0');
      newValues[sectionSlug] = splitStringIntoGraphemes(designationStr);
    }

    return newValues;
  };
};

export const IsrcMask = (): MaskDefinition => {
  const sectionCountryCode = MaskSectionInput('countryCode', {
    maskingFn: countryCodeMaskFn,
    alignment: 'left',
    syntacticValidationFn: validationFnFromRegexString(`^[A-Za-z]{0,2}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[A-Za-z]$`),
    inputCharacterSubstitutionFn: countryCodeInputCharacterSubstitutionFn,
    maxLength: 2,
    spinUpFn: countryCodeSpinUpFn(),
    spinDownFn: countryCodeSpinDownFn(),
  });

  const sectionRegistrantCode = MaskSectionInput('registrantCode', {
    maskingFn: registrantCodeMaskFn,
    alignment: 'left',
    syntacticValidationFn: validationFnFromRegexString(`^[A-Za-z0-9]{0,3}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[A-Za-z0-9]$`),
    inputCharacterSubstitutionFn: registrantCodeInputCharacterSubstitutionFn,
    maxLength: 3,
    spinUpFn: registrantCodeSpinUpFn(),
    spinDownFn: registrantCodeSpinDownFn(),
  });

  const sectionYear = MaskSectionInput('year', {
    maskingFn: yearMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,2}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 2,
    spinUpFn: yearSpinUpFn(),
    spinDownFn: yearSpinDownFn(),
  });

  const sectionDesignation = MaskSectionInput('designation', {
    maskingFn: designationMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,5}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 5,
    spinUpFn: designationSpinUpFn(),
    spinDownFn: designationSpinDownFn(),
  });

  const skipKeys = ['-', ' '];
  const sections: MaskSectionDefinition[] = [
    sectionCountryCode,
    MaskSectionFixed('-', skipKeys),
    sectionRegistrantCode,
    MaskSectionFixed('-', skipKeys),
    sectionYear,
    MaskSectionFixed('-', skipKeys),
    sectionDesignation,
  ];

  return {
    encodeValidatedValue: isrcEncodeValidatedValue,
    semanticValidationFn: isrcSemanticValidationFn,
    sections,
  };
};
