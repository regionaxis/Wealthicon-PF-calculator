import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart, ReferenceLine } from 'recharts';
import { Calculator, TrendingUp, DollarSign, Percent, Info, LucideIcon, ChevronDown, ChevronRight } from 'lucide-react';

// --- DATA MODELING ---

// Derived from "WealthiconHorizon calculatioin.csv" and "Summary.csv"
const POLICY_GROWTH_CURVE = [
  { year: 1, guarantee: 0.800, total: 0.800 },
  { year: 2, guarantee: 0.810, total: 0.810 },
  { year: 3, guarantee: 0.810, total: 0.957 },
  { year: 4, guarantee: 0.810, total: 1.034 },
  { year: 5, guarantee: 0.810, total: 1.189 },
  { year: 6, guarantee: 0.811, total: 1.248 },
  { year: 7, guarantee: 0.812, total: 1.312 },
  { year: 8, guarantee: 0.813, total: 1.391 },
  { year: 9, guarantee: 0.815, total: 1.522 },
  { year: 10, guarantee: 0.816, total: 1.652 },
  { year: 11, guarantee: 0.836, total: 1.770 },
  { year: 12, guarantee: 0.856, total: 1.890 },
  { year: 13, guarantee: 0.900, total: 2.050 },
  { year: 14, guarantee: 0.945, total: 2.150 },
  { year: 15, guarantee: 1.000, total: 2.300 },
  { year: 16, guarantee: 1.002, total: 2.450 },
  { year: 17, guarantee: 1.003, total: 2.600 },
  { year: 18, guarantee: 1.004, total: 2.750 },
  { year: 19, guarantee: 1.004, total: 2.867 },
  { year: 20, guarantee: 1.005, total: 3.088 },
  { year: 21, guarantee: 1.007, total: 3.282 },
  { year: 22, guarantee: 1.008, total: 3.490 },
  { year: 23, guarantee: 1.010, total: 3.710 },
  { year: 24, guarantee: 1.012, total: 3.950 },
  { year: 25, guarantee: 1.015, total: 4.200 },
  { year: 26, guarantee: 1.018, total: 4.450 },
  { year: 27, guarantee: 1.020, total: 4.700 },
  { year: 28, guarantee: 1.022, total: 5.000 },
  { year: 29, guarantee: 1.025, total: 5.300 },
  { year: 30, guarantee: 1.028, total: 5.650 },
];

const EXCHANGE_RATE = 7.85;

// --- UTILITY FUNCTIONS ---

const formatHKD = (val: number) => {
  return new Intl.NumberFormat('en-HK', {
    style: 'currency',
    currency: 'HKD',
    maximumFractionDigits: 0,
  }).format(val);
};

const calculateIRR = (cashFlows: number[], guess = 0.1) => {
  const maxIterations = 100;
  const tolerance = 0.00001;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const term = Math.pow(1 + rate, t);
      npv += cashFlows[t] / term;
      derivative -= (t * cashFlows[t]) / (term * (1 + rate));
    }

    const newRate = rate - npv / derivative;
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }
    rate = newRate;
  }
  return rate;
};

// --- COMPONENTS ---

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg">
          <p className="text-slate-700 font-bold mb-2">Year {data.year}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between space-x-6">
               <span className="text-blue-600 font-medium">Gross Return (Equity):</span>
               <span className="font-mono text-slate-700">{formatHKD(data.netSurrenderValueHKD)}</span>
            </div>
            <div className="flex justify-between space-x-6">
               <span className="text-emerald-500 font-medium">Net Profit:</span>
               <span className="font-mono text-emerald-600">{formatHKD(data.trueNetProfitHKD)}</span>
            </div>
             <div className="flex justify-between space-x-6">
               <span className="text-slate-400">Total Cost:</span>
               <span className="text-slate-500 font-mono">{formatHKD(data.totalCostHKD)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

interface KPIProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color?: 'blue' | 'amber' | 'green';
}

