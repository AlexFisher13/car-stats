import { z } from 'zod';

/**
 * Schema for import calculator inputs.
 */
export const currencyEnum = z.enum(['EUR', 'USD', 'RUB']);

export const inputsSchema = z.object({
  basePrice: z
    .number({ required_error: 'Введите цену авто' })
    .min(0, 'Цена не может быть отрицательной'),
  deliveryCost: z
    .number()
    .min(0, 'Стоимость доставки не может быть отрицательной')
    .default(0),
  insuranceCost: z
    .number()
    .min(0, 'Страховка не может быть отрицательной')
    .default(0),
  priceCurrency: currencyEnum.default('EUR'),
  currencyRates: z.object({
    EUR: z.number().min(1, 'Курс должен быть ≥ 1'),
    USD: z.number().min(1, 'Курс должен быть ≥ 1'),
    RUB: z.literal(1, { errorMap: () => ({ message: 'RUB всегда 1' }) }),
  }),
  engineVolumeCC: z
    .number({ required_error: 'Введите объем двигателя' })
    .min(0, 'Объем не может быть отрицательным'),
  horsePower: z
    .number({ required_error: 'Введите мощность' })
    .min(0, 'Мощность не может быть отрицательной'),
  carAgeYears: z
    .number({ required_error: 'Введите возраст авто' })
    .min(0, 'Возраст не может быть отрицательным'),
  fuelType: z.enum(['gasoline', 'diesel', 'hybrid', 'ev'], {
    required_error: 'Укажите тип топлива',
  }),
  vehicleType: z.enum(['passenger']).default('passenger'),
  isIndividual: z.boolean().default(true),
  otherCosts: z.number().min(0, 'Не может быть отрицательным').default(0),
});

export type Inputs = z.infer<typeof inputsSchema>;

/**
 * Utility schema for rate tables to ensure valid structure when importing/exporting.
 */
export const rateTablesSchema = z.object({
  customsDuty: z.any(),
  excise: z.any(),
  vat: z.any(),
  utilizationFee: z.any(),
  evCustomsDuty: z.any(),
});

export type RateTables = z.infer<typeof rateTablesSchema>;
