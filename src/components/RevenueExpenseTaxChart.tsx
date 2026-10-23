// src/components/RevenueExpenseTaxChart.tsx
import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Area,
} from 'recharts';
import { formatPaiseToRupees } from '../utils/calculations.ts';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Scale,
  DollarSign,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { BusinessStage } from '../types.ts';

interface RevenueExpenseTaxChartProps {
  currentStage: BusinessStage;
  prototypeCostRupees: number;
  activePayrollMonthlyRupees: number;
  corporateTaxRatePercent?: number; // e.g. 25
}

export const RevenueExpenseTaxChart: React.FC<RevenueExpenseTaxChartProps> = ({
  currentStage,
  prototypeCostRupees,
  activePayrollMonthlyRupees,
  corporateTaxRatePercent = 25,
}) => {
  const [chartMode, setChartMode] = useState<'stages' | 'timeline'>('stages');

  // Stage Comparison Dataset
  // 1. Prototype Stage: Self-funded R&D, ₹0 sales, prototype BOM ~15.48L, active crew ~1.65L/mo, ₹0 tax
  // 2. Pilot & Selling Stage: ~8 units sold @ ₹6.5L = ₹52L revenue, ₹30.4L BOM, ₹7.8L opex, ~₹3.4L tax (25%), ~₹10.4L net profit
  // 3. Full Commercial Scale: 30 units sold @ ₹6.5L = ₹195L revenue, ₹114L BOM, ₹26.5L opex, ~₹13.6L tax (25%), ~₹40.9L net profit
  const stageData = [
    {
      stageName: 'Stage 1: Prototype',
      shortName: 'Prototype',
      revenueLakhs: 0,
      expensesLakhs: Number(((prototypeCostRupees + activePayrollMonthlyRupees * 3) / 100000).toFixed(2)),
      taxLakhs: 0,
      netProfitLakhs: -Number(((prototypeCostRupees + activePayrollMonthlyRupees * 3) / 100000).toFixed(2)),
      revenuePaise: '0',
      expensesPaise: Math.round(prototypeCostRupees * 100 + activePayrollMonthlyRupees * 300).toString(),
      taxPaise: '0',
      netProfitPaise: (-Math.round(prototypeCostRupees * 100 + activePayrollMonthlyRupees * 300)).toString(),
      description: 'Prototype bench fabrication (64 parts + 5 crew members). Zero commercial sales & zero tax.',
    },
    {
      stageName: 'Stage 2: Pilot Sales',
      shortName: 'Pilot Sales',
      revenueLakhs: 52.0, // 8 units @ 6.5L
      expensesLakhs: 38.2, // Direct BOM (30.4L) + 8 core leaders opex (7.8L)
      taxLakhs: Number(((52.0 - 38.2) * (corporateTaxRatePercent / 100)).toFixed(2)), // 25% on 13.8L PBT = ~3.45L
      netProfitLakhs: Number(((52.0 - 38.2) * (1 - corporateTaxRatePercent / 100)).toFixed(2)), // ~10.35L
      revenuePaise: '520000000',
      expensesPaise: '382000000',
      taxPaise: '34500000',
      netProfitPaise: '103500000',
      description: 'First commercial units sold (8 units). Tax is deducted on taxable profit before partner splits.',
    },
    {
      stageName: 'Stage 3: Full Scale',
      shortName: 'Full Scale',
      revenueLakhs: 195.0, // 30 units @ 6.5L
      expensesLakhs: 140.5, // Bulk BOM (114L) + 24 staff payroll & factory (26.5L)
      taxLakhs: Number(((195.0 - 140.5) * (corporateTaxRatePercent / 100)).toFixed(2)), // 25% on 54.5L PBT = ~13.62L
      netProfitLakhs: Number(((195.0 - 140.5) * (1 - corporateTaxRatePercent / 100)).toFixed(2)), // ~40.88L
      revenuePaise: '1950000000',
      expensesPaise: '1405000000',
      taxPaise: '136250000',
      netProfitPaise: '408750000',
      description: '30+ unit annual run. Full 24 staff, factory shed, financier returns, and corporate tax deducted.',
    },
  ];

  // 12-Month Projected Trajectory Dataset
  const timelineData = [
    { period: 'M1 (Proto)', revenueLakhs: 0, expensesLakhs: 5.2, taxLakhs: 0, netProfitLakhs: -5.2 },
    { period: 'M2 (Proto)', revenueLakhs: 0, expensesLakhs: 5.8, taxLakhs: 0, netProfitLakhs: -5.8 },
    { period: 'M3 (Proto)', revenueLakhs: 0, expensesLakhs: 4.5, taxLakhs: 0, netProfitLakhs: -4.5 },
    { period: 'M4 (Test)', revenueLakhs: 0, expensesLakhs: 2.5, taxLakhs: 0, netProfitLakhs: -2.5 },
    { period: 'M5 (Orders)', revenueLakhs: 6.5, expensesLakhs: 4.8, taxLakhs: 0.42, netProfitLakhs: 1.28 },
    { period: 'M6 (Pilot)', revenueLakhs: 13.0, expensesLakhs: 9.6, taxLakhs: 0.85, netProfitLakhs: 2.55 },
    { period: 'M7 (Pilot)', revenueLakhs: 19.5, expensesLakhs: 14.4, taxLakhs: 1.28, netProfitLakhs: 3.82 },
    { period: 'M8 (Scaling)', revenueLakhs: 26.0, expensesLakhs: 19.2, taxLakhs: 1.70, netProfitLakhs: 5.10 },
    { period: 'M9 (Factory)', revenueLakhs: 32.5, expensesLakhs: 24.0, taxLakhs: 2.12, netProfitLakhs: 6.38 },
    { period: 'M10 (Full)', revenueLakhs: 39.0, expensesLakhs: 28.5, taxLakhs: 2.62, netProfitLakhs: 7.88 },
    { period: 'M11 (Full)', revenueLakhs: 45.5, expensesLakhs: 33.2, taxLakhs: 3.08, netProfitLakhs: 9.22 },
    { period: 'M12 (Scale)', revenueLakhs: 52.0, expensesLakhs: 37.8, taxLakhs: 3.55, netProfitLakhs: 10.65 },
  ];

  const currentDataset = chartMode === 'stages' ? stageData : timelineData;
  const xAxisKey = chartMode === 'stages' ? 'shortName' : 'period';

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const rev = payload.find((p: any) => p.dataKey === 'revenueLakhs')?.value || 0;
      const exp = payload.find((p: any) => p.dataKey === 'expensesLakhs')?.value || 0;
      const tax = payload.find((p: any) => p.dataKey === 'taxLakhs')?.value || 0;
      const net = payload.find((p: any) => p.dataKey === 'netProfitLakhs')?.value || 0;

      return (
        <div className="bg-slate-950/95 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 min-w-56 font-sans">
          <div className="font-bold text-white border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              Tax Rate: {corporateTaxRatePercent}%
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-sky-400">
              <span>Gross Sales Revenue:</span>
              <span className="font-bold font-mono">₹{rev.toFixed(2)}L</span>
            </div>

            <div className="flex justify-between items-center text-rose-400">
              <span>Operating & BOM Costs:</span>
              <span className="font-bold font-mono">-₹{exp.toFixed(2)}L</span>
            </div>

            <div className="flex justify-between items-center text-amber-400">
              <span>Estimated Tax ({corporateTaxRatePercent}%):</span>
              <span className="font-bold font-mono">
                {tax > 0 ? `-₹${tax.toFixed(2)}L` : '₹0.00L'}
              </span>
            </div>

            <div className="flex justify-between items-center text-emerald-400 font-bold pt-1.5 border-t border-slate-800">
              <span>Net Bottom Line Profit:</span>
              <span className="font-mono text-sm">
                {net >= 0 ? `+₹${net.toFixed(2)}L` : `-₹${Math.abs(net).toFixed(2)}L`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-7 shadow-xl space-y-6">
      {/* Header and Toggle Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Revenue vs. Expenses & Tax Deductions
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  Interactive Recharts
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualize how operational phase scaling and corporate tax deductions ({corporateTaxRatePercent}%) impact your bottom-line net profit.
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 self-stretch sm:self-auto">
          <button
            onClick={() => setChartMode('stages')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              chartMode === 'stages'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3 Stages View</span>
          </button>

          <button
            onClick={() => setChartMode('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              chartMode === 'timeline'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>12-Month Trajectory</span>
          </button>
        </div>
      </div>

      {/* Recharts Visualization */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={currentDataset as any}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(v) => `₹${v}L`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }}
              formatter={(value) => {
                if (value === 'revenueLakhs') return <span className="text-sky-300">Gross Sales Revenue</span>;
                if (value === 'expensesLakhs') return <span className="text-rose-300">All Expenses (BOM + Opex)</span>;
                if (value === 'taxLakhs') return <span className="text-amber-300">Corporate Tax Paid ({corporateTaxRatePercent}%)</span>;
                if (value === 'netProfitLakhs') return <span className="text-emerald-300 font-bold">Net Bottom Line (PAT)</span>;
                return value;
              }}
            />

            {/* Bars for Revenue & Expenses */}
            <Bar dataKey="revenueLakhs" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="expensesLakhs" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="taxLakhs" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={40} />

            {/* Line for Net Bottom Line Profit */}
            <Line
              type="monotone"
              dataKey="netProfitLakhs"
              stroke="#34d399"
              strokeWidth={3}
              dot={{ fill: '#34d399', r: 4, strokeWidth: 1, stroke: '#064e3b' }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stage Bottom-Line Insights Callout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
        <div className={`p-3.5 rounded-xl border transition ${currentStage === 'prototype' ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-slate-950/60 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <span>🛠️ Stage 1: Prototype</span>
              {currentStage === 'prototype' && (
                <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">CURRENT</span>
              )}
            </span>
            <span className="text-rose-400 font-mono">-₹17.13L</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Initial fabrication phase. Zero commercial sales and zero tax liability.
          </p>
        </div>

        <div className={`p-3.5 rounded-xl border transition ${currentStage === 'selling' ? 'bg-sky-950/40 border-sky-500/50' : 'bg-slate-950/60 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <span>⚡ Stage 2: Pilot Sales</span>
              {currentStage === 'selling' && (
                <span className="text-[9px] bg-sky-500 text-slate-950 font-black px-1.5 py-0.2 rounded">CURRENT</span>
              )}
            </span>
            <span className="text-emerald-400 font-mono">+₹10.35L PAT</span>
          </div>
          <p className="text-[11px] text-slate-400">
            8 units sold. ₹3.45L tax deducted from profit before partner distribution.
          </p>
        </div>

        <div className={`p-3.5 rounded-xl border transition ${currentStage === 'full' ? 'bg-purple-950/40 border-purple-500/50' : 'bg-slate-950/60 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <span>🏭 Stage 3: Full Scale</span>
              {currentStage === 'full' && (
                <span className="text-[9px] bg-purple-500 text-slate-950 font-black px-1.5 py-0.2 rounded">CURRENT</span>
              )}
            </span>
            <span className="text-emerald-400 font-mono">+₹40.88L PAT</span>
          </div>
          <p className="text-[11px] text-slate-400">
            30+ units sold. ₹13.62L tax deducted on ₹54.5L taxable business profit.
          </p>
        </div>
      </div>
    </div>
  );
};
