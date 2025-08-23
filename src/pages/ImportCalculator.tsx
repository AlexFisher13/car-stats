/**
 * Страница калькулятора импорта автомобилей. Доступна по маршруту /import-calculator
 * и позволяет оценить платежи при ввозе авто в РФ.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import config from '@/features/import-calculator/config.json';
import {
  inputsSchema,
  Inputs,
  rateTablesSchema,
  RateTables,
} from '@/features/import-calculator/schema';
import { calculate, Breakdown } from '@/features/import-calculator/engine';

const defaultInputs: Inputs = {
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

const defaultRates: RateTables = config.rateTables as unknown as RateTables;

interface InputsFormProps {
  inputs: Inputs;
  setInputs: (i: Inputs) => void;
  errors: Record<string, string>;
}

const InputsForm: React.FC<InputsFormProps> = ({ inputs, setInputs, errors }) => {
  const update = (field: keyof Inputs, value: any) => {
    setInputs({ ...inputs, [field]: value });
  };
  const updateRate = (field: keyof Inputs['currencyRates'], value: number) => {
    setInputs({ ...inputs, currencyRates: { ...inputs.currencyRates, [field]: value } });
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col">
          <span>Цена авто</span>
          <input
            type="number"
            value={inputs.basePrice}
            onChange={(e) => update('basePrice', Number(e.target.value))}
            className="border p-1 rounded"
          />
          {errors.basePrice && <span className="text-red-500 text-sm">{errors.basePrice}</span>}
        </label>
        <label className="flex flex-col">
          <span>Стоимость доставки</span>
          <input
            type="number"
            value={inputs.deliveryCost}
            onChange={(e) => update('deliveryCost', Number(e.target.value))}
            className="border p-1 rounded"
          />
          {errors.deliveryCost && <span className="text-red-500 text-sm">{errors.deliveryCost}</span>}
        </label>
        <label className="flex flex-col">
          <span>Страховка</span>
          <input
            type="number"
            value={inputs.insuranceCost}
            onChange={(e) => update('insuranceCost', Number(e.target.value))}
            className="border p-1 rounded"
          />
          {errors.insuranceCost && <span className="text-red-500 text-sm">{errors.insuranceCost}</span>}
        </label>
        <label className="flex flex-col">
          <span>Валюта цены</span>
          <select
            value={inputs.priceCurrency}
            onChange={(e) => update('priceCurrency', e.target.value)}
            className="border p-1 rounded"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="RUB">RUB</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col">
          <span>Курс EUR</span>
          <input
            type="number"
            value={inputs.currencyRates.EUR}
            onChange={(e) => updateRate('EUR', Number(e.target.value))}
            className="border p-1 rounded"
          />
        </label>
        <label className="flex flex-col">
          <span>Курс USD</span>
          <input
            type="number"
            value={inputs.currencyRates.USD}
            onChange={(e) => updateRate('USD', Number(e.target.value))}
            className="border p-1 rounded"
          />
        </label>
        <label className="flex flex-col">
          <span>RUB = 1</span>
          <input type="number" value={1} readOnly className="border p-1 rounded bg-gray-100" />
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col">
          <span>Объем двигателя, см³</span>
          <input
            type="number"
            value={inputs.engineVolumeCC}
            onChange={(e) => update('engineVolumeCC', Number(e.target.value))}
            className="border p-1 rounded"
          />
          {errors.engineVolumeCC && <span className="text-red-500 text-sm">{errors.engineVolumeCC}</span>}
        </label>
        <label className="flex flex-col">
          <span>Мощность, л.с.</span>
          <input
            type="number"
            value={inputs.horsePower}
            onChange={(e) => update('horsePower', Number(e.target.value))}
            className="border p-1 rounded"
          />
          {errors.horsePower && <span className="text-red-500 text-sm">{errors.horsePower}</span>}
        </label>
        <label className="flex flex-col">
          <span>Возраст, лет</span>
          <input
            type="number"
            value={inputs.carAgeYears}
            onChange={(e) => update('carAgeYears', Number(e.target.value))}
            className="border p-1 rounded"
          />
          {errors.carAgeYears && <span className="text-red-500 text-sm">{errors.carAgeYears}</span>}
        </label>
        <label className="flex flex-col">
          <span>Тип топлива</span>
          <select
            value={inputs.fuelType}
            onChange={(e) => update('fuelType', e.target.value)}
            className="border p-1 rounded"
          >
            <option value="gasoline">gasoline</option>
            <option value="diesel">diesel</option>
            <option value="hybrid">hybrid</option>
            <option value="ev">ev</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={inputs.isIndividual}
            onChange={(e) => update('isIndividual', e.target.checked)}
          />
          <span>Физлицо</span>
        </label>
        <label className="flex flex-col">
          <span>Прочие расходы, RUB</span>
          <input
            type="number"
            value={inputs.otherCosts}
            onChange={(e) => update('otherCosts', Number(e.target.value))}
            className="border p-1 rounded"
          />
        </label>
      </div>
    </div>
  );
};

interface RatesEditorProps {
  rates: RateTables;
  setRates: (r: RateTables) => void;
}

const RatesEditor: React.FC<RatesEditorProps> = ({ rates, setRates }) => {
  const [text, setText] = useState(JSON.stringify(rates, null, 2));
  useEffect(() => {
    setText(JSON.stringify(rates, null, 2));
  }, [rates]);
  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    try {
      const parsed = rateTablesSchema.parse(JSON.parse(val));
      setRates(parsed as RateTables);
    } catch {
      // ignore
    }
  };
  const reset = () => setRates(defaultRates);
  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={onChange}
        className="w-full h-40 border p-2 rounded font-mono text-xs"
      />
      <button
        type="button"
        onClick={reset}
        className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
      >
        Сбросить ставки
      </button>
    </div>
  );
};

const ResultsTable: React.FC<{ results: Breakdown | null }> = ({ results }) => {
  if (!results) return null;
  const formatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
  return (
    <table className="table-auto border-collapse w-full text-sm">
      <tbody>
        {Object.entries(results).map(([k, v]) => (
          <tr key={k} className="border-b">
            <td className="p-1 font-medium">{k}</td>
            <td className="p-1 text-right">{formatter.format(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const ImportCalculator: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const initInputs = (): Inputs => {
    const stored = localStorage.getItem('importCalcInputs');
    let initial = { ...defaultInputs };
    if (stored) {
      try {
        initial = { ...initial, ...JSON.parse(stored) };
      } catch {}
    }
    const params = Object.fromEntries(searchParams.entries());
    for (const [k, v] of Object.entries(params)) {
      if (k.startsWith('currencyRates_')) {
        const key = k.split('_')[1] as keyof Inputs['currencyRates'];
        initial.currencyRates[key] = Number(v);
      } else if (k in initial) {
        (initial as any)[k] = k === 'isIndividual' ? v === 'true' : Number.isNaN(Number(v)) ? v : Number(v);
      }
    }
    return initial;
  };

  const initRates = (): RateTables => {
    const stored = localStorage.getItem('importCalcRates');
    if (stored) {
      try {
        return rateTablesSchema.parse(JSON.parse(stored)) as RateTables;
      } catch {}
    }
    return defaultRates;
  };

  const [inputs, setInputs] = useState<Inputs>(initInputs);
  const [rates, setRates] = useState<RateTables>(initRates);
  const [results, setResults] = useState<Breakdown | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem('importCalcInputs', JSON.stringify(inputs));
    const params: Record<string, string> = {};
    Object.entries(inputs).forEach(([k, v]) => {
      if (typeof v === 'object') {
        Object.entries(v as any).forEach(([sk, sv]) => {
          params[`${k}_${sk}`] = String(sv);
        });
      } else {
        params[k] = String(v);
      }
    });
    setSearchParams(params, { replace: true });
  }, [inputs, setSearchParams]);

  useEffect(() => {
    localStorage.setItem('importCalcRates', JSON.stringify(rates));
  }, [rates]);

  const calc = () => {
    const parsed = inputsSchema.safeParse(inputs);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        e[i.path.join('.')] = i.message;
      });
      setErrors(e);
      return;
    }
    setErrors({});
    setResults(calculate(parsed.data, rates));
  };

  const resetAll = () => {
    setInputs({ ...defaultInputs });
    setRates(defaultRates);
    setResults(null);
    setErrors({});
  };

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(rates, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'import-calculator-config.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((t) => {
      try {
        const parsed = rateTablesSchema.parse(JSON.parse(t));
        setRates(parsed as RateTables);
      } catch {
        // ignore
      }
    });
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">CarStats</h1>
          <Link
            to="/"
            className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            На главную
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Данные</h2>
          <InputsForm inputs={inputs} setInputs={setInputs} errors={errors} />
        </section>
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Ставки и коэффициенты</h2>
          <RatesEditor rates={rates} setRates={setRates} />
        </section>
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={calc}
              className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 text-sm"
            >
              Рассчитать
            </button>
            <button
              onClick={resetAll}
              className="rounded bg-gray-200 px-3 py-2 hover:bg-gray-300 text-sm"
            >
              Сбросить
            </button>
            <button
              onClick={exportSettings}
              className="rounded bg-gray-200 px-3 py-2 hover:bg-gray-300 text-sm"
            >
              Экспорт настроек
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded bg-gray-200 px-3 py-2 hover:bg-gray-300 text-sm"
            >
              Импорт настроек
            </button>
            <button
              onClick={copyLink}
              className="rounded bg-gray-200 px-3 py-2 hover:bg-gray-300 text-sm"
            >
              Скопировать ссылку с параметрами
            </button>
            <input
              type="file"
              ref={fileRef}
              accept="application/json"
              className="hidden"
              onChange={importSettings}
            />
          </div>
          <ResultsTable results={results} />
        </section>
      </main>
    </div>
  );
};

export default ImportCalculator;
