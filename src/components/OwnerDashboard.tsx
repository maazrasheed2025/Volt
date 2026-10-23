// src/components/OwnerDashboard.tsx
import React, { useState } from 'react';
import {
  Employee,
  ProductionRecord,
  BonusRate,
  InsurancePolicy,
  Expense,
  FactoryConstructionItem,
  Shareholder,
  Loan,
} from '../types.ts';
import {
  formatPaiseToRupees,
  calculateSalaryAndPF,
  calculateEmployeeBonus,
  calculateEmployeeInsurance,
  calculateGrossProfit,
  checkSection197Compliance,
  calculateDistributableProfit,
} from '../utils/calculations.ts';
import {
  TrendingUp,
  Users,
  Building,
  ShieldCheck,
  AlertTriangle,
  PieChart as PieChartIcon,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';

interface OwnerDashboardProps {
  employees: Employee[];
  production: ProductionRecord[];
  bonusRates: BonusRate[];
  insurancePolicies: InsurancePolicy[];
  expenses: Expense[];
  construction: FactoryConstructionItem[];
  shareholders: Shareholder[];
  loans: Loan[];
  currentPhase: number;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  employees,
  production,
  bonusRates,
  insurancePolicies,
  expenses,
  construction,
  shareholders,
  loans,
  currentPhase,
}) => {
  // Filter employees & expenses by selected Phase (or both if viewing Phase 2 projection)
  const activeEmployees = employees.filter((e) =>
    currentPhase === 1 ? e.phase === 1 && e.status === 'active' : e.status === 'active'
  );

  const phaseExpenses = expenses.filter((e) =>
    currentPhase === 1 ? e.phase === 1 : true
  );

  // Bonus rates map
  const bonusRatesMap: Record<string, string> = {};
  bonusRates.forEach((b) => {
    bonusRatesMap[b.category] = b.bonusPerUnit;
  });

  // Insurance policies map
  const insuranceMap: Record<string, string> = {};
  insurancePolicies.forEach((i) => {
    insuranceMap[i.category] = i.premiumPerPersonPerYear;
  });

  // 1. Gross profit calculation
  const grossProfitCalc = calculateGrossProfit(production);
  const totalUnitsProduced = grossProfitCalc.totalUnits;

  // 2. Employee compensation breakdown
  let totalSalaryCostAnnual = 0n;
  let totalBonusPool = 0n;
  let totalInsuranceCost = 0n;

  activeEmployees.forEach((emp) => {
    const sal = calculateSalaryAndPF(emp.monthlySalary);
    totalSalaryCostAnnual += BigInt(sal.totalSalaryCostAnnual);

    const bonus = calculateEmployeeBonus(emp, totalUnitsProduced, bonusRatesMap);
    totalBonusPool += bonus;

    const ins = calculateEmployeeInsurance(emp, insuranceMap);
    totalInsuranceCost += ins;
  });

  const totalEmployeeCompAnnual = totalSalaryCostAnnual + totalBonusPool + totalInsuranceCost;

  // 3. Total Operating Expenses
  let totalOpex = 0n;
  phaseExpenses.forEach((exp) => {
    totalOpex += BigInt(exp.amount || 0);
  });

  // 4. Annual Loan EMI paid
  let totalLoanEMIPaid = 0n;
  loans.forEach((l) => {
    const emi = BigInt(l.emiAmount || 0);
    totalLoanEMIPaid += emi * 12n;
  });

  // Estimated Corporate Taxes (25% on taxable profit estimate)
  const taxableProfit = BigInt(grossProfitCalc.grossProfit) - totalEmployeeCompAnnual - totalOpex;
  const taxesPaid = taxableProfit > 0n ? (taxableProfit * 25n) / 100n : 0n;

  // 5. Distributable Profit & Dividends
  const distributableProfit = calculateDistributableProfit({
    grossProfitPaise: grossProfitCalc.grossProfit,
    totalEmployeeCompPaise: totalEmployeeCompAnnual.toString(),
    totalOpexPaise: totalOpex.toString(),
    taxesPaidPaise: taxesPaid.toString(),
    loanEMIPaidPaise: totalLoanEMIPaid.toString(),
  });

  // 6. Section 197 Check
  const section197 = checkSection197Compliance(
    activeEmployees,
    totalUnitsProduced,
    bonusRatesMap,
    grossProfitCalc.grossProfit
  );

  // 7. Factory Construction Progress (% budget spent vs % physical complete)
  let totalConstructionBudget = 0n;
  let totalConstructionSpent = 0n;
  let weightedPhysicalProgress = 0;

  construction.forEach((c) => {
    const b = BigInt(c.budgetedAmount || 0);
    const s = BigInt(c.actualSpent || 0);
    totalConstructionBudget += b;
    totalConstructionSpent += s;
  });

  if (construction.length > 0) {
    const totalPhysical = construction.reduce((acc, curr) => acc + curr.percentPhysicalComplete, 0);
    weightedPhysicalProgress = Math.round(totalPhysical / construction.length);
  }

  const constructionSpentPercent =
    totalConstructionBudget > 0n
      ? Math.round((Number(totalConstructionSpent) / Number(totalConstructionBudget)) * 100)
      : 0;

  // 12-Month Cash Flow projection estimate
  const monthlySalaryAndPF = totalSalaryCostAnnual / 12n;
  const monthlyOpex = totalOpex / 12n;
  const monthlyEMI = totalLoanEMIPaid / 12n;
  const monthlyCashOutflow = monthlySalaryAndPF + monthlyOpex + monthlyEMI;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Phase Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Executive Owner Dashboard
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              Phase {currentPhase}: {currentPhase === 1 ? 'Small Core Team (~12)' : 'Full 95-Employee Factory'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time gross profit, Section 197 statutory checks, Capex progress, and Rule 3(4) shareholder distributions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">Total Units Produced (YTD)</div>
            <div className="text-lg font-bold text-slate-100">{totalUnitsProduced.toLocaleString()} units</div>
          </div>
          <div className="h-9 w-px bg-slate-700"></div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Active Staff Headcount</div>
            <div className="text-lg font-bold text-indigo-400">{activeEmployees.length} personnel</div>
          </div>
        </div>
      </div>

      {/* Section 197 Compliance Banner Alert */}
      <div
        className={`rounded-xl p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          section197.isCompliant
            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
            : 'bg-rose-950/50 border-rose-700 text-rose-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg ${
              section197.isCompliant ? 'bg-emerald-900/60 text-emerald-400' : 'bg-rose-900/80 text-rose-300'
            }`}
          >
            {section197.isCompliant ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                Companies Act 2013 — Section 197 Compliance Check
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-bold ${
                  section197.isCompliant ? 'bg-emerald-800 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {section197.complianceStatus}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Director remuneration (shareholder directors):{' '}
              <strong className="text-white">{formatPaiseToRupees(section197.directorRemuneration)}</strong> vs.
              11% Gross Profit Statutory Cap:{' '}
              <strong className="text-white">{formatPaiseToRupees(section197.section197Limit)}</strong>.
            </p>
          </div>
        </div>

        <div className="text-right pl-3 sm:border-l border-slate-700">
          <div className="text-xs text-slate-400">
            {section197.isCompliant ? 'Available Headroom Buffer' : 'Excess to be Sanctioned'}
          </div>
          <div
            className={`text-base font-bold ${
              section197.isCompliant ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatPaiseToRupees(section197.marginOrExcess)}
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Profit */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400">Gross Profit (Annual)</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {formatPaiseToRupees(grossProfitCalc.grossProfit, { compact: true })}
          </div>
          <div className="flex items-center text-xs text-slate-400 mt-1">
            <span>Rev: {formatPaiseToRupees(grossProfitCalc.totalRevenue, { compact: true })}</span>
            <span className="mx-1.5">•</span>
            <span>COGS: {formatPaiseToRupees(grossProfitCalc.totalCOGS, { compact: true })}</span>
          </div>
        </div>

        {/* Total Employee Comp */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400">Total Employee Comp (CTC)</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {formatPaiseToRupees(totalEmployeeCompAnnual, { compact: true })}
          </div>
          <div className="flex items-center text-xs text-slate-400 mt-1">
            <span>Sal+PF: {formatPaiseToRupees(totalSalaryCostAnnual, { compact: true })}</span>
            <span className="mx-1.5">•</span>
            <span>Bonus: {formatPaiseToRupees(totalBonusPool, { compact: true })}</span>
          </div>
        </div>

        {/* Total Operating Expenses */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400">Operating Expenses (Opex)</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {formatPaiseToRupees(totalOpex, { compact: true })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {phaseExpenses.length} booked line-item bills
          </div>
        </div>

        {/* Distributable Profit */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400">Distributable Profit</span>
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <PieChartIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {formatPaiseToRupees(distributableProfit, { compact: true })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            After Capex EMI, Taxes & PF reserves
          </div>
        </div>
      </div>

      {/* Two Columns: Shareholder Dividends & Factory Construction Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shareholder Dividends Table (Rule 3(4) Disproportionate Structure) */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Shareholder Dividends Allocation
              </h3>
              <p className="text-xs text-slate-400">
                Rule 3(4) Companies (Declaration & Payment of Dividend) Rules: Disproportionate dividend enabled.
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700">
              Total Pool: {formatPaiseToRupees(distributableProfit)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Shareholder Name</th>
                  <th className="py-2.5 px-2 text-center">Equity %</th>
                  <th className="py-2.5 px-2 text-center">Dividend %</th>
                  <th className="py-2.5 px-3 text-right">Dividend Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-slate-200">
                {shareholders.map((s) => {
                  const divPercent = parseFloat(s.dividendPercent) || 0;
                  const divPaise = (distributableProfit * BigInt(Math.round(divPercent * 100))) / 10000n;
                  const isDisproportionate = s.shareholdingPercent !== s.dividendPercent;

                  return (
                    <tr key={s.id} className="hover:bg-slate-700/30 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{s.name}</div>
                        {s.notes && <div className="text-[11px] text-slate-400">{s.notes}</div>}
                      </td>
                      <td className="py-3 px-2 text-center font-mono">{s.shareholdingPercent}%</td>
                      <td className="py-3 px-2 text-center font-mono">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${isDisproportionate ? 'bg-amber-900/40 text-amber-300 border border-amber-800' : 'text-slate-300'}`}>
                          {s.dividendPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {formatPaiseToRupees(divPaise)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Factory Construction Tracker Summary */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-400" />
                Factory Construction Capex Progress
              </h3>
              <p className="text-xs text-slate-400">
                Tracking physical milestone execution vs. capital disbursement
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Capex Budget: </span>
              <span className="text-xs font-bold text-white">{formatPaiseToRupees(totalConstructionBudget, { compact: true })}</span>
            </div>
          </div>

          {/* Progress Comparison Bars */}
          <div className="space-y-4 mb-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Budget Capital Disbursed:</span>
                <span className="text-indigo-400 font-bold">
                  {constructionSpentPercent}% ({formatPaiseToRupees(totalConstructionSpent, { compact: true })} / {formatPaiseToRupees(totalConstructionBudget, { compact: true })})
                </span>
              </div>
              <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, constructionSpentPercent)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Physical Milestone Completion:</span>
                <span className="text-emerald-400 font-bold">{weightedPhysicalProgress}% Complete</span>
              </div>
              <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, weightedPhysicalProgress)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Component Mini List */}
          <div className="space-y-2 border-t border-slate-700/60 pt-3 text-xs">
            {construction.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center justify-between py-1 border-b border-slate-700/30">
                <span className="text-slate-300 truncate max-w-[200px]">{c.component}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400 font-mono">{formatPaiseToRupees(c.actualSpent, { compact: true })}</span>
                  <span className="px-2 py-0.5 text-[10px] rounded font-semibold bg-slate-700 text-slate-200">
                    {c.percentPhysicalComplete}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 12-Month Outflow & Cash Flow Summary Card */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              Monthly Cash Outflow Run-Rate & Liquidity Summary
            </h3>
            <p className="text-xs text-slate-400">
              Calculated monthly burn = (Annual Salary & PF / 12) + Monthly Opex + Monthly Loan EMI
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Estimated Monthly Cash Outflow: </span>
            <span className="text-base font-bold text-rose-400">
              {formatPaiseToRupees(monthlyCashOutflow)} / month
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
            <span className="text-slate-400">Monthly Payroll + Employer PF:</span>
            <div className="text-sm font-bold text-white mt-1">
              {formatPaiseToRupees(monthlySalaryAndPF)}
            </div>
            <span className="text-[11px] text-slate-500">12% statutory PF included</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
            <span className="text-slate-400">Average Monthly Operating Opex:</span>
            <div className="text-sm font-bold text-white mt-1">
              {formatPaiseToRupees(monthlyOpex)}
            </div>
            <span className="text-[11px] text-slate-500">Utilities, repairs, fuel & logistics</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
            <span className="text-slate-400">Monthly Debt Service (EMI):</span>
            <div className="text-sm font-bold text-white mt-1">
              {formatPaiseToRupees(monthlyEMI)}
            </div>
            <span className="text-[11px] text-slate-500">SBI & HDFC factory loans</span>
          </div>
        </div>
      </div>
    </div>
  );
};
