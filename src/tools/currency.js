/**
 * GCC Currency Conversion & Exchange Rate Tools
 * Uses fixed peg rates for GCC currencies (all pegged to USD except KWD basket peg)
 */

// GCC currencies are pegged to USD (KWD uses a basket peg with narrow band)
const usdRates = {
  SAR: 3.7500,   // Fixed peg since 1986
  AED: 3.6725,   // Fixed peg since 1997
  KWD: 0.3060,   // Basket peg (narrow band, rarely moves more than ±0.5%)
  BHD: 0.3760,   // Fixed peg since 2001
  OMR: 0.3845,   // Fixed peg since 1986
  QAR: 3.6400,   // Fixed peg since 2001
  USD: 1.0000,
  EUR: 0.9200,   // Approximate — fluctuates
  GBP: 0.7900,   // Approximate — fluctuates
};

// Last updated timestamp
const ratesLastUpdated = '2026-04-22';

/**
 * Convert between currencies
 */
export async function convertCurrency({ amount, from, to }) {
  if (!usdRates[from] || !usdRates[to]) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Unsupported currency: ${from} or ${to}` }) }],
    };
  }

  // Convert to USD first, then to target
  const usdAmount = amount / usdRates[from];
  const convertedAmount = usdAmount * usdRates[to];
  const rate = usdRates[to] / usdRates[from];

  const isGccPeg = ['SAR', 'AED', 'BHD', 'OMR', 'QAR'].includes(from) &&
                   ['SAR', 'AED', 'BHD', 'OMR', 'QAR'].includes(to);
  const isKwd = from === 'KWD' || to === 'KWD';

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        from: { currency: from, amount: amount.toFixed(4) },
        to: { currency: to, amount: convertedAmount.toFixed(4) },
        rate: rate.toFixed(6),
        inverse_rate: (1 / rate).toFixed(6),
        via_usd: usdAmount.toFixed(4),
        rate_type: isGccPeg ? 'FIXED_PEG' : isKwd ? 'BASKET_PEG' : 'APPROXIMATE',
        note: isGccPeg
          ? 'Both currencies are USD-pegged. This rate is effectively fixed and reliable for business planning.'
          : isKwd
            ? 'KWD uses a basket peg with narrow band. Rate is stable but may vary ±0.5%.'
            : 'Rate is approximate. EUR and GBP float against USD. Use a live feed for transaction-grade rates.',
        rates_as_of: ratesLastUpdated,
      }, null, 2),
    }],
  };
}

/**
 * Get exchange rates for a base currency
 */
export async function getExchangeRates({ base }) {
  if (!usdRates[base]) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Unsupported base currency: ${base}` }) }],
    };
  }

  const rates = {};
  for (const [currency, usdRate] of Object.entries(usdRates)) {
    if (currency === base) continue;
    rates[currency] = {
      rate: (usdRate / usdRates[base]).toFixed(6),
      type: ['SAR', 'AED', 'BHD', 'OMR', 'QAR'].includes(currency) ? 'fixed_peg' :
            currency === 'KWD' ? 'basket_peg' : 'floating',
    };
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        base,
        as_of: ratesLastUpdated,
        rates,
        note: 'GCC currencies (SAR, AED, BHD, OMR, QAR) are USD-pegged with fixed rates. KWD uses a basket peg. EUR/GBP rates are approximate.',
        gcc_peg_info: {
          SAR: 'Fixed at 3.75/USD since 1986',
          AED: 'Fixed at 3.6725/USD since 1997',
          BHD: 'Fixed at 0.376/USD since 2001',
          OMR: 'Fixed at 0.3845/USD since 1986',
          QAR: 'Fixed at 3.64/USD since 2001',
          KWD: 'Basket peg, ~0.306/USD, narrow band',
        },
      }, null, 2),
    }],
  };
}