const KPI: React.FC<KPIProps> = ({ title, value, subtext, icon: Icon, color = "blue" }) => {
  // Mapping for Tailwind classes to ensure they are detected correctly
  const styles = {
    blue: {
      border: 'border-l-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600'
    },
    amber: {
      border: 'border-l-amber-500',
      bg: 'bg-amber-50',
      text: 'text-amber-600'
    },
    green: {
      border: 'border-l-green-500',
      bg: 'bg-green-50',
      text: 'text-green-600'
    }
  };

  const currentStyle = styles[color];

  return (
    <div className={`bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start space-x-4 border-l-4 ${currentStyle.border}`}>
      <div className={`p-3 rounded-lg ${currentStyle.bg} ${currentStyle.text}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};

interface InputSliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  prefix?: string;
}

const InputSlider: React.FC<InputSliderProps> = ({ label, value, onChange, min, max, step, suffix = "", prefix = "" }) => (
  <div className="mb-6">
    <div className="flex justify-between mb-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
    />
  </div>
);

interface InputNumberProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  prefix?: string;
}

const InputNumber: React.FC<InputNumberProps> = ({ label, value, onChange, prefix = "" }) => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <div className="relative rounded-md shadow-sm">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-slate-500 sm:text-sm">{prefix}</span>
          </div>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md py-2 ${prefix ? 'pl-7' : 'pl-3'}`}
        />
      </div>
    </div>
  );

export default function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule'>('dashboard');
  
  // Inputs (Yellow Cells)
  const [premiumUSD, setPremiumUSD] = useState(400000);
  const [ltv, setLtv] = useState(90); // Percentage
  
  // Interest Rate Logic
  const [interestRate, setInterestRate] = useState(4.00); // Base/Global Percentage
  // Initialize with 30 years of the default rate
  const [customRates, setCustomRates] = useState<number[]>(Array(30).fill(4.00));
  const [showYearlyRates, setShowYearlyRates] = useState(false);

  const [premiumDiscount, setPremiumDiscount] = useState(5.00); // Percentage
  
  // Handling Fee (Hardcoded as per Excel 0.25%)
  const handlingFeeRate = 0.25;

  // Handlers
  const handleGlobalInterestChange = (val: number) => {
    setInterestRate(val);
    setCustomRates(Array(30).fill(val));
  };

  const handleCustomRateChange = (index: number, val: number) => {
    const newRates = [...customRates];
    newRates[index] = val;
    setCustomRates(newRates);
  };

  // --- CALCULATIONS ---

  const results = useMemo(() => {
    // 1. Initial Setup
    const basicPlanPremiumHKD = premiumUSD * EXCHANGE_RATE;
    
    // Day 1 Surrender Value ~80% of Premium based on logic
    const day1SurrenderValueHKD = basicPlanPremiumHKD * 0.80; 

    // Financing Calculations
    const loanAmountHKD = day1SurrenderValueHKD * (ltv / 100);
    
    // Discount
    const discountAmountHKD = basicPlanPremiumHKD * (premiumDiscount / 100);
    
    // Initial Outlay
    const handlingFeeHKD = loanAmountHKD * (handlingFeeRate / 100);
    const initialOutlayHKD = (basicPlanPremiumHKD - discountAmountHKD) - loanAmountHKD + handlingFeeHKD;

    // Calculate interest cost for each year based on customRates
    const yearlyInterestCostsHKD = customRates.map(rate => loanAmountHKD * (rate / 100));

    let accumulatedInterestHKD = 0;

    // 2. Projection Loop
    const projections = POLICY_GROWTH_CURVE.map((curve, index) => {
      const year = curve.year;
      
      // Value Calculations
      const totalSurrenderValueHKD = basicPlanPremiumHKD * curve.total;
      const guaranteeValueHKD = basicPlanPremiumHKD * curve.guarantee;
      const nonGuaranteeValueHKD = totalSurrenderValueHKD - guaranteeValueHKD;
      
      // Debt Position
      const currentLoanHKD = loanAmountHKD; 
      
      // Net Equity
      const netSurrenderValueHKD = totalSurrenderValueHKD - currentLoanHKD;
      
      // Costs
      // Use specific interest for the current year (index = year - 1)
      const currentYearInterestHKD = yearlyInterestCostsHKD[index];
      accumulatedInterestHKD += currentYearInterestHKD;

      const totalCostHKD = initialOutlayHKD + accumulatedInterestHKD;
      
      // Profit
      const trueNetProfitHKD = netSurrenderValueHKD - totalCostHKD;

      // ROI % (Simple)
      const roiPercentage = totalCostHKD !== 0 ? (trueNetProfitHKD / totalCostHKD) * 100 : 0;
      // Annualized ROI % (Simple Average)
      const annualizedRoiPercentage = year > 0 ? roiPercentage / year : 0;

      // IRR Calculation for this specific year (Exit Strategy)
      // Stream: T0: -InitialOutlay, T1..Tn-1: -Interest, Tn: +(NetSurrender - Interest)
      // Construct Cashflow Array using historical rates up to this year
      const cashFlows = [-initialOutlayHKD];
      for(let i=0; i < year; i++) {
        const interestPayment = yearlyInterestCostsHKD[i];
        if (i === year - 1) {
            // Final year: Pay interest, receive Net Surrender Value
            cashFlows.push(netSurrenderValueHKD - interestPayment);
        } else {
            // Interim years: Pay interest
            cashFlows.push(-interestPayment);
        }
      }
      
      const irr = calculateIRR(cashFlows) * 100;

      return {
        year,
        guaranteeValueHKD,
        nonGuaranteeValueHKD,
        totalSurrenderValueHKD,
        netSurrenderValueHKD,
        totalCostHKD,
        trueNetProfitHKD,
        roiPercentage,
        annualizedRoiPercentage,
        irr,
        annualInterestCostHKD: currentYearInterestHKD, // Specific to this year
        initialOutlayHKD
      };
    });

    // Determine Breakeven
    const breakevenYear = projections.find(p => p.trueNetProfitHKD > 0)?.year || "30+";
    
    const isVariableRates = customRates.some(r => r !== interestRate);

    return {
      initialOutlayHKD,
      loanAmountHKD,
      day1SurrenderValueHKD,
      firstYearInterestCostHKD: yearlyInterestCostsHKD[0],
      breakevenYear,
      projections,
      isVariableRates
    };

  }, [premiumUSD, ltv, interestRate, customRates, premiumDiscount]);


  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Wealthicon<span className="text-blue-600">Horizon</span> <span className="text-slate-400 font-normal">| Premium Financing</span></h1>
          </div>
          <div className="flex space-x-4">
             <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
             >
                Dashboard
             </button>
             <button 
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'schedule' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
             >
                Data Schedule
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR: CONTROLS */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <div className="flex items-center space-x-2 mb-6 text-slate-800">
                <Calculator size={20} />
                <h2 className="font-bold text-lg">Configuration</h2>
              </div>

              {/* Input Group */}
              <InputNumber 
                label="Basic Plan Premium (USD)" 
                value={premiumUSD} 
                onChange={setPremiumUSD} 
                prefix="$"
              />
              
              <div className="border-t border-slate-100 my-4 pt-4"></div>

              <InputSlider 
                label="LTV Ratio (Bank Loan)" 
                value={ltv} 
                min={0} max={95} step={1} 
                onChange={setLtv} 
                suffix="%" 
              />

              {/* Interest Rate Section with Custom Toggle */}
              <div>
                <InputSlider 
                  label="Financing Interest Rate" 
                  value={interestRate} 
                  min={1} max={10} step={0.01} 
                  onChange={handleGlobalInterestChange} 
                  suffix="%" 
                />
                
                <button 
                  onClick={() => setShowYearlyRates(!showYearlyRates)}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium -mt-2 mb-4 focus:outline-none"
                >
                  {showYearlyRates ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="ml-1">Customize Yearly Rates</span>
                </button>

                {showYearlyRates && (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 mb-6 max-h-60 overflow-y-auto">
                    <p className="text-xs text-slate-500 mb-2 font-medium">Override rates by policy year:</p>
                    <div className="grid grid-cols-3 gap-2">
                        {customRates.map((rate, idx) => (
                          <div key={idx} className="flex flex-col">
                            <label className="text-[10px] text-slate-400">Y{idx + 1}</label>
                            <div className="flex items-center">
                                <input 
                                  type="number" 
                                  value={rate}
                                  step={0.1}
                                  onChange={(e) => handleCustomRateChange(idx, parseFloat(e.target.value) || 0)}
                                  className="w-full text-xs border border-slate-300 rounded px-1 py-1 text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                                <span className="text-[10px] text-slate-400 ml-0.5">%</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 my-4 pt-4"></div>

              <InputSlider 
                label="Premium Discount" 
                value={premiumDiscount} 
                min={0} max={20} step={0.5} 
                onChange={setPremiumDiscount} 
                suffix="%" 
              />
              
              <div className="bg-blue-50 rounded-lg p-4 mt-6 text-sm text-blue-800">
                <p className="font-semibold mb-1 flex items-center"><Info size={14} className="mr-1"/> Summary Note</p>
                <p>Plan currency is HKD (Rate: {EXCHANGE_RATE}). Handling fee (0.25%) is included in the Initial Outlay calculation.</p>
              </div>

            </div>
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPI 
                title="Initial Outlay (HKD)" 
                value={formatHKD(results.initialOutlayHKD)} 
                subtext="Cash required Day 1"
                icon={DollarSign}
                color="blue"
              />
              <KPI 
                title="Annual Interest (HKD)" 
                value={formatHKD(results.firstYearInterestCostHKD)} 
                subtext={results.isVariableRates ? "Variable Rates (Year 1 shown)" : `@ ${interestRate.toFixed(2)}% p.a.`}
                icon={Percent}
                color="amber"
              />
              <KPI 
                title="Breakeven Year" 
                value={`Year ${results.breakevenYear}`} 
                subtext="Net Profit > 0"
                icon={TrendingUp}
                color="green"
              />
            </div>

            {activeTab === 'dashboard' ? (
              <>
                 {/* Main Chart Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Net Equity Analysis</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={results.projections} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="year" stroke="#94a3b8" tickLine={false} tick={{fontSize: 12}} label={{ value: 'Policy Year', position: 'insideBottom', offset: -10 }} />
                        <YAxis stroke="#94a3b8" tickLine={false} tick={{fontSize: 12}} tickFormatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36}/>
                        
                        <Area 
                            type="monotone" 
                            dataKey="totalCostHKD" 
                            name="Total Cost (Outlay + Interest)" 
                            fill="#f1f5f9" 
                            stroke="#94a3b8" 
                            strokeDasharray="5 5"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="netSurrenderValueHKD" 
                            name="Gross Return (Equity)" 
                            stroke="#2563eb" 
                            strokeWidth={3} 
                            dot={false}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="totalSurrenderValueHKD" 
                            name="Gross Policy Value" 
                            stroke="#10b981" 
                            strokeWidth={2} 
                            dot={false}
                            hide={true} // Hidden by default to reduce clutter
                        />
                        <ReferenceLine 
                            y={results.initialOutlayHKD} 
                            stroke="#f97316" 
                            strokeDasharray="4 4" 
                            label={{ value: 'Initial Outlay', position: 'insideBottomRight', fill: '#f97316', fontSize: 12 }} 
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* IRR Chart */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">IRR & Total Return Projection (%)</h3>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={results.projections.filter(p => p.year >= 1).map(p => ({
                            ...p,
                            irr: p.irr > 0 ? p.irr : null,
                            roi: p.annualizedRoiPercentage > 0 ? p.annualizedRoiPercentage : null
                        }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                            <XAxis dataKey="year" stroke="#94a3b8" tickLine={false} />
                            <YAxis stroke="#94a3b8" tickLine={false} domain={['auto', 'auto']} unit="%" />
                            <Tooltip formatter={(val: number) => val ? val.toFixed(2) + "%" : ""} labelFormatter={(label) => `Year ${label}`}/>
                            <Legend iconType="circle" />
                            <Line type="monotone" dataKey="irr" name="IRR" stroke="#f59e0b" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="roi" name="Total Return / Year" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                   {/* Gross Return Chart */}
                   <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Gross Return (Equity)</h3>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={results.projections}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                            <XAxis dataKey="year" stroke="#94a3b8" tickLine={false} />
                            <YAxis stroke="#94a3b8" tickLine={false} tickFormatter={(val: number) => `$${(val / 1000000).toFixed(1)}M`}/>
                            <Tooltip 
                                cursor={{fill: '#f1f5f9'}}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(val: number) => [formatHKD(val), "Net Equity"]}
                                labelFormatter={(label) => `Year ${label}`}
                            />
                            <Bar dataKey="netSurrenderValueHKD" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Surrender Value - Loan"/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            ) : (
                // TABLE VIEW
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">Detailed Schedule</h3>
                        <span className="text-xs text-slate-500 bg-white border px-2 py-1 rounded">Currency: HKD</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Year</th>
                                    <th className="px-6 py-3 text-right">Net Equity</th>
                                    <th className="px-6 py-3 text-right">Total Cost</th>
                                    <th className="px-6 py-3 text-right">Net Profit</th>
                                    <th className="px-6 py-3 text-right">IRR</th>
                                    <th className="px-6 py-3 text-right">ROI</th>
                                    <th className="px-6 py-3 text-right">Int. Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {results.projections.map((row, idx) => (
                                    <tr key={row.year} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-slate-800">{row.year}</td>
                                        <td className="px-6 py-3 text-right font-medium text-blue-600">{formatHKD(row.netSurrenderValueHKD)}</td>
                                        <td className="px-6 py-3 text-right text-slate-500">{formatHKD(row.totalCostHKD)}</td>
                                        <td className={`px-6 py-3 text-right ${row.trueNetProfitHKD > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {formatHKD(row.trueNetProfitHKD)}
                                        </td>
                                        <td className="px-6 py-3 text-right text-slate-700">{row.irr.toFixed(2)}%</td>
                                        <td className="px-6 py-3 text-right text-slate-700">{row.roiPercentage.toFixed(2)}%</td>
                                        <td className="px-6 py-3 text-right text-slate-400 text-xs">{customRates[idx].toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}