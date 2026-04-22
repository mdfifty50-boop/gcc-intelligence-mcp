#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { generateZatcaXml } from './tools/zatca.js';
import { validateVatNumber, lookupCr } from './tools/registry.js';
import { analyzeArabicText, extractEntities } from './tools/arabic-nlp.js';
import { getComplianceChecklist, getDeadlines } from './tools/compliance.js';
import { convertCurrency, getExchangeRates } from './tools/currency.js';

const server = new McpServer({
  name: 'gcc-intelligence-mcp',
  version: '0.1.0',
  description: 'GCC regulatory intelligence, ZATCA e-invoicing, Arabic NLP, and compliance tools for AI agents',
});

// ═══════════════════════════════════════════
// ZATCA E-INVOICING TOOLS
// ═══════════════════════════════════════════

server.tool(
  'zatca_generate_invoice_xml',
  'Generate ZATCA-compliant e-invoice XML (UBL 2.1) with QR code data. Supports both simplified and standard invoices per ZATCA Phase 2 requirements.',
  {
    invoice_type: z.enum(['simplified', 'standard']).describe('Simplified (B2C) or Standard (B2B) invoice'),
    seller_name: z.string().describe('Seller business name in Arabic or English'),
    seller_vat: z.string().regex(/^3\d{13}3$/).describe('Seller VAT registration number (15 digits, starts and ends with 3)'),
    buyer_name: z.string().optional().describe('Buyer name (required for standard invoices)'),
    buyer_vat: z.string().optional().describe('Buyer VAT number (required for standard invoices)'),
    invoice_number: z.string().describe('Unique invoice reference number'),
    issue_date: z.string().describe('Invoice date in YYYY-MM-DD format'),
    line_items: z.array(z.object({
      description: z.string(),
      quantity: z.number().positive(),
      unit_price: z.number().positive(),
      vat_rate: z.number().min(0).max(100).describe('VAT rate as percentage (e.g., 15 for 15%)'),
      discount: z.number().min(0).default(0).describe('Line item discount amount'),
    })).min(1).describe('Invoice line items'),
    currency: z.enum(['SAR', 'USD', 'AED', 'KWD', 'BHD', 'OMR', 'QAR']).default('SAR'),
    note: z.string().optional().describe('Optional invoice note'),
  },
  async (params) => generateZatcaXml(params)
);

server.tool(
  'zatca_validate_invoice',
  'Validate an existing invoice against ZATCA Phase 2 requirements. Returns compliance status and any violations.',
  {
    xml_content: z.string().describe('The invoice XML content to validate'),
    phase: z.enum(['1', '2']).default('2').describe('ZATCA phase to validate against'),
  },
  async ({ xml_content, phase }) => {
    // Validation logic
    const issues = [];

    // Check required ZATCA fields
    if (!xml_content.includes('cbc:ID')) issues.push('Missing invoice ID (cbc:ID)');
    if (!xml_content.includes('cbc:IssueDate')) issues.push('Missing issue date');
    if (!xml_content.includes('cac:AccountingSupplierParty')) issues.push('Missing seller information');
    if (!xml_content.includes('cbc:TaxAmount')) issues.push('Missing tax amount');

    if (phase === '2') {
      if (!xml_content.includes('cbc:UUID')) issues.push('Phase 2: Missing UUID');
      if (!xml_content.includes('cac:Signature')) issues.push('Phase 2: Missing digital signature');
      if (!xml_content.includes('cbc:ProfileID')) issues.push('Phase 2: Missing profile ID');
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          valid: issues.length === 0,
          phase,
          issues,
          checked_fields: ['ID', 'IssueDate', 'AccountingSupplierParty', 'TaxAmount', ...(phase === '2' ? ['UUID', 'Signature', 'ProfileID'] : [])],
        }, null, 2),
      }],
    };
  }
);

