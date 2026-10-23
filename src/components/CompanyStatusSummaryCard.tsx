// src/components/CompanyStatusSummaryCard.tsx
import React from 'react';
import { BusinessStage, Expense, Loan } from '../types.ts';
import { formatPaiseToRupees } from '../utils/calculations.ts';
import {
  ShieldCheck,
  Building2,
  Receipt,
  Scale,
  Wallet,
  HandCoins,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  Lock,
  Unlock,
  Coins,
  Activity,
  Award,
} from 'lucide-react';

interface CompanyStatusSummaryCardProps {
  currentStage: BusinessStage;
  expenses: Expense[];
  loans: Loan[];
  isLoansActive: boolean;
  founderFundsPaise: string;
  moneyAlreadyPaidPaise: bigint;
  corporateTaxRatePercent?: number;
  onEditCapital?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const CompanyStatusSummaryCard: React.FC<CompanyStatusSummaryCardProps> = ({
  currentStage,
  expenses,
  loans,
  isLoansActive,
  founderFundsPaise,
  moneyAlreadyPaidPaise,
  corporateTaxRatePercent = 25,
  onEditCapital,
  onNavigateTab,
}) => {
  // 1. Current Operational Phase info
  const stageInfo = {
    prototype: {
      name: 'Stage 1: Prototype Fabrication',
      short: 'Prototype',
      badge: '🛠️ PROTOTYPE PHASE',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description: 'Single-unit 30kVA acoustic generator fabrication with 5 core crew members. 100% self-funded capital.',
    },
    selling: {
      name: 'Stage 2: Pilot Sales & Commercial Launch',
      short: 'Pilot Sales',
      badge: '⚡ PILOT SALES PHASE',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      description: 'Initial customer orders & generator unit deliveries. 8 Core Leaders on equity profit share.',
    },
    full: {
      name: 'Stage 3: Full Commercial Scale Production',
      short: 'Full Scale',
      badge: '🏭 FULL COMMERCIAL PHASE',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      description: '30+ unit annual mass assembly, complete 24-member company active, factory shed, loans & corporate tax.',
    },
  }[currentStage] || {
    name: 'Stage 1: Prototype',
    short: 'Prototype',
    badge: '🛠️ PROTOTYPE PHASE',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Prototype bench fabrication.',
  };

  // 2. Total Tax Paid to Date (Calculated from recorded tax expenses)
  const taxExpenses = expenses.filter(
    (e) =>
      e.category === 'Corporate Income Tax' ||
      e.category === 'Statutory Taxes & GST' ||
      e.subCategory?.toLowerCase().includes('tax') ||
      e.vendorName?.toLowerCase().includes('income tax department')
  );
  const totalTaxPaidPaise = taxExpenses.reduce((acc, e) => acc + BigInt(e.amount || 0), 0n);

  // 3. Breakdown of Active Loans versus Remaining Founder Capital
  const totalLoanPrincipal = loans.reduce((acc, l) => acc + BigInt(l.principalAmount || 0), 0n);
  const totalLoanOutstanding = loans.reduce((acc, l) => acc + BigInt(l.outstandingBalance || 0), 0n);
  const totalPrincipalRepaid = loans.reduce((acc, l) => acc + BigInt(l.principalRepaid || 0), 0n);

  const initialFounderFunds = BigInt(founderFundsPaise || '200000000');
  const remainingFounderCapital =
    initialFounderFunds > moneyAlreadyPaidPaise ? initialFounderFunds - moneyAlreadyPaidPaise : 0n;
  const founderFundsUtilizedPercent =
    initialFounderFunds > 0n
      ? Math.min(100, Number((moneyAlreadyPaidPaise * 10000n) / initialFounderFunds) / 100)
      : 0;

  // Total Capital Base (Remaining Founder Equity + Active Loan Debt)
  const activeDebtPaise = isLoansActive ? totalLoanOutstanding : 0n;
  const totalCurrentCapitalBase = remainingFounderCapital + activeDebtPaise;
  const equityRatioPercent =
    totalCurrentCapitalBase > 0n
      ? Number((remainingFounderCapital * 10000n) / totalCurrentCapitalBase) / 100
      : 100;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 lg:p-7 shadow-xl space-y-6">
      {/* Top Banner: Company Status Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Company Status Summary
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${stageInfo.badgeColor}`}>
                {stageInfo.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live corporate snapshot: operational phase, tax obligations, and equity vs. debt structure.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>FY 2026-27 Active Ledger</span>
        </div>
      </div>

      {/* 3 Status Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Current Operational Phase */}
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center justify-between">
              <span>Operational Phase</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </span>
            <div className="text-xl font-black text-white mt-1">
              {stageInfo.name}
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {stageInfo.description}
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Status Rule:</span>
            <span className="text-emerald-300 font-bold">
              {currentStage === 'prototype' ? 'Self-Funded Only' : currentStage === 'selling' ? 'Pilot Orders Active' : 'Commercial Mass Scale'}
            </span>
          </div>
        </div>

        {/* Metric 2: Total Tax Paid to Date */}
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1 flex items-center justify-between">
              <span>Total Tax Paid to Date</span>
              <Receipt className="w-4 h-4 text-amber-400" />
            </span>
            <div className="text-2xl font-black text-amber-300 font-mono my-1">
              {formatPaiseToRupees(totalTaxPaidPaise.toString())}
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {currentStage === 'prototype'
                ? 'Prototype phase has ₹0 commercial sales, so statutory corporate income tax liability is currently Nil.'
                : `Tax rate configured at ${corporateTaxRatePercent}%. Deducted from taxable profit after all operational expenses.`}
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Statutory Tax Rate:</span>
            <span className="text-amber-300 font-bold font-mono">
              {corporateTaxRatePercent}% Corporate Rate
            </span>
          </div>
        </div>

        {/* Metric 3: Active Loans vs. Remaining Founder Capital */}
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block mb-1 flex items-center justify-between">
              <span>Capital & Debt Structure</span>
              <Scale className="w-4 h-4 text-sky-400" />
            </span>

            {/* Visual Balance Bar */}
            <div className="my-2 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <Wallet className="w-3.5 h-3.5" /> Founder Equity: {equityRatioPercent.toFixed(0)}%
                </span>
                <span className="flex items-center gap-1 font-bold text-amber-400">
                  <HandCoins className="w-3.5 h-3.5" /> Debt: {(100 - equityRatioPercent).toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${equityRatioPercent}%` }}
                  title={`Founder Capital: ${equityRatioPercent.toFixed(0)}%`}
                />
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${100 - equityRatioPercent}%` }}
                  title={`Loan Debt: ${(100 - equityRatioPercent).toFixed(0)}%`}
                />
              </div>
            </div>

            {/* Breakdown numbers */}
            <div className="space-y-1 text-xs pt-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Remaining Founder Capital:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {formatPaiseToRupees(remainingFounderCapital.toString())}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Active Financier Loans:</span>
                {isLoansActive ? (
                  <span className="font-bold text-amber-400 font-mono">
                    {formatPaiseToRupees(totalLoanOutstanding.toString())}
                  </span>
                ) : (
                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-500" /> ₹0 (Paused)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Capital Injected:</span>
            <span className="text-slate-200 font-bold font-mono">
              {formatPaiseToRupees(initialFounderFunds.toString())}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
