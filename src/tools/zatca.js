/**
 * ZATCA E-Invoicing Tools
 * Generates UBL 2.1 compliant XML invoices per ZATCA Phase 2 requirements.
 */

/**
 * Generate TLV (Tag-Length-Value) encoded data for QR code
 */
function generateTlv(tag, value) {
  const valueBytes = Buffer.from(value, 'utf8');
  return Buffer.concat([
    Buffer.from([tag]),
    Buffer.from([valueBytes.length]),
    valueBytes,
  ]);
}

/**
 * Generate ZATCA QR code data (Base64 TLV-encoded)
 */
function generateQrData({ sellerName, vatNumber, timestamp, totalWithVat, vatAmount }) {
  const tlvParts = [
    generateTlv(1, sellerName),
    generateTlv(2, vatNumber),
    generateTlv(3, timestamp),
    generateTlv(4, totalWithVat.toFixed(2)),
    generateTlv(5, vatAmount.toFixed(2)),
  ];
  return Buffer.concat(tlvParts).toString('base64');
}

/**
 * Calculate line item totals
 */
function calculateLineItem(item) {
  const lineTotal = item.quantity * item.unit_price;
  const discountAmount = item.discount || 0;
  const taxableAmount = lineTotal - discountAmount;
  const vatAmount = taxableAmount * (item.vat_rate / 100);
  return {
    ...item,
    line_total: lineTotal,
    discount_amount: discountAmount,
    taxable_amount: taxableAmount,
    vat_amount: vatAmount,
    total_with_vat: taxableAmount + vatAmount,
  };
}

/**
 * Generate UBL 2.1 XML for a ZATCA-compliant invoice
 */
export async function generateZatcaXml(params) {
  const {
    invoice_type, seller_name, seller_vat, buyer_name, buyer_vat,
    invoice_number, issue_date, line_items, currency, note,
  } = params;

  // Validate standard invoice requirements
  if (invoice_type === 'standard' && (!buyer_name || !buyer_vat)) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: 'Standard (B2B) invoices require buyer_name and buyer_vat',
          invoice_type,
        }),
      }],
    };
  }

  // Calculate totals
  const calculatedItems = line_items.map(calculateLineItem);
  const subtotal = calculatedItems.reduce((sum, i) => sum + i.taxable_amount, 0);
  const totalVat = calculatedItems.reduce((sum, i) => sum + i.vat_amount, 0);
  const totalDiscount = calculatedItems.reduce((sum, i) => sum + i.discount_amount, 0);
  const totalWithVat = subtotal + totalVat;

  // Generate UUID
  const uuid = crypto.randomUUID();
  const timestamp = `${issue_date}T00:00:00Z`;

  // Generate QR code data
  const qrData = generateQrData({
    sellerName: seller_name,
    vatNumber: seller_vat,
    timestamp,
    totalWithVat,
    vatAmount: totalVat,
  });

  // Invoice type code: 388 = Tax Invoice, 381 = Credit Note, 383 = Debit Note
  const typeCode = '388';
  // Sub-type: 01XX = Standard, 02XX = Simplified
  const subType = invoice_type === 'standard' ? '0100000' : '0200000';

  const lineItemsXml = calculatedItems.map((item, idx) => `
    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="PCE">${item.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${currency}">${item.taxable_amount.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${currency}">${item.vat_amount.toFixed(2)}</cbc:TaxAmount>
        <cbc:RoundingAmount currencyID="${currency}">${item.total_with_vat.toFixed(2)}</cbc:RoundingAmount>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Name>${escapeXml(item.description)}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>S</cbc:ID>
          <cbc:Percent>${item.vat_rate}</cbc:Percent>
          <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${currency}">${item.unit_price.toFixed(2)}</cbc:PriceAmount>
        ${item.discount_amount > 0 ? `<cac:AllowanceCharge>
          <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
          <cbc:Amount currencyID="${currency}">${item.discount_amount.toFixed(2)}</cbc:Amount>
        </cac:AllowanceCharge>` : ''}
      </cac:Price>
    </cac:InvoiceLine>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoice_number)}</cbc:ID>
  <cbc:UUID>${uuid}</cbc:UUID>
  <cbc:IssueDate>${issue_date}</cbc:IssueDate>
  <cbc:IssueTime>00:00:00</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${subType}">${typeCode}</cbc:InvoiceTypeCode>
  ${note ? `<cbc:Note>${escapeXml(note)}</cbc:Note>` : ''}
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>

  <cac:AdditionalDocumentReference>
    <cbc:ID>QR</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${qrData}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>

  <cac:Signature>
    <cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>
    <cbc:SignatureMethod>urn:oasis:names:specification:ubl:dsig:enveloped:xades</cbc:SignatureMethod>
  </cac:Signature>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${escapeXml(seller_vat)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXml(seller_name)}</cbc:Name>
      </cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(seller_vat)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>

  ${buyer_name ? `<cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${escapeXml(buyer_name)}</cbc:Name>
      </cac:PartyName>
      ${buyer_vat ? `<cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(buyer_vat)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>` : ''}
    </cac:Party>
  </cac:AccountingCustomerParty>` : ''}

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${totalVat.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${subtotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${totalVat.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>15</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${totalWithVat.toFixed(2)}</cbc:TaxInclusiveAmount>
    ${totalDiscount > 0 ? `<cbc:AllowanceTotalAmount currencyID="${currency}">${totalDiscount.toFixed(2)}</cbc:AllowanceTotalAmount>` : ''}
    <cbc:PayableAmount currencyID="${currency}">${totalWithVat.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  ${lineItemsXml}
</Invoice>`;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        invoice_number,
        uuid,
        invoice_type,
        currency,
        subtotal: subtotal.toFixed(2),
        total_vat: totalVat.toFixed(2),
        total_with_vat: totalWithVat.toFixed(2),
        line_count: calculatedItems.length,
        qr_data: qrData,
        xml,
      }, null, 2),
    }],
  };
}

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
