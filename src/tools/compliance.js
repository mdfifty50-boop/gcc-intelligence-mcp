/**
 * GCC Compliance & Regulatory Tools
 * Provides compliance checklists and regulatory deadline tracking.
 */

const complianceData = {
  SA: {
    name: 'Saudi Arabia',
    general: [
      { item: 'Commercial Registration (CR)', authority: 'Ministry of Commerce', mandatory: true },
      { item: 'ZATCA Tax Registration', authority: 'ZATCA', mandatory: true },
      { item: 'VAT Registration (if revenue > SAR 375K)', authority: 'ZATCA', mandatory: true, threshold: 375000 },
      { item: 'Chamber of Commerce Membership', authority: 'CoC', mandatory: true },
      { item: 'Municipal License', authority: 'Municipality', mandatory: true },
      { item: 'GOSI Registration (if employees)', authority: 'GOSI', mandatory: true },
      { item: 'Nitaqat Saudization Compliance', authority: 'HRSD', mandatory: true, note: 'Required for companies with 6+ employees' },
      { item: 'ZATCA E-Invoicing Phase 2', authority: 'ZATCA', mandatory: true, note: 'Rolling waves based on revenue' },
    ],
    labor: [
      { item: 'GOSI Social Insurance Registration', authority: 'GOSI', mandatory: true },
      { item: 'WPS Wage Protection System', authority: 'HRSD', mandatory: true },
      { item: 'Muqeem (Expatriate Management)', authority: 'MOI', mandatory: true },
      { item: 'Nitaqat Color Band Compliance', authority: 'HRSD', mandatory: true },
      { item: 'Musaned (Domestic Worker Management)', authority: 'HRSD', mandatory: false },
      { item: 'PDPL Privacy Compliance', authority: 'SDAIA', mandatory: true, note: 'Personal Data Protection Law effective Sep 2024' },
    ],
    tax: [
      { item: 'VAT Returns (Quarterly/Monthly)', authority: 'ZATCA', mandatory: true, frequency: 'quarterly' },
      { item: 'Withholding Tax Returns', authority: 'ZATCA', mandatory: true, note: 'For payments to non-residents' },
      { item: 'Zakat Returns', authority: 'ZATCA', mandatory: true, note: 'For Saudi/GCC-owned entities' },
      { item: 'Income Tax Returns', authority: 'ZATCA', mandatory: true, note: 'For foreign-owned entities' },
      { item: 'Transfer Pricing Documentation', authority: 'ZATCA', mandatory: true, note: 'For related-party transactions' },
    ],
  },
  AE: {
    name: 'United Arab Emirates',
    general: [
      { item: 'Trade License', authority: 'DED / Free Zone Authority', mandatory: true },
      { item: 'TRN (Tax Registration Number)', authority: 'FTA', mandatory: true },
      { item: 'Corporate Tax Registration', authority: 'FTA', mandatory: true, note: 'Penalties active since April 14, 2026' },
      { item: 'VAT Registration (if revenue > AED 375K)', authority: 'FTA', mandatory: true, threshold: 375000 },
      { item: 'Immigration Card', authority: 'MOHRE', mandatory: true },
      { item: 'Establishment Card', authority: 'MOHRE', mandatory: true },
    ],
    labor: [
      { item: 'MOHRE Registration', authority: 'MOHRE', mandatory: true },
      { item: 'WPS Wage Protection System', authority: 'MOHRE', mandatory: true },
      { item: 'Emiratisation Quota (if 20-49 employees)', authority: 'MOHRE', mandatory: true, note: '1 Emirati per company' },
      { item: 'Emiratisation 2% Annual Target (if 50+)', authority: 'MOHRE', mandatory: true },
      { item: 'End-of-Service Benefits Calculation', authority: 'MOHRE', mandatory: true },
      { item: 'Annual Leave Tracking', authority: 'MOHRE', mandatory: true, note: '30 days per year' },
    ],
    tax: [
      { item: 'Corporate Tax Return (Annual)', authority: 'FTA', mandatory: true, frequency: 'annual' },
      { item: 'VAT Returns (Quarterly)', authority: 'FTA', mandatory: true, frequency: 'quarterly' },
      { item: 'Small Business Relief Election', authority: 'FTA', mandatory: false, note: 'Available until Dec 31, 2026 for revenue < AED 3M' },
      { item: 'Transfer Pricing Master File', authority: 'FTA', mandatory: true, note: 'Revenue > AED 200M' },
      { item: 'Country-by-Country Reporting', authority: 'FTA', mandatory: true, note: 'Revenue > AED 3.15B' },
    ],
  },
  KW: {
    name: 'Kuwait',
    general: [
      { item: 'Commercial License', authority: 'MOCI', mandatory: true },
      { item: 'Kuwait Chamber of Commerce Registration', authority: 'KCC', mandatory: true },
      { item: 'Municipality License', authority: 'Municipality', mandatory: true },
      { item: 'PACI Civil ID (for owners)', authority: 'PACI', mandatory: true },
    ],
    labor: [
      { item: 'PIFSS Social Security Registration', authority: 'PIFSS', mandatory: true },
      { item: 'Kuwaitization Compliance', authority: 'CSC/PAM', mandatory: true, note: 'Sector-specific quotas' },
      { item: 'PAM Work Permits', authority: 'PAM', mandatory: true },
      { item: 'Indemnity (End of Service) Calculation', authority: 'PAM', mandatory: true },
    ],
    tax: [
      { item: 'KFAS (Kuwait Foundation for Advancement of Sciences)', authority: 'KFAS', mandatory: true, note: '1% of net profit for Kuwaiti shareholding companies' },
      { item: 'NLST (National Labour Support Tax)', authority: 'MOF', mandatory: true, note: '2.5% of net profit for listed companies' },
      { item: 'Zakat', authority: 'MOF', mandatory: true, note: '1% of net profit for Kuwaiti shareholding companies' },
      { item: 'Corporate Income Tax (foreign entities)', authority: 'MOF', mandatory: true, note: '15% flat rate for foreign entities' },
    ],
  },
  BH: {
    name: 'Bahrain',
    general: [
      { item: 'Commercial Registration', authority: 'MOIC', mandatory: true },
      { item: 'Municipality License', authority: 'Municipality', mandatory: true },
      { item: 'VAT Registration', authority: 'NBR', mandatory: true, threshold: 37700, note: 'Mandatory if supplies > BHD 37,700' },
    ],
    labor: [
      { item: 'SIO Social Insurance Registration', authority: 'SIO', mandatory: true },
      { item: 'Bahranisation Compliance', authority: 'LMRA', mandatory: true },
      { item: 'LMRA Work Permits', authority: 'LMRA', mandatory: true },
    ],
    tax: [
      { item: 'VAT Returns', authority: 'NBR', mandatory: true, frequency: 'quarterly' },
      { item: 'No Corporate Income Tax', authority: 'N/A', mandatory: false, note: 'Bahrain has no CIT except for oil & gas (46%)' },
    ],
  },
  OM: {
    name: 'Oman',
    general: [
      { item: 'Commercial Registration', authority: 'MOCI', mandatory: true },
      { item: 'VAT Registration', authority: 'Tax Authority', mandatory: true, threshold: 38500, note: 'Mandatory if revenue > OMR 38,500' },
      { item: 'Municipal License', authority: 'Municipality', mandatory: true },
    ],
    labor: [
      { item: 'PASI Social Insurance', authority: 'PASI', mandatory: true },
      { item: 'Omanisation Compliance', authority: 'MOL', mandatory: true },
    ],
    tax: [
      { item: 'Corporate Income Tax Return', authority: 'Tax Authority', mandatory: true, note: '15% standard rate' },
      { item: 'VAT Returns', authority: 'Tax Authority', mandatory: true, frequency: 'quarterly' },
    ],
  },
  QA: {
    name: 'Qatar',
    general: [
      { item: 'Commercial Registration', authority: 'MOCI', mandatory: true },
      { item: 'Municipality License', authority: 'Municipality', mandatory: true },
      { item: 'QFC License (if in QFC)', authority: 'QFC', mandatory: false },
    ],
    labor: [
      { item: 'WPS Wage Protection', authority: 'MADLSA', mandatory: true },
      { item: 'Qatarisation Compliance', authority: 'MADLSA', mandatory: true },
    ],
    tax: [
      { item: 'Corporate Income Tax Return', authority: 'GTA', mandatory: true, note: '10% on foreign-owned profits' },
      { item: 'No VAT', authority: 'N/A', mandatory: false, note: 'Qatar has not implemented VAT' },
    ],
  },
};

