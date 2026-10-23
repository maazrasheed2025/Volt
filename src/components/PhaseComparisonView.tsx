// src/components/PhaseComparisonView.tsx
import React from 'react';
import {
  Employee,
  ProductionRecord,
  BonusRate,
  InsurancePolicy,
  Expense,
  Loan,
} from '../types.ts';
import {
  formatPaiseToRupees,
  calculateSalaryAndPF,
  calculateEmployeeBonus,
  calculateEmployeeInsurance,
  calculateGrossProfit,
  checkSection197Compliance,
} from '../utils/calculations.ts';
import {
  Layers,
  ArrowRight,
  TrendingUp,
  Users,
  Building,
  CheckCircle,
} from 'lucide-react';

interface PhaseComparisonViewProps {
  employees: Employee[];
  production: ProductionRecord[];
  bonusRates: BonusRate[];
  insurancePolicies: InsurancePolicy[];
  expenses: Expense[];
  loans: Loan[];
}

export const PhaseComparisonView: React.FC<PhaseComparisonViewProps> = ({
  employees,
  production,
  bonusRates,
  insurancePolicies,
  expenses,
  loans,
}) => {
  // Bonus map
  const bonusRatesMap: Record<string, string> = {};
  bonusRates.forEach((b) => {
    bonusRatesMap[b.category] = b.bonusPerUnit;
  });

  const insuranceMap: Record<string, string> = {};
  insurancePolicies.forEach((i) => {
    insuranceMap[i.category] = i.premiumPerPersonPerYear;
  });

  // Gross profit
  const grossProfitCalc = calculateGrossProfit(production);
  const totalUnits = grossProfitCalc.totalUnits;

  // Phase 1: Small Core Team
  const phase1Emps = employees.filter((e) => e.phase === 1 && e.status === 'active');
  let p1SalCost = 0n;
  let p1Bonus = 0n;
  let p1Insurance = 0n;
  phase1Emps.forEach((e) => {
    const s = calculateSalaryAndPF(e.monthlySalary);
    p1SalCost += BigInt(s.totalSalaryCostAnnual);
    p1Bonus += calculateEmployeeBonus(e, totalUnits, bonusRatesMap);
    p1Insurance += calculateEmployeeInsurance(e, insuranceMap);
  });
  const p1TotalPayroll = p1SalCost + p1Bonus + p1Insurance;

  const p1Expenses = expenses.filter((e) => e.phase === 1);
  const p1TotalOpex = p1Expenses.reduce((acc, curr) => acc + BigInt(curr.amount || 0), 0n);

  // Phase 2: Full 95-Staff Factory Projection
  const phase2Emps = employees.filter((e) => e.status === 'active');
  let p2SalCost = 0n;
  let p2Bonus = 0n;
  let p2Insurance = 0n;
  phase2Emps.forEach((e) => {
    const s = calculateSalaryAndPF(e.monthlySalary);
    p2SalCost += BigInt(s.totalSalaryCostAnnual);
    p2Bonus += calculateEmployeeBonus(e, totalUnits, bonusRatesMap);
    p2Insurance += calculateEmployeeInsurance(e, insuranceMap);
  });
  const p2TotalPayroll = p2SalCost + p2Bonus + p2Insurance;

  // Phase 2 opex scaled (actual booked + 3x factory baseline multiplier)
  const p2TotalOpex = p1TotalOpex * 3n;

  // Loan EMI
  const totalLoanEMIAnnual = loans.reduce((acc, l) => acc + BigInt(l.emiAmount || 0) * 12n, 0n);

  // Profitability comparison
  const p1NetBeforeTax = BigInt(grossProfitCalc.grossProfit) - p1TotalPayroll - p1TotalOpex;
  const p2NetBeforeTax = BigInt(grossProfitCalc.grossProfit) * 3n - p2TotalPayroll - p2TotalOpex - totalLoanEMIAnnual;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Phase 1 vs. Phase 2 Financial Modeling & Transition Comparison
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Evaluating financial delta from initial bootstrap core team (12 staff) to full-scale manufacturing plant (95 employees + Capex debt service).
          </p>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phase 1 Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="px-2.5 py-1 rounded bg-blue-900/60 text-blue-300 border border-blue-700 text-xs font-bold">
              Phase 1: Small Core Team
            </span>
            <span className="text-xs text-slate-400">Current Operating State</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-700/60">
              <span className="text-slate-400">Active Headcount:</span>
              <strong className="text-white">{phase1Emps.length} core personnel</strong>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-700/60">
              <span className="text-slate-400">Annual Payroll & PF (CTC):</span>
              <strong className="text-indigo-300">{formatPaiseToRupees(p1TotalPayroll)}</strong>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-700/60">
              <span className="text-slate-400">Annual Operating Expenses (Opex):</span>
              <strong className="text-amber-300">{formatPaiseToRupees(p1TotalOpex)}</strong>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-700/60">
              <span className="text-slate-400">Debt Service (EMI):</span>
              <strong className="text-slate-400">₹0 (Self-funded)</strong>
            </div>

            <div className="flex justify-between py-3 border-t border-slate-700 text-sm">
              <span className="text-slate-300 font-bold">Net Margin (at current output):</span>
              <strong className="text-emerald-400 font-bold">
                {formatPaiseToRupees(p1NetBeforeTax)}
              </strong>
            </div>
          </div>
        </div>

        {/* Phase 2 Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="px-2.5 py-1 rounded bg-purple-900/60 text-purple-300 border border-purple-700 text-xs font-bold">
              Phase 2: Full 95-Staff Factory
            </span>
            <span className="text-xs text-slate-400">Industrial Scale Projection</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-700/60">
              <span className="text-slate-400">Planned Headcount:</span>
              <strong className="text-white">95 total factory workforce</strong>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-700/60">
              <span className="text-slate-400">Annual Payroll & PF (CTC):</span>
              <strong className="text-indigo-300">{formatPaiseToRupees(p2TotalPayroll)}</strong>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-700/60">
              <span className="text-slate-400">Scaled Factory Opex (Power/Logistics):</span>
              <strong className="text-amber-300">{formatPaiseToRupees(p2TotalOpex)}</strong>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-700/60">
              <span className="text-slate-400">Factory Debt Service (Term Loan EMI):</span>
              <strong className="text-rose-400">{formatPaiseToRupees(totalLoanEMIAnnual)}</strong>
            </div>

            <div className="flex justify-between py-3 border-t border-slate-700 text-sm">
              <span className="text-slate-300 font-bold">Projected Profit (at 3x output):</span>
              <strong className="text-emerald-400 font-bold">
                {formatPaiseToRupees(p2NetBeforeTax)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Transition Roadmap & Readiness Checklist */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm text-xs">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Building className="w-4 h-4 text-indigo-400" />
          Factory Transition Readiness Checklist
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">Civil & Structural Buildout</div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Pre-engineered building (PEB) erected, industrial flooring certified.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">HT Power Substation & DG Backup</div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                500 kVA transformer energized with dual feeder reliability.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">Statutory Factory License & Pollution Control</div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Consent to Operate (CTO) granted from State Pollution Control Board.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">EPF & ESI Factory Registration</div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Sub-code generated for 95 manufacturing personnel compliance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
