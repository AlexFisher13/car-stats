import { describe, it, expect } from 'vitest';
import config from './config.json';
import { calculate, bandRate, toRUB } from './engine';
import { Inputs, RateTables } from './schema';

const rates = config.rateTables as RateTables;

function baseInputs(): Inputs {
  return {
    basePrice: 0,
    deliveryCost: 0,
    insuranceCost: 0,
    priceCurrency: 'EUR',
    currencyRates: { EUR: 100, USD: 90, RUB: 1 },
    engineVolumeCC: 0,
    horsePower: 0,
    carAgeYears: 0,
    fuelType: 'gasoline',
    vehicleType: 'passenger',
    isIndividual: true,
    otherCosts: 0,
  };
}

describe('engine helpers', () => {
  it('toRUB converts currencies', () => {
    expect(toRUB(10, 'EUR', { EUR: 100, USD: 90, RUB: 1 })).toBe(1000);
  });

  it('bandRate selects proper rate', () => {
    const bands = [
      { ccMax: 1000, rate: 1 },
      { ccMax: null, rate: 2 },
    ];
    expect(bandRate(500, bands)).toBe(1);
    expect(bandRate(1500, bands)).toBe(2);
  });
});

describe('import calculator engine', () => {
  it('средний кейс', () => {
    const inputs: Inputs = {
      ...baseInputs(),
      basePrice: 10000,
      deliveryCost: 800,
      engineVolumeCC: 1998,
      horsePower: 150,
      carAgeYears: 4,
      otherCosts: 40000,
    };
    const res = calculate(inputs, rates);
    expect(res.TS).toBeGreaterThan(0);
    expect(res.duty).toBeGreaterThan(0);
    expect(res.excise).toBeGreaterThan(0);
    expect(res.vat).toBeGreaterThan(0);
    expect(res.utilFee).toBeGreaterThan(0);
    expect(res.total).toBe(2032172);
  });

  it('EV case', () => {
    const inputs: Inputs = {
      ...baseInputs(),
      basePrice: 5000,
      fuelType: 'ev',
      engineVolumeCC: 0,
      horsePower: 120,
      carAgeYears: 1,
    };
    const res = calculate(inputs, rates);
    expect(res.duty).toBe(0);
    expect(res.vat).toBe(0);
    expect(res.utilFee).toBeGreaterThan(0);
  });

  it('boundary values', () => {
    const inputs1: Inputs = {
      ...baseInputs(),
      engineVolumeCC: 1000,
      horsePower: 90,
      carAgeYears: 4,
    };
    const r1 = calculate(inputs1, rates);
    expect(r1.duty).toBe(1000 * 1.5 * 100);
    expect(r1.excise).toBe(0);

    const inputs2: Inputs = {
      ...inputs1,
      engineVolumeCC: 1001,
      horsePower: 91,
    };
    const r2 = calculate(inputs2, rates);
    expect(r2.duty).toBe(1001 * 1.7 * 100);
    expect(r2.excise).toBe(91 * 49);
  });
});
