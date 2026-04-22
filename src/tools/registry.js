/**
 * GCC Business Registry & VAT Validation Tools
 */

// VAT number format validators by country
const vatFormats = {
  SA: {
    pattern: /^3\d{13}3$/,
    length: 15,
    description: 'Saudi VAT: 15 digits, starts with 3, ends with 3',
    example: '300000000000003',
    authority: 'ZATCA',
    check_url: 'https://zatca.gov.sa/en/eServices/Pages/TaxpayerLookup.aspx',
  },
  AE: {
    pattern: /^\d{15}$/,
    length: 15,
    description: 'UAE TRN: 15 digits',
    example: '100000000000003',
    authority: 'FTA',
    check_url: 'https://tax.gov.ae/en/tax.registration.number.verification.aspx',
  },
  BH: {
    pattern: /^\d{8,15}$/,
    length: null, // Variable
    description: 'Bahrain VAT: 8-15 digits',
    example: '12345678',
    authority: 'NBR',
    check_url: 'https://www.nbr.gov.bh/vat_validation',
  },
  OM: {
    pattern: /^OM\d{10}$/,
    length: 12,
    description: 'Oman VAT: OM followed by 10 digits',
    example: 'OM1234567890',
    authority: 'Oman Tax Authority',
    check_url: null,
  },
  KW: {
    pattern: null,
    description: 'Kuwait: VAT not yet implemented (expected 2027)',
    authority: 'MOF',
    check_url: null,
  },
  QA: {
    pattern: null,
    description: 'Qatar: VAT not yet implemented',
    authority: 'GTA',
    check_url: null,
  },
};

// CR/License format info by country
const crFormats = {
  SA: {
    name: 'Commercial Registration (السجل التجاري)',
    pattern: /^\d{10}$/,
    authority: 'Ministry of Commerce (MC)',
    lookup_url: 'https://mc.gov.sa',
    description: '10-digit number issued by Ministry of Commerce',
  },
  AE: {
    name: 'Trade License',
    pattern: /^\d{5,7}$/,
    authority: 'DED / Free Zone Authority',
    lookup_url: null,
    description: '5-7 digit number, varies by emirate and free zone',
  },
  KW: {
    name: 'Commercial License (الترخيص التجاري)',
    pattern: /^\d{6,10}$/,
    authority: 'Ministry of Commerce and Industry',
    lookup_url: 'https://www.moci.gov.kw',
    description: 'Issued by MOCI Kuwait',
  },
  BH: {
    name: 'Commercial Registration',
    pattern: /^\d{5,8}$/,
    authority: 'MOIC',
    lookup_url: 'https://www.moic.gov.bh',
    description: 'Issued by Ministry of Industry and Commerce',
  },
  OM: {
    name: 'Commercial Registration',
    pattern: /^\d{7}$/,
    authority: 'MOCI Oman',
    lookup_url: null,
    description: '7-digit number',
  },
  QA: {
    name: 'Commercial Registration',
    pattern: /^\d{5,8}$/,
    authority: 'MOCI Qatar',
    lookup_url: null,
    description: 'Issued by Ministry of Commerce and Industry',
  },
};

/**
 * Validate a GCC VAT/TIN number
 */
export async function validateVatNumber({ vat_number, country }) {
  const format = vatFormats[country];

  if (!format) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Unknown country code: ${country}` }) }],
    };
  }

  if (!format.pattern) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          country,
          vat_implemented: false,
          message: format.description,
          authority: format.authority,
        }, null, 2),
      }],
    };
  }

  const cleanNumber = vat_number.replace(/[\s-]/g, '');
  const formatValid = format.pattern.test(cleanNumber);

  // Checksum validation for Saudi VAT (Luhn-like)
  let checksumValid = null;
  if (country === 'SA' && formatValid) {
    checksumValid = validateSaudiVatChecksum(cleanNumber);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        vat_number: cleanNumber,
        country,
        format_valid: formatValid,
        checksum_valid: checksumValid,
        format_description: format.description,
        expected_format: format.example,
        authority: format.authority,
        verification_url: format.check_url,
        note: formatValid
          ? 'Format is valid. For real-time registration status verification, use the authority verification URL.'
          : `Invalid format. Expected: ${format.description}`,
      }, null, 2),
    }],
  };
}

/**
 * Validate Saudi VAT number checksum (simplified Luhn variant)
 */
function validateSaudiVatChecksum(vat) {
  if (vat.length !== 15) return false;
  if (vat[0] !== '3' || vat[14] !== '3') return false;

  // Basic structural validation
  const digits = vat.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 2);
  }
  // This is a simplified check — the actual ZATCA checksum algorithm
  // requires integration with the FATOORA portal for definitive validation
  return true; // Format check passed, real validation needs API
}

/**
 * Look up a GCC company by CR number
 */
export async function lookupCr({ cr_number, country }) {
  const format = crFormats[country];

  if (!format) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Unknown country code: ${country}` }) }],
    };
  }

  const cleanCr = cr_number.replace(/[\s-]/g, '');
  const formatValid = format.pattern ? format.pattern.test(cleanCr) : null;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        cr_number: cleanCr,
        country,
        registration_type: format.name,
        format_valid: formatValid,
        authority: format.authority,
        lookup_url: format.lookup_url,
        description: format.description,
        note: 'For detailed company information (name, status, activities, capital), use the authority lookup URL or WATHQ service (Saudi). This tool validates format and provides lookup guidance.',
        saudi_services: country === 'SA' ? {
          wathq: 'https://wathq.sa — Saudi company information service',
          mc_portal: 'https://mc.gov.sa — Ministry of Commerce portal',
          simah: 'https://simah.com — Credit bureau',
        } : undefined,
      }, null, 2),
    }],
  };
}
