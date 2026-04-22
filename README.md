# gcc-intelligence-mcp

GCC regulatory intelligence for AI agents. ZATCA e-invoicing, Arabic NLP, UAE Corporate Tax, and compliance tools — all via MCP.

[![npm version](https://img.shields.io/npm/v/gcc-intelligence-mcp)](https://www.npmjs.com/package/gcc-intelligence-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Why This Exists

AI agents building for the Gulf Cooperation Council (Saudi Arabia, UAE, Kuwait, Bahrain, Oman, Qatar) need regulatory knowledge. No existing MCP server covers ZATCA e-invoicing, Arabic text analysis, or GCC compliance. This one does.

**Zero competition in this category** as of April 2026.

## What It Does

### ZATCA E-Invoicing (Saudi Arabia)
- `zatca_generate_invoice_xml` — Generate UBL 2.1 compliant invoices with QR codes
- `zatca_validate_invoice` — Validate invoices against Phase 1/2 requirements
- `zatca_get_wave_status` — Check which wave applies based on revenue threshold

### Arabic NLP
- `arabic_analyze_text` — Dialect detection, sentiment analysis, entity extraction, keyword extraction
- `arabic_extract_entities` — Named entity recognition (persons, orgs, locations, amounts, dates)

### GCC Business Registry
- `gcc_validate_vat` — Validate VAT/TIN numbers for all 6 GCC countries
- `gcc_lookup_company` — Look up companies by commercial registration number

### Compliance
- `gcc_compliance_checklist` — Get regulatory requirements by country and business type
- `gcc_regulatory_deadlines` — Track upcoming deadlines (ZATCA, UAE CT, labor law, licensing)

### Currency
- `gcc_convert_currency` — Convert between GCC currencies (all USD-pegged)
- `gcc_exchange_rates` — Get current exchange rates

### Resources (Static Knowledge)
- `zatca://overview` — ZATCA e-invoicing overview and requirements
- `uae://corporate-tax` — UAE Corporate Tax guide
- `gcc://vat-rates` — VAT rates for all 6 GCC countries

## Installation

### Claude Desktop / Claude Code

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "gcc-intelligence": {
      "command": "npx",
      "args": ["gcc-intelligence-mcp"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "gcc-intelligence": {
      "command": "npx",
      "args": ["gcc-intelligence-mcp"]
    }
  }
}
```

### Windsurf / VS Code

Same pattern — add the server to your MCP configuration file.

## Use Cases

**For accounting software developers:**
Generate ZATCA-compliant invoices programmatically. Your AI agent handles the UBL 2.1 XML, QR codes, and validation — you focus on your product.

**For compliance teams:**
Ask your agent "What are our ZATCA deadlines?" and get structured data including wave status, days remaining, and penalty schedules.

**For AI agents processing Arabic text:**
Extract entities, detect sentiment, and identify dialects from Arabic business documents, contracts, and communications.

**For GCC market researchers:**
Convert currencies, validate business registrations, and check regulatory requirements across all 6 GCC countries.

## Example

```
Agent: "Generate a ZATCA-compliant simplified invoice for ABC Trading, VAT 300000000000003,
        selling 5 units of Product X at SAR 100 each with 15% VAT"

→ Returns complete UBL 2.1 XML with:
  - Correct invoice type code (0200000 for simplified)
  - TLV-encoded QR code data
  - Calculated VAT (SAR 75.00)
  - Total with VAT (SAR 575.00)
  - UUID for Phase 2 tracking
```

## Pricing

| Tier | Price | Included |
|------|-------|----------|
| Free | $0 | 50 queries/month |
| Starter | $79/month | 500 queries, Phase 1+2 |
| Pro | $349/month | 5,000 queries, multi-entity |
| Enterprise | $1,200/month | Unlimited, white-label, SLA |

## Coverage

| Country | VAT | E-Invoicing | Labor | Corporate Tax |
|---------|-----|-------------|-------|---------------|
| Saudi Arabia | 15% | ZATCA Phase 2 | Nitaqat, GOSI, WPS | Zakat/Income Tax |
| UAE | 5% | Pilot Jul 2026 | Emiratisation, MOHRE | 9% CT (active) |
| Kuwait | 0% (pending) | N/A | Kuwaitization, PIFSS | CIT (foreign only) |
| Bahrain | 10% | N/A | Bahranisation, SIO | No CIT |
| Oman | 5% | N/A | Omanisation, PASI | 15% CIT |
| Qatar | 0% | N/A | Qatarisation | 10% CIT (foreign) |

## Requirements

- Node.js 18+
- No API keys needed for free tier

## License

MIT

## Keywords

zatca, mcp, mcp-server, gcc, arabic, nlp, compliance, e-invoicing, saudi-arabia, uae, kuwait, bahrain, oman, qatar, corporate-tax, ai-agent, regulatory, vat, model-context-protocol