server.tool(
  'zatca_get_wave_status',
  'Get current ZATCA e-invoicing wave status, deadlines, and requirements for a given revenue threshold.',
  {
    annual_revenue_sar: z.number().positive().describe('Annual revenue in SAR to determine which wave applies'),
    as_of_date: z.string().optional().describe('Date to check status for (YYYY-MM-DD, defaults to today)'),
  },
  async ({ annual_revenue_sar, as_of_date }) => {
    const waves = [
      { wave: 1, threshold: 3_000_000_000, deadline: '2023-01-01', status: 'ACTIVE' },
      { wave: 2, threshold: 500_000_000, deadline: '2023-07-01', status: 'ACTIVE' },
      { wave: 3, threshold: 250_000_000, deadline: '2023-10-01', status: 'ACTIVE' },
      { wave: 4, threshold: 150_000_000, deadline: '2024-02-01', status: 'ACTIVE' },
      { wave: 5, threshold: 100_000_000, deadline: '2024-03-01', status: 'ACTIVE' },
      { wave: 6, threshold: 70_000_000, deadline: '2024-06-01', status: 'ACTIVE' },
      { wave: 7, threshold: 50_000_000, deadline: '2024-08-01', status: 'ACTIVE' },
      { wave: 8, threshold: 40_000_000, deadline: '2024-10-01', status: 'ACTIVE' },
      { wave: 9, threshold: 30_000_000, deadline: '2024-12-01', status: 'ACTIVE' },
      { wave: 10, threshold: 25_000_000, deadline: '2025-01-01', status: 'ACTIVE' },
      { wave: 11, threshold: 15_000_000, deadline: '2025-02-01', status: 'ACTIVE' },
      { wave: 12, threshold: 10_000_000, deadline: '2025-03-01', status: 'ACTIVE' },
      { wave: 13, threshold: 7_000_000, deadline: '2025-04-01', status: 'ACTIVE' },
      { wave: 14, threshold: 5_000_000, deadline: '2025-05-01', status: 'ACTIVE' },
      { wave: 15, threshold: 4_000_000, deadline: '2025-06-01', status: 'ACTIVE' },
      { wave: 16, threshold: 3_500_000, deadline: '2025-07-01', status: 'ACTIVE' },
      { wave: 17, threshold: 3_000_000, deadline: '2025-08-01', status: 'ACTIVE' },
      { wave: 18, threshold: 2_500_000, deadline: '2025-09-01', status: 'ACTIVE' },
      { wave: 19, threshold: 2_000_000, deadline: '2025-10-01', status: 'ACTIVE' },
      { wave: 20, threshold: 1_750_000, deadline: '2025-11-01', status: 'ACTIVE' },
      { wave: 21, threshold: 1_500_000, deadline: '2025-12-01', status: 'ACTIVE' },
      { wave: 22, threshold: 1_000_000, deadline: '2026-01-01', status: 'ACTIVE' },
      { wave: 23, threshold: 500_000, deadline: '2026-03-01', status: 'ACTIVE' },
      { wave: 24, threshold: 375_000, deadline: '2026-06-30', status: 'UPCOMING' },
    ];

    const applicableWave = waves.find(w => annual_revenue_sar >= w.threshold);
    const checkDate = as_of_date ? new Date(as_of_date) : new Date();

    if (!applicableWave) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ applicable: false, message: 'Revenue below current ZATCA thresholds. Monitor future waves.' }) }],
      };
    }

    const deadlineDate = new Date(applicableWave.deadline);
    const daysRemaining = Math.ceil((deadlineDate - checkDate) / (1000 * 60 * 60 * 24));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          applicable_wave: applicableWave.wave,
          revenue_threshold_sar: applicableWave.threshold,
          deadline: applicableWave.deadline,
          status: applicableWave.status,
          days_remaining: Math.max(0, daysRemaining),
          overdue: daysRemaining < 0,
          penalties: {
            first_violation: 'Written warning',
            second_violation: 'SAR 1,000',
            third_violation: 'SAR 5,000',
            fourth_violation: 'SAR 10,000',
            fifth_plus: 'SAR 40,000',
          },
          requirements: [
            'Register on FATOORA portal',
            'Obtain Compliance CSID',
            'Generate compliant XML invoices (UBL 2.1)',
            'Include QR code with TLV-encoded data',
            'Digital signature using X.509 certificate',
            'Real-time clearance for standard (B2B) invoices',
            'Near-real-time reporting for simplified (B2C) invoices',
          ],
        }, null, 2),
      }],
    };
  }
);

