import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { convertCurrency, getExchangeRates } from '../tools/currency.js';
import { generateZatcaXml } from '../tools/zatca.js';

describe('gcc-intelligence-mcp', () => {
  it('converts SAR to AED correctly', async () => {
    const result = await convertCurrency({ amount: 100, from: 'SAR', to: 'AED' });
    const data = JSON.parse(result.content[0].text);
    assert.ok(data.to.amount);
    assert.equal(data.rate_type, 'FIXED_PEG');
    const amount = parseFloat(data.to.amount);
    assert.ok(amount > 90 && amount < 110, 'SAR/AED peg should be close to 1:1');
  });

  it('returns exchange rates for USD base', async () => {
    const result = await getExchangeRates({ base: 'USD' });
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.base, 'USD');
    assert.ok(data.rates.SAR);
    assert.equal(data.rates.SAR.rate, '3.750000');
    assert.equal(data.rates.SAR.type, 'fixed_peg');
  });

  it('generates valid ZATCA simplified invoice XML', async () => {
    const result = await generateZatcaXml({
      invoice_type: 'simplified',
      seller_name: 'Test Company',
      seller_vat: '300000000000003',
      invoice_number: 'INV-001',
      issue_date: '2026-01-15',
      line_items: [{ description: 'Widget', quantity: 2, unit_price: 100, vat_rate: 15, discount: 0 }],
      currency: 'SAR',
    });
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.success, true);
    assert.equal(data.invoice_number, 'INV-001');
    assert.ok(data.xml.includes('cbc:ID'));
    assert.ok(data.xml.includes('cbc:UUID'));
    assert.ok(data.xml.includes('cac:Signature'));
    assert.equal(data.total_with_vat, '230.00');
  });

  it('rejects standard invoice without buyer info', async () => {
    const result = await generateZatcaXml({
      invoice_type: 'standard',
      seller_name: 'Test Company',
      seller_vat: '300000000000003',
      invoice_number: 'INV-002',
      issue_date: '2026-01-15',
      line_items: [{ description: 'Widget', quantity: 1, unit_price: 50, vat_rate: 15, discount: 0 }],
      currency: 'SAR',
    });
    const data = JSON.parse(result.content[0].text);
    assert.ok(data.error);
    assert.ok(data.error.includes('buyer_name'));
  });

  it('handles currency conversion error for same currency', async () => {
    const result = await convertCurrency({ amount: 100, from: 'SAR', to: 'SAR' });
    const data = JSON.parse(result.content[0].text);
    // Should still work, just 1:1 rate
    assert.equal(parseFloat(data.to.amount), 100);
  });

  it('calculates VAT correctly for multi-line items', async () => {
    const result = await generateZatcaXml({
      invoice_type: 'simplified',
      seller_name: 'Multi Corp',
      seller_vat: '300000000000003',
      invoice_number: 'INV-003',
      issue_date: '2026-02-01',
      line_items: [
        { description: 'Item A', quantity: 1, unit_price: 100, vat_rate: 15, discount: 0 },
        { description: 'Item B', quantity: 3, unit_price: 200, vat_rate: 15, discount: 50 },
      ],
      currency: 'SAR',
    });
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.success, true);
    assert.equal(data.line_count, 2);
    // Item A: 100 + 15 = 115
    // Item B: (600 - 50) = 550, tax = 82.50, total = 632.50
    // Grand total = 747.50
    assert.equal(data.total_with_vat, '747.50');
  });
});
