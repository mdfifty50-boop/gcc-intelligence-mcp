import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { convertCurrency, getExchangeRates } from './currency.js';

describe('GCC Currency Conversion', () => {
  describe('convertCurrency', () => {
    it('converts SAR to AED at fixed peg rates', async () => {
      const result = await convertCurrency({ amount: 1000, from: 'SAR', to: 'AED' });
      const data = JSON.parse(result.content[0].text);

      assert.equal(data.from.currency, 'SAR');
      assert.equal(data.to.currency, 'AED');
      // 1000 SAR / 3.75 = 266.67 USD * 3.6725 = 979.33 AED
      const expected = (1000 / 3.75) * 3.6725;
      assert.ok(Math.abs(parseFloat(data.to.amount) - expected) < 0.01, `Should be ~${expected.toFixed(2)} AED`);
      assert.equal(data.rate_type, 'FIXED_PEG');
    });

    it('converts KWD to SAR with basket peg note', async () => {
      const result = await convertCurrency({ amount: 100, from: 'KWD', to: 'SAR' });
      const data = JSON.parse(result.content[0].text);

      assert.equal(data.rate_type, 'BASKET_PEG');
      // 100 KWD / 0.306 = 326.80 USD * 3.75 = 1225.49 SAR
      const expected = (100 / 0.306) * 3.75;
      assert.ok(Math.abs(parseFloat(data.to.amount) - expected) < 1, `Should be ~${expected.toFixed(2)} SAR`);
    });

    it('marks EUR/GBP conversions as approximate', async () => {
      const result = await convertCurrency({ amount: 1000, from: 'SAR', to: 'EUR' });
      const data = JSON.parse(result.content[0].text);
      assert.equal(data.rate_type, 'APPROXIMATE');
    });

    it('returns error for unsupported currency', async () => {
      const result = await convertCurrency({ amount: 100, from: 'SAR', to: 'JPY' });
      const data = JSON.parse(result.content[0].text);
      assert.ok(data.error, 'Should return error for unsupported currency');
    });

    it('handles same-currency conversion', async () => {
      const result = await convertCurrency({ amount: 500, from: 'SAR', to: 'SAR' });
      const data = JSON.parse(result.content[0].text);
      // Should return same amount (or very close due to float)
      assert.ok(Math.abs(parseFloat(data.to.amount) - 500) < 0.01, 'Same currency should return same amount');
    });
  });

  describe('getExchangeRates', () => {
    it('returns all rates for SAR base', async () => {
      const result = await getExchangeRates({ base: 'SAR' });
      const data = JSON.parse(result.content[0].text);

      assert.equal(data.base, 'SAR');
      assert.ok(data.rates.AED, 'Should have AED rate');
      assert.ok(data.rates.KWD, 'Should have KWD rate');
      assert.ok(data.rates.USD, 'Should have USD rate');
      assert.ok(!data.rates.SAR, 'Should not include base currency in rates');
    });

    it('classifies peg types correctly', async () => {
      const result = await getExchangeRates({ base: 'USD' });
      const data = JSON.parse(result.content[0].text);

      assert.equal(data.rates.SAR.type, 'fixed_peg');
      assert.equal(data.rates.AED.type, 'fixed_peg');
      assert.equal(data.rates.KWD.type, 'basket_peg');
      assert.equal(data.rates.EUR.type, 'floating');
    });

    it('returns error for unsupported base', async () => {
      const result = await getExchangeRates({ base: 'XYZ' });
      const data = JSON.parse(result.content[0].text);
      assert.ok(data.error, 'Should return error for unsupported base');
    });
  });
});
