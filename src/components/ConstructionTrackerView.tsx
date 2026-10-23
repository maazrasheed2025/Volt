// src/components/ConstructionTrackerView.tsx
import React, { useState } from 'react';
import { FactoryConstructionItem } from '../types.ts';
import {
  formatPaiseToRupees,
  rupeesToPaise,
} from '../utils/calculations.ts';
import {
  Building2,
  HardHat,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plus,
  Edit2,
  Clock,
  Layers,
} from 'lucide-react';

interface ConstructionTrackerViewProps {
  construction: FactoryConstructionItem[];
  onUpdateConstruction: (id: number, updates: Partial<FactoryConstructionItem>) => Promise<void>;
  userRole: string;
}

export const ConstructionTrackerView: React.FC<ConstructionTrackerViewProps> = ({
  construction,
  onUpdateConstruction,
  userRole,
}) => {
  const [editingItem, setEditingItem] = useState<FactoryConstructionItem | null>(null);
  const [editSpentRupees, setEditSpentRupees] = useState<string>('');
  const [editPhysical, setEditPhysical] = useState<number>(0);
  const [editPhase, setEditPhase] = useState<string>('');

  // Aggregates
  let totalBudget = 0n;
  let totalSpent = 0n;
  let physicalSum = 0;

  construction.forEach((c) => {
    totalBudget += BigInt(c.budgetedAmount || 0);
    totalSpent += BigInt(c.actualSpent || 0);
    physicalSum += c.percentPhysicalComplete;
  });

  const avgPhysical = construction.length > 0 ? Math.round(physicalSum / construction.length) : 0;
  const spentPercent = totalBudget > 0n ? Math.round((Number(totalSpent) / Number(totalBudget)) * 100) : 0;

  const handleOpenEdit = (c: FactoryConstructionItem) => {
    setEditingItem(c);
    setEditSpentRupees((Number(c.actualSpent) / 100).toString());
    setEditPhysical(c.percentPhysicalComplete);
    setEditPhase(c.phaseOfConstruction || 'Phase 1 Site Prep');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    await onUpdateConstruction(editingItem.id, {
      actualSpent: rupeesToPaise(editSpentRupees),
      percentPhysicalComplete: editPhysical,
      phaseOfConstruction: editPhase,
    });

    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            Factory Construction Capex Budget & Milestone Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracking Phase 2 factory buildout: budgeted vs. actual capital disbursement vs. physical site execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400">Total Capex Allocation</span>
            <div className="text-base font-bold text-white">{formatPaiseToRupees(totalBudget)}</div>
          </div>
        </div>
      </div>

      {/* Capex vs Physical Overall Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-slate-400">Total Budgeted Capex:</span>
            <span className="p-1 rounded bg-slate-700 text-slate-300">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {formatPaiseToRupees(totalBudget)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">8 major civil & industrial packages</div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-slate-400">Actual Capital Disbursed:</span>
            <span className="p-1 rounded bg-indigo-500/20 text-indigo-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-indigo-400 mt-1">
            {formatPaiseToRupees(totalSpent)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {spentPercent}% of Capex Budget utilized
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-slate-400">Weighted Site Progress:</span>
            <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
              <HardHat className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{avgPhysical}% Finished</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Civil works nearing structural completion</div>
        </div>
      </div>

      {/* Detailed Milestone Component Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-3">Capex Component / Package</th>
                <th className="py-3 px-3 text-right">Budget Allocation</th>
                <th className="py-3 px-3 text-right">Actual Disbursed</th>
                <th className="py-3 px-3 text-right">Balance to Spend</th>
                <th className="py-3 px-3">Physical Site Completion</th>
                <th className="py-3 px-3">Phase / Milestone</th>
                <th className="py-3 px-2 text-center">Target Date</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-200">
              {construction.map((item) => {
                const b = BigInt(item.budgetedAmount || 0);
                const s = BigInt(item.actualSpent || 0);
                const balance = b > s ? b - s : 0n;
                const percentSpent = b > 0n ? Math.round((Number(s) / Number(b)) * 100) : 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-700/30 transition">
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-white">{item.component}</div>
                      <div className="text-[10px] text-slate-400">Started: {item.startDate}</div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                      {formatPaiseToRupees(item.budgetedAmount)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-indigo-300">
                      {formatPaiseToRupees(item.actualSpent)}
                      <div className="text-[10px] text-slate-400 font-normal">({percentSpent}% disbursed)</div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                      {formatPaiseToRupees(balance)}
                    </td>
                    <td className="py-3.5 px-3 min-w-[150px]">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-white">{item.percentPhysicalComplete}%</span>
                      </div>
                      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.percentPhysicalComplete >= 100
                              ? 'bg-emerald-500'
                              : item.percentPhysicalComplete > 50
                              ? 'bg-indigo-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, item.percentPhysicalComplete)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300 text-[11px]">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {item.phaseOfConstruction}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-center text-slate-400 font-mono">
                      {item.targetCompletionDate}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {(userRole === 'Admin/Owner' || userRole === 'Finance/CA') && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-slate-400 hover:text-indigo-300 rounded hover:bg-slate-700 transition"
                          title="Update milestone / disbursement"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Milestone Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 text-xs text-slate-200">
            <h3 className="text-base font-bold text-white mb-1">
              Update Capex Package: {editingItem.component}
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Budgeted allocation: {formatPaiseToRupees(editingItem.budgetedAmount)}
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">Actual Cumulative Spent (₹)</label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={editSpentRupees}
                  onChange={(e) => setEditSpentRupees(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Physical Completion: {editPhysical}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editPhysical}
                  onChange={(e) => setEditPhysical(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phase of Construction</label>
                <select
                  value={editPhase}
                  onChange={(e) => setEditPhase(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                >
                  <option value="Phase 1 Site Prep">Phase 1 Site Prep</option>
                  <option value="Phase 2 Heavy Foundation">Phase 2 Heavy Foundation</option>
                  <option value="Utilities Integration">Utilities Integration</option>
                  <option value="Final Commissioning">Final Commissioning</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
