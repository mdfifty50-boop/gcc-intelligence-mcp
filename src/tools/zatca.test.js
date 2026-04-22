import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateZatcaXml } from './zatca.js';

describe('ZATCA E-Invoicing', () => {
  describe('generateZatcaXml', () => {
    it('generates valid UBL 2.1 XML for a standard invoice', async () => {
      const result = await generateZatcaXml({
        invoice_number: 'INV-001',
        issue_date: '2026-04-22',
        invoice_type: 'standard',
        currency: 'SAR',
        seller_name: 'Test Company LLC',
        seller_vat: '300000000000003',
        buyer_name: 'Client Corp',
        buyer_vat: '300000000000004',
        line_items: [
          { description: 'Consulting services', quantity: 10, unit_price: 500, vat_rate: 15 }
        ]
      });
      const data = JSON.parse(result.content[0].text);

      assert.ok(data.xml, 'Should contain XML');
      assert.ok(data.xml.includes('urn:oasis:names:specification:ubl:schema:xsd:Invoice-2'), 'Should use UBL 2.1 namespace');
      assert.ok(data.xml.includes('INV-001'), 'Should contain invoice number');
      assert.ok(data.xml.includes('Test Company LLC'), 'Should contain seller name');
      assert.ok(data.qr_data, 'Should contain QR data');
      assert.equal(data.subtotal, '5000.00', 'Subtotal should be 5000.00');
      assert.equal(data.total_vat, '750.00', 'VAT should be 750.00 (15%)');
      assert.equal(data.total_with_vat, '5750.00', 'Total should be 5750.00');
      assert.equal(data.success, true);
    });

    it('handles multiple line items with discounts', async () => {
      const result = await generateZatcaXml({
        invoice_number: 'INV-002',
        issue_date: '2026-04-22',
        invoice_type: 'simplified',
        currency: 'SAR',
        seller_name: 'Multi Item Co',
        seller_vat: '300000000000003',
        buyer_name: 'Buyer Co',
        buyer_vat: '300000000000004',
        line_items: [
          { description: 'Item A', quantity: 5, unit_price: 100, vat_rate: 15, discount: 50 },
          { description: 'Item B', quantity: 2, unit_price: 200, vat_rate: 15 }
        ]
      });
      const data = JSON.parse(result.content[0].text);

      // Item A: 5*100=500 - 50 discount = 450 taxable
      // Item B: 2*200=400 taxable
      assert.equal(data.subtotal, '850.00', 'Subtotal should be 850.00');
      assert.equal(data.line_count, 2, 'Should have 2 line items');
      assert.ok(parseFloat(data.total_vat) > 0, 'Should have VAT');
    });

    it('generates valid QR code data with TLV encoding', async () => {
      const result = await generateZatcaXml({
        invoice_number: 'QR-TEST',
        issue_date: '2026-04-22',
        invoice_type: 'simplified',
        currency: 'SAR',
        seller_name: 'QR Co',
        seller_vat: '300000000000003',
        line_items: [
          { description: 'Item', quantity: 1, unit_price: 100, vat_rate: 15 }
        ]
      });
      const data = JSON.parse(result.content[0].text);
      const qrBuffer = Buffer.from(data.qr_data, 'base64');

      // First byte should be tag 1 (seller name)
      assert.equal(qrBuffer[0], 1, 'First TLV tag should be 1 (seller name)');
      // Tag 2 should be VAT number
      const sellerLen = qrBuffer[1];
      assert.equal(qrBuffer[2 + sellerLen], 2, 'Second TLV tag should be 2 (VAT number)');
    });

    it('rejects standard invoice without buyer info', async () => {
      const result = await generateZatcaXml({
        invoice_number: 'INV-FAIL',
        issue_date: '2026-04-22',
        invoice_type: 'standard',
        currency: 'SAR',
        seller_name: 'Seller Co',
        seller_vat: '300000000000003',
        line_items: [
          { description: 'Item', quantity: 1, unit_price: 100, vat_rate: 15 }
        ]
      });
      const data = JSON.parse(result.content[0].text);
      assert.ok(data.error, 'Should return error for standard invoice without buyer');
    });

    it('includes XML signature placeholder', async () => {
      const result = await generateZatcaXml({
        invoice_number: 'SIG-TEST',
        issue_date: '2026-04-22',
        invoice_type: 'simplified',
        currency: 'SAR',
        seller_name: 'Sig Co',
        seller_vat: '300000000000003',
        line_items: [
          { description: 'Item', quantity: 1, unit_price: 100, vat_rate: 15 }
        ]
      });
      const data = JSON.parse(result.content[0].text);
      assert.ok(data.xml.includes('Signature'), 'Should include signature element');
    });
  });
});
