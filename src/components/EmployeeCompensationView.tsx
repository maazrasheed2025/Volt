// src/components/EmployeeCompensationView.tsx
import React, { useState } from 'react';
import { Employee, BonusRate, InsurancePolicy, EmployeeCategory } from '../types.ts';
import {
  formatPaiseToRupees,
  rupeesToPaise,
  calculateSalaryAndPF,
  calculateEmployeeBonus,
  calculateEmployeeInsurance,
} from '../utils/calculations.ts';
import { EMPLOYEE_CATEGORIES } from '../data/categories.ts';
import {
  Users,
  Plus,
  Search,
  Filter,
  DollarSign,
  Shield,
  Award,
  Edit2,
  CheckCircle2,
  FileDown,
} from 'lucide-react';

interface EmployeeCompensationViewProps {
  employees: Employee[];
  bonusRates: BonusRate[];
  insurancePolicies: InsurancePolicy[];
  totalUnitsProduced: number;
  onAddEmployee: (emp: Partial<Employee>) => Promise<void>;
  onUpdateEmployee: (id: number, updates: Partial<Employee>) => Promise<void>;
  onUpdateBonusRate: (id: number, ratePaise: string, notes: string) => Promise<void>;
  userRole: string;
}

export const EmployeeCompensationView: React.FC<EmployeeCompensationViewProps> = ({
  employees,
  bonusRates,
  insurancePolicies,
  totalUnitsProduced,
  onAddEmployee,
  onUpdateEmployee,
  onUpdateBonusRate,
  userRole,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterPhase, setFilterPhase] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'annual' | 'monthly'>('annual');

  // Edit / Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Bonus rate editing modal
  const [isBonusRateModalOpen, setIsBonusRateModalOpen] = useState(false);
  const [editingBonusRate, setEditingBonusRate] = useState<BonusRate | null>(null);
  const [newBonusRateRupees, setNewBonusRateRupees] = useState<string>('');
  const [bonusRateNotes, setBonusRateNotes] = useState<string>('');

  // Form State for new/edited employee
  const [formName, setFormName] = useState('');
  const [formEmpId, setFormEmpId] = useState('');
  const [formCategory, setFormCategory] = useState<EmployeeCategory>('Engineer');
  const [formSalaryRupees, setFormSalaryRupees] = useState('');
  const [formIsBonus, setFormIsBonus] = useState(true);
  const [formIsInsurance, setFormIsInsurance] = useState(true);
  const [formIsShareholder, setFormIsShareholder] = useState(false);
  const [formShareholding, setFormShareholding] = useState('0.00');
  const [formDividend, setFormDividend] = useState('0.00');
  const [formPhase, setFormPhase] = useState(1);
  const [formJoinDate, setFormJoinDate] = useState(new Date().toISOString().split('T')[0]);

  // Maps for fast calculation
  const bonusRatesMap: Record<string, string> = {};
  bonusRates.forEach((b) => {
    bonusRatesMap[b.category] = b.bonusPerUnit;
  });

  const insuranceMap: Record<string, string> = {};
  insurancePolicies.forEach((i) => {
    insuranceMap[i.category] = i.premiumPerPersonPerYear;
  });

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesCategory = filterCategory === 'ALL' || emp.category === filterCategory;
    const matchesPhase = filterPhase === 'ALL' || emp.phase.toString() === filterPhase;
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesPhase && matchesSearch;
  });

  // Aggregates for the filtered roster
  let aggAnnualSalary = 0n;
  let aggEmployerPF = 0n;
  let aggTotalBonus = 0n;
  let aggInsurance = 0n;

  filteredEmployees.forEach((emp) => {
    const sal = calculateSalaryAndPF(emp.monthlySalary);
    aggAnnualSalary += BigInt(sal.annualSalary);
    aggEmployerPF += BigInt(sal.employerPFAnnual);
    aggTotalBonus += calculateEmployeeBonus(emp, totalUnitsProduced, bonusRatesMap);
    aggInsurance += calculateEmployeeInsurance(emp, insuranceMap);
  });

  const aggTotalComp = aggAnnualSalary + aggEmployerPF + aggTotalBonus + aggInsurance;

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormEmpId(`EMP-${(employees.length + 1).toString().padStart(3, '0')}`);
    setFormCategory('Engineer');
    setFormSalaryRupees('50000');
    setFormIsBonus(true);
    setFormIsInsurance(true);
    setFormIsShareholder(false);
    setFormShareholding('0.00');
    setFormDividend('0.00');
    setFormPhase(1);
    setFormJoinDate(new Date().toISOString().split('T')[0]);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormEmpId(emp.employeeId);
    setFormCategory(emp.category);
    setFormSalaryRupees((Number(emp.monthlySalary) / 100).toString());
    setFormIsBonus(emp.isBonusEligible);
    setFormIsInsurance(emp.isInsuranceEligible);
    setFormIsShareholder(emp.isShareholder);
    setFormShareholding(emp.shareholdingPercent);
    setFormDividend(emp.dividendPercent);
    setFormPhase(emp.phase);
    setFormJoinDate(emp.joinDate);
    setIsAddModalOpen(true);
  };

  const handleSubmitEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const monthlyPaise = rupeesToPaise(formSalaryRupees);

    if (editingEmployee) {
      await onUpdateEmployee(editingEmployee.id, {
        name: formName,
        category: formCategory,
        monthlySalary: monthlyPaise,
        isBonusEligible: formIsBonus,
        isInsuranceEligible: formIsInsurance,
        isShareholder: formIsShareholder,
        shareholdingPercent: formShareholding,
        dividendPercent: formDividend,
        phase: formPhase,
        joinDate: formJoinDate,
      });
    } else {
      await onAddEmployee({
        employeeId: formEmpId,
        name: formName,
        category: formCategory,
        monthlySalary: monthlyPaise,
        isBonusEligible: formIsBonus,
        isInsuranceEligible: formIsInsurance,
        isShareholder: formIsShareholder,
        shareholdingPercent: formShareholding,
        dividendPercent: formDividend,
        phase: formPhase,
        joinDate: formJoinDate,
        status: 'active',
      });
    }
    setIsAddModalOpen(false);
  };

  const handleOpenBonusRateModal = (b: BonusRate) => {
    setEditingBonusRate(b);
    setNewBonusRateRupees((Number(b.bonusPerUnit) / 100).toString());
    setBonusRateNotes(b.versionNotes || '');
    setIsBonusRateModalOpen(true);
  };

  const handleSaveBonusRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBonusRate) return;
    const paise = rupeesToPaise(newBonusRateRupees);
    await onUpdateBonusRate(editingBonusRate.id, paise, bonusRateNotes);
    setIsBonusRateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Employee Compensation, PF & Performance Bonus Report
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic Section 2A/2B/2C calculations with 12% Employer PF, annual bonus pools, and group insurance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900/80 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setViewMode('annual')}
              className={`px-3 py-1 text-xs font-semibold rounded ${
                viewMode === 'annual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual Package (CTC)
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 text-xs font-semibold rounded ${
                viewMode === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly View
            </button>
          </div>

          {/* Add Employee Button (Admin & Finance) */}
          {(userRole === 'Admin/Owner' || userRole === 'Finance/CA') && (
            <button
              id="add-employee-btn"
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Cost Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <span className="text-slate-400">Total Filtered Compensation:</span>
          <div className="text-xl font-bold text-white mt-1">
            {formatPaiseToRupees(viewMode === 'annual' ? aggTotalComp : aggTotalComp / 12n)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {filteredEmployees.length} staff members selected
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <span className="text-slate-400">Basic & Gross Salaries:</span>
          <div className="text-xl font-bold text-slate-200 mt-1">
            {formatPaiseToRupees(viewMode === 'annual' ? aggAnnualSalary : aggAnnualSalary / 12n)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Direct payroll before benefits</div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <span className="text-slate-400">Employer PF Contribution (12%):</span>
          <div className="text-xl font-bold text-indigo-400 mt-1">
            {formatPaiseToRupees(viewMode === 'annual' ? aggEmployerPF : aggEmployerPF / 12n)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">EPF statutory matching deposit</div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <span className="text-slate-400">Performance Bonus Pool:</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {formatPaiseToRupees(aggTotalBonus)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Based on {totalUnitsProduced} units produced this year
          </div>
        </div>
      </div>

      {/* Bonus Rates Quick Manager Card */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              Performance Bonus Rates per Unit (Editable & Versioned by Year)
            </h3>
            <p className="text-xs text-slate-400">
              Formula: employee_bonus = bonus_per_unit[category] × actual units produced ({totalUnitsProduced})
            </p>
          </div>
          <span className="text-[11px] text-slate-400">
            FY 2026 Rates (Updates are audit-logged)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {bonusRates.map((b) => (
            <div
              key={b.id}
              onClick={() => userRole === 'Admin/Owner' && handleOpenBonusRateModal(b)}
              className={`p-2.5 rounded-lg border text-center transition ${
                userRole === 'Admin/Owner'
                  ? 'bg-slate-900/80 border-slate-700 hover:border-indigo-500 cursor-pointer'
                  : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="text-[11px] font-medium text-slate-400 truncate">{b.category}</div>
              <div className="text-xs font-bold text-emerald-400 mt-1">
                ₹{(Number(b.bonusPerUnit) / 100).toFixed(2)}/u
              </div>
              {userRole === 'Admin/Owner' && (
                <div className="text-[9px] text-indigo-400 mt-1 flex items-center justify-center gap-0.5">
                  <Edit2 className="w-2.5 h-2.5" /> Edit
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or EMP-ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {EMPLOYEE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Phase Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Phase:</span>
            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Both Phases</option>
              <option value="1">Phase 1 (Small Core)</option>
              <option value="2">Phase 2 (Factory Expansion)</option>
            </select>
          </div>
        </div>

        <div className="text-slate-400">
          Showing <span className="font-semibold text-white">{filteredEmployees.length}</span> of{' '}
          {employees.length} personnel
        </div>
      </div>

      {/* Employees Compensation Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-3">Emp ID & Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-2 text-center">Phase</th>
                <th className="py-3 px-3 text-right">
                  {viewMode === 'annual' ? 'Annual Salary' : 'Monthly Salary'}
                </th>
                <th className="py-3 px-3 text-right">
                  {viewMode === 'annual' ? 'Employer PF (12%)' : 'Monthly PF (12%)'}
                </th>
                <th className="py-3 px-3 text-right">Performance Bonus</th>
                <th className="py-3 px-3 text-right">Insurance Cost</th>
                <th className="py-3 px-3 text-right font-bold text-indigo-300">
                  Total Compensation
                </th>
                <th className="py-3 px-2 text-center">Flags</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-200">
              {filteredEmployees.map((emp) => {
                const sal = calculateSalaryAndPF(emp.monthlySalary);
                const bonus = calculateEmployeeBonus(emp, totalUnitsProduced, bonusRatesMap);
                const ins = calculateEmployeeInsurance(emp, insuranceMap);

                const salaryDisplay =
                  viewMode === 'annual' ? sal.annualSalary : sal.monthlySalary;
                const pfDisplay =
                  viewMode === 'annual' ? sal.employerPFAnnual : sal.employerPFMonthly;
                const bonusDisplay =
                  viewMode === 'annual' ? bonus.toString() : (bonus / 12n).toString();
                const insDisplay =
                  viewMode === 'annual' ? ins.toString() : (ins / 12n).toString();

                const totalComp =
                  BigInt(salaryDisplay) +
                  BigInt(pfDisplay) +
                  BigInt(bonusDisplay) +
                  BigInt(insDisplay);

                return (
                  <tr key={emp.id} className="hover:bg-slate-700/30 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{emp.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{emp.employeeId}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700 text-slate-200">
                        {emp.category}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          emp.phase === 1
                            ? 'bg-blue-900/40 text-blue-300 border border-blue-800'
                            : 'bg-purple-900/40 text-purple-300 border border-purple-800'
                        }`}
                      >
                        P{emp.phase}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-200">
                      {formatPaiseToRupees(salaryDisplay)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-indigo-400">
                      {formatPaiseToRupees(pfDisplay)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400">
                      {emp.isBonusEligible ? formatPaiseToRupees(bonusDisplay) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-cyan-400">
                      {emp.isInsuranceEligible ? formatPaiseToRupees(insDisplay) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {formatPaiseToRupees(totalComp)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {emp.isShareholder && (
                          <span
                            className="px-1.5 py-0.5 text-[9px] rounded bg-amber-900/40 text-amber-300 border border-amber-700"
                            title={`Shareholder (${emp.shareholdingPercent}% Eq, ${emp.dividendPercent}% Div)`}
                          >
                            SH
                          </span>
                        )}
                        {emp.category === 'Director' && emp.isShareholder && (
                          <span
                            className="px-1.5 py-0.5 text-[9px] rounded bg-rose-900/40 text-rose-300 border border-rose-700"
                            title="Section 197 Applicable Director"
                          >
                            S.197
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {(userRole === 'Admin/Owner' || userRole === 'Finance/CA') && (
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1 text-slate-400 hover:text-indigo-300 rounded hover:bg-slate-700 transition"
                          title="Edit salary / details"
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

      {/* Add / Edit Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 text-xs text-slate-200">
            <h3 className="text-base font-bold text-white mb-4">
              {editingEmployee ? `Edit Employee: ${editingEmployee.name}` : 'Add New Employee to Roster'}
            </h3>
            <form onSubmit={handleSubmitEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as EmployeeCategory)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  >
                    {EMPLOYEE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    step="100"
                    required
                    value={formSalaryRupees}
                    onChange={(e) => setFormSalaryRupees(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                    placeholder="e.g. 75000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Phase</label>
                  <select
                    value={formPhase}
                    onChange={(e) => setFormPhase(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value={1}>Phase 1 (Small Core Team)</option>
                    <option value={2}>Phase 2 (Factory Scaling to 95)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Join Date</label>
                  <input
                    type="date"
                    required
                    value={formJoinDate}
                    onChange={(e) => setFormJoinDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/60 space-y-2">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formIsBonus}
                      onChange={(e) => setFormIsBonus(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Performance Bonus Eligible</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formIsInsurance}
                      onChange={(e) => setFormIsInsurance(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Group Insurance Eligible</span>
                  </label>
                </div>

                <div className="border-t border-slate-800 pt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formIsShareholder}
                      onChange={(e) => setFormIsShareholder(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span className="font-semibold text-indigo-300">
                      Is Shareholder / Promoter Director
                    </span>
                  </label>
                </div>

                {formIsShareholder && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-slate-400 mb-0.5">Shareholding %</label>
                      <input
                        type="text"
                        value={formShareholding}
                        onChange={(e) => setFormShareholding(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-0.5">Dividend % (Rule 3(4))</label>
                      <input
                        type="text"
                        value={formDividend}
                        onChange={(e) => setFormDividend(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  {editingEmployee ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bonus Rate Edit Modal */}
      {isBonusRateModalOpen && editingBonusRate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-sm w-full p-5 text-xs text-slate-200">
            <h3 className="text-base font-bold text-white mb-2">
              Update Bonus Rate: {editingBonusRate.category}
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Historical bonus rates remain protected. Rate changes create an audit trail.
            </p>
            <form onSubmit={handleSaveBonusRate} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Bonus per Unit Produced (₹)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newBonusRateRupees}
                  onChange={(e) => setNewBonusRateRupees(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reason / Board Notes</label>
                <textarea
                  required
                  value={bonusRateNotes}
                  onChange={(e) => setBonusRateNotes(e.target.value)}
                  placeholder="e.g. Board approval for higher factory capacity"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-20"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBonusRateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-slate-700 text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Update & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
