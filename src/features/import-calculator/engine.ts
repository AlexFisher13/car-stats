import { Inputs, RateTables } from './schema';

/**
 * Convert amount from specified currency to RUB using provided rates.
 * @param amount исходная сумма
 * @param currency валюта суммы
 * @param rates курсы валют
 */
export function toRUB(amount: number, currency: keyof Inputs['currencyRates'], rates: Inputs['currencyRates']): number {
  const num = Number(amount);
  if (!isFinite(num) || num <= 0) return 0;
  const rate = rates[currency];
  if (!rate) return 0;
  return num * rate;
}

/**
 * Find rate for value within band table.
 * @param value проверяемое значение
 * @param bands массив диапазонов с максимальным значением и ставкой
 */
export function bandRate<T extends { ccMax: number | null; rate: number }>(
  value: number,
  bands: T[],
): number {
  for (const band of bands) {
    if (band.ccMax === null || value <= band.ccMax) {
      return band.rate;
    }
  }
  return bands[bands.length - 1]?.rate ?? 0;
}

/**
 * Calculate import fees based on inputs and rate tables.
 * @param inputs пользовательские входные данные
 * @param rateTables ставки и коэффициенты
 * @returns детализированный расчет
 */
export function calculate(inputs: Inputs, rateTables: RateTables) {
  const { currencyRates } = inputs;
  const { customsDuty, excise, vat, utilizationFee, evCustomsDuty } = rateTables;

  const TS =
    toRUB(inputs.basePrice, inputs.priceCurrency, currencyRates) +
    toRUB(inputs.deliveryCost, inputs.priceCurrency, currencyRates) +
    toRUB(inputs.insuranceCost, inputs.priceCurrency, currencyRates);

  let duty = 0;
  if (inputs.fuelType === 'ev') {
    duty = TS * (evCustomsDuty.percent ?? 0);
  } else if (inputs.carAgeYears < 3) {
    const percent = customsDuty.new.percent;
    const minPerCC = customsDuty.new.minPerCC_EUR;
    const percentVal = TS * percent;
    const minVal = inputs.engineVolumeCC * minPerCC * currencyRates.EUR;
    duty = Math.max(percentVal, minVal);
  } else {
    const bands =
      inputs.carAgeYears <= 5
        ? customsDuty.age_3_to_5.perCC_EUR_byBands
        : customsDuty.age_5_plus.perCC_EUR_byBands;
    const rate = bandRate(inputs.engineVolumeCC, bands);
    duty = inputs.engineVolumeCC * rate * currencyRates.EUR;
  }

  let exciseVal = 0;
  if (inputs.fuelType !== 'ev') {
    const bands = excise.gasoline_diesel_hybrid;
    let hpRate = 0;
    for (const band of bands) {
      if (band.hpMax === null || inputs.horsePower <= band.hpMax) {
        hpRate = band.rateRubPerHP;
        break;
      }
    }
    exciseVal = hpRate * inputs.horsePower;
  }

  const vatPercent = inputs.fuelType === 'ev' ? vat.evPercent : vat.percent;
  const vatVal = (TS + duty + exciseVal) * vatPercent;

  const base = inputs.isIndividual
    ? utilizationFee.baseRub_individual
    : utilizationFee.baseRub_legal;
  let coeff = utilizationFee.coeffByAge[utilizationFee.coeffByAge.length - 1].coeff;
  for (const c of utilizationFee.coeffByAge) {
    if (c.ageMaxYears === null || inputs.carAgeYears <= c.ageMaxYears) {
      coeff = c.coeff;
      break;
    }
  }
  const utilFee = base * coeff * (inputs.fuelType === 'ev' ? utilizationFee.evExtraCoeff : 1);

  const total = TS + duty + exciseVal + vatVal + utilFee + inputs.otherCosts;
  return { TS, duty, excise: exciseVal, vat: vatVal, utilFee, total } as const;
}

export type Breakdown = ReturnType<typeof calculate>;