const deadlinesData = [
  // ZATCA
  { country: 'SA', category: 'tax', title: 'ZATCA Wave 24 Integration Deadline', date: '2026-06-30', severity: 'HIGH', description: 'Businesses with SAR 375K+ annual revenue must integrate with FATOORA platform', penalties: 'Warning → SAR 1K → 5K → 10K → 40K (progressive)' },
  { country: 'SA', category: 'tax', title: 'ZATCA VAT Return (Q2 2026)', date: '2026-07-31', severity: 'MEDIUM', description: 'Quarterly VAT return deadline for Q2 2026' },
  { country: 'SA', category: 'compliance', title: 'PDPL Full Enforcement', date: '2026-09-14', severity: 'HIGH', description: 'Personal Data Protection Law fully enforceable with penalties' },

  // UAE
  { country: 'AE', category: 'tax', title: 'UAE Corporate Tax Registration', date: '2026-04-14', severity: 'CRITICAL', description: 'Late registration penalties NOW ACTIVE', penalties: 'AED 10,000 one-time' },
  { country: 'AE', category: 'tax', title: 'UAE E-Invoicing Pilot', date: '2026-07-01', severity: 'MEDIUM', description: 'Peppol-based e-invoicing pilot begins', penalties: 'None during pilot' },
  { country: 'AE', category: 'tax', title: 'UAE Small Business Relief Expires', date: '2026-12-31', severity: 'HIGH', description: 'Businesses under AED 3M lose 0% CT rate', penalties: 'Standard 9% CT applies' },
  { country: 'AE', category: 'labor', title: 'Emiratisation H2 2026 Target', date: '2026-12-31', severity: 'HIGH', description: '2% Emiratisation increase target for 50+ employee companies', penalties: 'AED 72,000 per missing Emirati' },

  // Kuwait
  { country: 'KW', category: 'tax', title: 'KFAS/NLST/Zakat Annual Filing', date: '2026-06-30', severity: 'MEDIUM', description: 'Annual filing deadline for Kuwaiti companies' },

  // Regional
  { country: 'SA', category: 'compliance', title: 'EU AI Act Traceability (for EU-serving)', date: '2026-08-01', severity: 'MEDIUM', description: 'EU AI Act requirements for companies serving EU customers' },
];