// ═══════════════════════════════════════════
// GCC REGISTRY & VALIDATION TOOLS
// ═══════════════════════════════════════════

server.tool(
  'gcc_validate_vat',
  'Validate a GCC VAT/TIN number format and check registration status where APIs are available.',
  {
    vat_number: z.string().describe('VAT or TIN registration number'),
    country: z.enum(['SA', 'AE', 'KW', 'BH', 'OM', 'QA']).describe('GCC country code'),
  },
  async (params) => validateVatNumber(params)
);

server.tool(
  'gcc_lookup_company',
  'Look up a GCC company by commercial registration (CR) number. Returns available public data.',
  {
    cr_number: z.string().describe('Commercial registration number'),
    country: z.enum(['SA', 'AE', 'KW', 'BH', 'OM', 'QA']).describe('GCC country code'),
  },
  async (params) => lookupCr(params)
);

// ═══════════════════════════════════════════
// ARABIC NLP TOOLS
// ═══════════════════════════════════════════

server.tool(
  'arabic_analyze_text',
  'Analyze Arabic text: detect dialect, sentiment, extract entities, and perform basic morphological analysis.',
  {
    text: z.string().min(1).describe('Arabic text to analyze'),
    analyses: z.array(z.enum(['dialect', 'sentiment', 'entities', 'morphology', 'keywords'])).default(['dialect', 'sentiment', 'entities']).describe('Types of analysis to perform'),
  },
  async (params) => analyzeArabicText(params)
);

server.tool(
  'arabic_extract_entities',
  'Extract named entities from Arabic text: person names, organizations, locations, dates, monetary amounts.',
  {
    text: z.string().min(1).describe('Arabic text to extract entities from'),
    entity_types: z.array(z.enum(['PERSON', 'ORG', 'LOC', 'DATE', 'MONEY', 'PHONE', 'EMAIL'])).optional().describe('Filter for specific entity types'),
  },
  async (params) => extractEntities(params)
);

// ═══════════════════════════════════════════
// COMPLIANCE TOOLS
// ═══════════════════════════════════════════

server.tool(
  'gcc_compliance_checklist',
  'Get a regulatory compliance checklist for a specific GCC country and business type.',
  {
    country: z.enum(['SA', 'AE', 'KW', 'BH', 'OM', 'QA']).describe('GCC country code'),
    business_type: z.enum(['llc', 'sole_proprietor', 'free_zone', 'branch', 'representative']).describe('Business structure type'),
    industry: z.string().optional().describe('Industry sector for industry-specific requirements'),
    employee_count: z.number().optional().describe('Number of employees (for labor law compliance)'),
  },
  async (params) => getComplianceChecklist(params)
);

server.tool(
  'gcc_regulatory_deadlines',
  'Get upcoming regulatory deadlines for GCC countries. Includes ZATCA, UAE CT, labor law, and sector-specific deadlines.',
  {
    countries: z.array(z.enum(['SA', 'AE', 'KW', 'BH', 'OM', 'QA'])).default(['SA', 'AE']).describe('Countries to check'),
    categories: z.array(z.enum(['tax', 'labor', 'compliance', 'reporting', 'licensing'])).optional().describe('Filter by category'),
    days_ahead: z.number().min(1).max(365).default(90).describe('How many days ahead to look'),
  },
  async (params) => getDeadlines(params)
);

// ═══════════════════════════════════════════
// CURRENCY & FINANCIAL TOOLS
// ═══════════════════════════════════════════

server.tool(
  'gcc_convert_currency',
  'Convert between GCC currencies using current exchange rates.',
  {
    amount: z.number().positive(),
    from: z.enum(['SAR', 'AED', 'KWD', 'BHD', 'OMR', 'QAR', 'USD', 'EUR', 'GBP']),
    to: z.enum(['SAR', 'AED', 'KWD', 'BHD', 'OMR', 'QAR', 'USD', 'EUR', 'GBP']),
  },
  async (params) => convertCurrency(params)
);

server.tool(
  'gcc_exchange_rates',
  'Get current exchange rates for GCC currencies against major currencies.',
  {
    base: z.enum(['SAR', 'AED', 'KWD', 'BHD', 'OMR', 'QAR', 'USD']).default('USD'),
  },
  async (params) => getExchangeRates(params)
);

