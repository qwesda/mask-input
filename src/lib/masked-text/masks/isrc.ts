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

const countryCodeMaskFn = (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
  const sectionValue = values[sectionSlug] ?? [];
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

const registrantCodeMaskFn = (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
  const sectionValue = values[sectionSlug] ?? [];
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

const yearMaskFn = (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
  const sectionValue = values[sectionSlug] ?? [];
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

const designationMaskFn = (sectionSlug: string, values: Record<string, string[]>): MaskCharacter[] => {
  const sectionValue = values[sectionSlug] ?? [];
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

  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return [false, 'Country code must be 2 uppercase letters'];
  }

  if (!/^[A-Z0-9]{3}$/.test(registrantCode)) {
    return [false, 'Registrant code must be 3 alphanumeric characters'];
  }

  if (!/^[0-9]{2}$/.test(year)) {
    return [false, 'Year must be 2 digits'];
  }

  if (!/^[0-9]{5}$/.test(designation)) {
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

const allCountryCodes = [
  'AD',
  'AE',
  'AF',
  'AG',
  'AI',
  'AL',
  'AM',
  'AO',
  'AR',
  'AT',
  'AU',
  'AW',
  'AZ',
  'BA',
  'BB',
  'BC',
  'BD',
  'BE',
  'BF',
  'BG',
  'BH',
  'BI',
  'BJ',
  'BK',
  'BM',
  'BN',
  'BO',
  'BP',
  'BR',
  'BS',
  'BW',
  'BX',
  'BY',
  'BZ',
  'CA',
  'CB',
  'CD',
  'CF',
  'CG',
  'CH',
  'CI',
  'CL',
  'CM',
  'CN',
  'CO',
  'CP',
  'CS',
  'CU',
  'CV',
  'CW',
  'CY',
  'CZ',
  'DE',
  'DG',
  'DG',
  'DK',
  'DM',
  'DO',
  'DZ',
  'EC',
  'EE',
  'EG',
  'ES',
  'ET',
  'FI',
  'FJ',
  'FO',
  'FR',
  'FX',
  'GA',
  'GB',
  'GD',
  'GE',
  'GG',
  'GH',
  'GI',
  'GL',
  'GM',
  'GN',
  'GQ',
  'GR',
  'GT',
  'GW',
  'GX',
  'GY',
  'HK',
  'HN',
  'HR',
  'HT',
  'HU',
  'ID',
  'IE',
  'IL',
  'IM',
  'IN',
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
  'KM',
  'KN',
  'KR',
  'KS',
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
  'MA',
  'MC',
  'MD',
  'ME',
  'MF',
  'MG',
  'MK',
  'ML',
  'MM',
  'MN',
  'MO',
  'MP',
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
  'NE',
  'NG',
  'NI',
  'NL',
  'NO',
  'NP',
  'NZ',
  'OM',
  'PA',
  'PE',
  'PF',
  'PG',
  'PH',
  'PK',
  'PL',
  'PR',
  'PS',
  'PT',
  'PY',
  'QA',
  'QM',
  'QN',
  'QT',
  'QZ',
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
  'SI',
  'SK',
  'SL',
  'SM',
  'SN',
  'SO',
  'SR',
  'SS',
  'SV',
  'SX',
  'SY',
  'SZ',
  'TC',
  'TD',
  'TG',
  'TH',
  'TL',
  'TN',
  'TO',
  'TR',
  'TT',
  'TW',
  'TZ',
  'UA',
  'UG',
  'UK',
  'US',
  'UY',
  'UZ',
  'VC',
  'VE',
  'VG',
  'VN',
  'VU',
  'XK',
  'YE',
  'YU',
  'ZA',
  'ZB',
  'ZM',
  'ZW',
  'ZZ',
];

const countryCodeSpinFn = (
  direction: 'up' | 'down',
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
    const spinDirection = direction === 'up' ? 1 : -1;

    if (currentIndex === -1) {
      newValues[sectionSlug] = splitStringIntoGraphemes(allCountryCodes[0]);
    } else {
      let nextIndex = currentIndex + spinDirection;

      if (nextIndex < 0) {
        nextIndex = allCountryCodes.length - 1;
      } else if (nextIndex >= allCountryCodes.length) {
        nextIndex = 0;
      }

      newValues[sectionSlug] = splitStringIntoGraphemes(allCountryCodes[nextIndex]);
    }
  }

  return newValues;
};

const registrantCodeSpinFn = (
  direction: 'up' | 'down',
  values: Record<string, string[]>,
  sectionSlug: string,
  metaPressed: boolean,
  shiftPressed: boolean,
  altPressed: boolean,
): Record<string, string[]> => {
  const newValues = { ...values };

  if (sectionSlug === 'registrantCode') {
    const currentValue = newValues[sectionSlug]?.join('') || '';
    const currentIndex = currentValue ? Number.parseInt(currentValue, 36) : Number.NaN;
    const spinDirection = direction === 'up' ? 1 : -1;
    const spinAmount = (shiftPressed ? 36 : 1) * spinDirection;
    const maxAmount = Number.parseInt('ZZZ', 36);

    if (Number.isNaN(currentIndex)) {
      newValues[sectionSlug] = splitStringIntoGraphemes('000');
    } else {
      let nextCode = currentIndex + spinAmount;

      if (nextCode < 0) {
        nextCode = maxAmount;
      } else if (nextCode > maxAmount) {
        nextCode = 0;
      }

      const nextCodeStr = nextCode.toString(36).padStart(3, '0').toUpperCase();

      newValues[sectionSlug] = splitStringIntoGraphemes(nextCodeStr);
    }
  }

  return newValues;
};

const yearSpinFn = (
  direction: 'up' | 'down',
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
    const spinDirection = direction === 'up' ? 1 : -1;
    const spinAmount = (shiftPressed ? 10 : 1) * spinDirection;

    let newYear = currentYear + spinAmount;

    if (newYear > 99) {
      newYear = 0;
    } else if (newYear < 0) {
      newYear = 99;
    }

    const yearStr = newYear.toString().padStart(2, '0');
    newValues[sectionSlug] = splitStringIntoGraphemes(yearStr);
  }

  return newValues;
};

const designationSpinFn = (
  direction: 'up' | 'down',
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
    const spinDirection = direction === 'up' ? 1 : -1;
    const spinAmount = (shiftPressed ? 1000 : altPressed ? 100 : 1) * spinDirection;

    let newDesignation = currentDesignation + spinAmount;

    if (newDesignation > 99999) {
      newDesignation = newDesignation % 100000;
    } else if (newDesignation < 0) {
      newDesignation = 99999 + (newDesignation + 1);
    }

    const designationStr = newDesignation.toString().padStart(5, '0');
    newValues[sectionSlug] = splitStringIntoGraphemes(designationStr);
  }

  return newValues;
};

export const IsrcMask = (): MaskDefinition => {
  const sectionCountryCode = MaskSectionInput('countryCode', {
    maskingFn: countryCodeMaskFn,
    alignment: 'left',
    syntacticValidationFn: validationFnFromRegexString(`^[A-Za-z]{0,2}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[A-Za-z]$`),
    inputCharacterSubstitutionFn: countryCodeInputCharacterSubstitutionFn,
    maxLength: 2,
    spinFn: countryCodeSpinFn,
  });

  const sectionRegistrantCode = MaskSectionInput('registrantCode', {
    maskingFn: registrantCodeMaskFn,
    alignment: 'left',
    syntacticValidationFn: validationFnFromRegexString(`^[A-Za-z0-9]{0,3}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[A-Za-z0-9]$`),
    inputCharacterSubstitutionFn: registrantCodeInputCharacterSubstitutionFn,
    maxLength: 3,
    spinFn: registrantCodeSpinFn,
  });

  const sectionYear = MaskSectionInput('year', {
    maskingFn: yearMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,2}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 2,
    spinFn: yearSpinFn,
  });

  const sectionDesignation = MaskSectionInput('designation', {
    maskingFn: designationMaskFn,
    alignment: 'right',
    syntacticValidationFn: validationFnFromRegexString(`^[0-9]{0,5}$`),
    inputCharacterFilterFn: validationFnFromRegexString(`^[0-9]$`),
    maxLength: 5,
    spinFn: designationSpinFn,
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