/**
 * Get compliance checklist for a country and business type
 */
export async function getComplianceChecklist({ country, business_type, industry, employee_count }) {
  const data = complianceData[country];
  if (!data) {
    return { content: [{ type: 'text', text: JSON.stringify({ error: `No data for country: ${country}` }) }] };
  }

  const checklist = {
    country: data.name,
    country_code: country,
    business_type,
    employee_count,
    industry,
    categories: {},
    total_items: 0,
    mandatory_items: 0,
  };

  for (const [category, items] of Object.entries(data)) {
    if (category === 'name') continue;

    const filtered = items.filter(item => {
      // Filter by relevance
      if (item.threshold && business_type === 'sole_proprietor') return true; // Show threshold info
      return true;
    });

    checklist.categories[category] = filtered.map(item => ({
      ...item,
      status: 'NEEDS_REVIEW',
      applicable: item.mandatory,
    }));

    checklist.total_items += filtered.length;
    checklist.mandatory_items += filtered.filter(i => i.mandatory).length;
  }

  // Add employee-specific items
  if (employee_count) {
    if (country === 'SA' && employee_count >= 6) {
      checklist.notes = checklist.notes || [];
      checklist.notes.push(`With ${employee_count} employees, Nitaqat Saudization requirements apply. Check your sector's minimum Saudi ratio.`);
    }
    if (country === 'AE' && employee_count >= 50) {
      checklist.notes = checklist.notes || [];
      checklist.notes.push(`With ${employee_count} employees, you must achieve 2% annual Emiratisation increase. Penalty: AED 72,000/missing Emirati.`);
    }
  }

  return { content: [{ type: 'text', text: JSON.stringify(checklist, null, 2) }] };
}

/**
 * Get upcoming regulatory deadlines
 */
export async function getDeadlines({ countries, categories, days_ahead }) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + days_ahead * 24 * 60 * 60 * 1000);

  const filtered = deadlinesData.filter(d => {
    const deadlineDate = new Date(d.date);
    if (deadlineDate > cutoff) return false;
    if (!countries.includes(d.country)) return false;
    if (categories && !categories.includes(d.category)) return false;
    return true;
  }).map(d => {
    const deadlineDate = new Date(d.date);
    const daysRemaining = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    return {
      ...d,
      days_remaining: daysRemaining,
      overdue: daysRemaining < 0,
      urgency: daysRemaining < 0 ? 'OVERDUE' : daysRemaining <= 7 ? 'URGENT' : daysRemaining <= 30 ? 'SOON' : 'UPCOMING',
    };
  }).sort((a, b) => a.days_remaining - b.days_remaining);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        as_of: now.toISOString().split('T')[0],
        looking_ahead_days: days_ahead,
        countries,
        total_deadlines: filtered.length,
        overdue: filtered.filter(d => d.overdue).length,
        urgent: filtered.filter(d => d.urgency === 'URGENT').length,
        deadlines: filtered,
      }, null, 2),
    }],
  };
}
