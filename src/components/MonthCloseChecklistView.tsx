// src/components/MonthCloseChecklistView.tsx
import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Calendar,
  Lock,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  isComplete: boolean;
  dueDate: string;
  owner: string;
}

export const MonthCloseChecklistView: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: 'chk-1',
      category: 'Payroll & Statutory',
      title: 'Run 12% Employer PF Calculation & Generate ECR File',
      description: 'Reconcile payroll register with PF challan before the 15th of the month.',
      isComplete: true,
      dueDate: '15th of Month',
      owner: 'Finance / CA',
    },
    {
      id: 'chk-2',
      category: 'Statutory Compliance',
      title: 'Section 197 Director Remuneration Limit Audit',
      description: 'Confirm director salary + annual bonus <= 11% of calculated Gross Profit.',
      isComplete: true,
      dueDate: 'Month End',
      owner: 'Company Secretary',
    },
    {
      id: 'chk-3',
      category: 'Opex & Vendor Payables',
      title: 'Operating Expenses > ±10% Budget Variance Audit',
      description: 'Review auto-flagged budget overruns with Department Heads and obtain Director sanction.',
      isComplete: false,
      dueDate: '25th of Month',
      owner: 'Finance Desk',
    },
    {
      id: 'chk-4',
      category: 'Capex & Loans',
      title: 'Verify Bank Term Loan EMI Deductions & Interest Certificate',
      description: 'Cross-check reducing balance interest with bank statement for SBI & HDFC facilities.',
      isComplete: true,
      dueDate: '10th of Month',
      owner: 'Accountant',
    },
    {
      id: 'chk-5',
      category: 'Related Party (Sec 188)',
      title: 'Employee Advance Ledger Reconciliation',
      description: 'Ensure director/shareholder advances are signed off and separate from regular payroll expenses.',
      isComplete: false,
      dueDate: 'Month End',
      owner: 'Managing Director',
    },
    {
      id: 'chk-6',
      category: 'BOM & Cost Accounting',
      title: 'Prototype BOM Exclusion Audit',
      description: 'Confirm that all software, design tool licenses, and cloud subscriptions are filtered into IT Opex and not capitalized into prototype hardware COGS.',
      isComplete: true,
      dueDate: 'Month End',
      owner: 'Chief Engineer',
    },
  ]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isComplete: !it.isComplete } : it))
    );
  };

  const completedCount = items.filter((i) => i.isComplete).length;
  const progressPct = Math.round((completedCount / items.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            Monthly Financial Close & Statutory Audit Checklist
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Standard Operating Procedure (SOP) for Private Limited Indian corporate compliance (Companies Act, MCA & Income Tax).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400">Close Readiness</span>
            <div className="text-base font-bold text-emerald-400">{progressPct}% Complete</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm">
        <div className="flex justify-between text-xs text-slate-300 font-medium mb-2">
          <span>{completedCount} of {items.length} Close Tasks Signed Off</span>
          <span>Target Close: T+3 Working Days</span>
        </div>
        <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* Checklist Tasks List */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
              item.isComplete
                ? 'bg-slate-800/50 border-slate-700/60'
                : 'bg-slate-800 border-indigo-500/40 shadow-sm'
            }`}
          >
            <div className="mt-0.5">
              {item.isComplete ? (
                <CheckSquare className="w-5 h-5 text-emerald-400" />
              ) : (
                <Square className="w-5 h-5 text-slate-500 hover:text-slate-300" />
              )}
            </div>

            <div className="flex-1 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold text-sm ${
                      item.isComplete ? 'text-slate-400 line-through' : 'text-white'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300">
                    {item.category}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <span>Due: {item.dueDate}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {item.owner}
                  </span>
                </div>
              </div>

              <p
                className={`mt-1 leading-relaxed ${
                  item.isComplete ? 'text-slate-500' : 'text-slate-300'
                }`}
              >
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