// ═══════════════════════════════════════════
// RESOURCES (Static knowledge for agents)
// ═══════════════════════════════════════════

server.resource(
  'zatca-overview',
  'zatca://overview',
  async () => ({
    contents: [{
      uri: 'zatca://overview',
      mimeType: 'text/markdown',
      text: `# ZATCA E-Invoicing Overview (Saudi Arabia)

## What is ZATCA?
Zakat, Tax and Customs Authority - Saudi Arabia's tax authority managing VAT, e-invoicing, and customs.

## E-Invoicing Phases
- **Phase 1 (Generation)**: Started Dec 4, 2021. All taxpayers must generate e-invoices.
- **Phase 2 (Integration)**: Rolling waves since Jan 1, 2023. Taxpayers must integrate with FATOORA platform.

## Current Status (April 2026)
- Waves 1-23 are ACTIVE (SAR 500K+ revenue)
- Wave 24 (SAR 375K+) deadline: June 30, 2026
- Estimated 200,000+ businesses in scope

## Key Requirements
- UBL 2.1 XML format
- Digital signatures (X.509 certificates)
- QR codes with TLV-encoded seller/tax data
- Real-time clearance for B2B (standard) invoices
- Near-real-time reporting for B2C (simplified) invoices

## Penalties
| Violation | Fine |
|-----------|------|
| 1st | Written warning |
| 2nd | SAR 1,000 |
| 3rd | SAR 5,000 |
| 4th | SAR 10,000 |
| 5th+ | SAR 40,000 |

## Integration Options
- Direct API integration with FATOORA
- Via certified ERP/accounting software
- Via authorized service providers (ASPs)
`,
    }],
  })
);

server.resource(
  'uae-corporate-tax',
  'uae://corporate-tax',
  async () => ({
    contents: [{
      uri: 'uae://corporate-tax',
      mimeType: 'text/markdown',
      text: `# UAE Corporate Tax Overview

## Effective Date
June 1, 2023

## Tax Rates
- 0% on taxable income up to AED 375,000
- 9% on taxable income above AED 375,000
- 15% for large multinationals (Pillar Two, effective Jan 2025)

## Small Business Relief
- Available until Dec 31, 2026
- Revenue threshold: AED 3,000,000
- Elected annually
- Cannot carry forward losses during relief period

## Key Deadlines (2026)
- Registration: MUST be completed (penalties active since April 14, 2026)
- Late registration penalty: AED 10,000
- Late filing penalty: AED 1,000 (first), AED 2,000 (subsequent)
- Late payment: 14% annual rate on outstanding balance

## E-Invoicing (Upcoming)
- Peppol-based system
- Pilot starts July 1, 2026
- ASPs must be appointed
- Full mandate expected 2027

## Free Zone Qualifying Income
- 0% rate on qualifying income
- Must meet substance requirements
- De minimis rule: non-qualifying revenue < 5% or AED 5M
`,
    }],
  })
);

server.resource(
  'gcc-vat-rates',
  'gcc://vat-rates',
  async () => ({
    contents: [{
      uri: 'gcc://vat-rates',
      mimeType: 'application/json',
      text: JSON.stringify({
        last_updated: '2026-04-22',
        rates: {
          SA: { standard: 15, currency: 'SAR', authority: 'ZATCA', introduced: '2018-01-01' },
          AE: { standard: 5, currency: 'AED', authority: 'FTA', introduced: '2018-01-01' },
          BH: { standard: 10, currency: 'BHD', authority: 'NBR', introduced: '2019-01-01', note: 'Increased from 5% to 10% in Jan 2022' },
          OM: { standard: 5, currency: 'OMR', authority: 'Tax Authority', introduced: '2021-04-16' },
          QA: { standard: 0, currency: 'QAR', authority: 'GTA', note: 'No VAT implemented as of 2026' },
          KW: { standard: 0, currency: 'KWD', authority: 'MOF', note: 'VAT legislation pending, expected 2027' },
        },
      }, null, 2),
    }],
  })
);

// ═══════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GCC Intelligence MCP Server running on stdio');
}

main().catch(console.error);
