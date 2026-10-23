// src/utils/calculations.ts
import { Employee, ProductionRecord, BonusRate, InsurancePolicy } from '../types.ts';

/**
 * Format paise into Indian Currency notation: ₹ X,XX,XXX.XX or Lakhs / Crores
 */
export function formatPaiseToRupees(paise: string | number | bigint, options: { showDecimals?: boolean; compact?: boolean } = {}): string {
  const p = BigInt(paise || 0);
  const isNegative = p < 0n;
  const absP = isNegative ? -p : p;
  
  const rupees = Number(absP) / 100;
  
  if (options.compact) {
    if (rupees >= 10000000) { // 1 Crore
      const cr = rupees / 10000000;
      return `${isNegative ? '-' : ''}₹${cr.toFixed(2)} Cr`;
    }
    if (rupees >= 100000) { // 1 Lakh
      const lk = rupees / 100000;
      return `${isNegative ? '-' : ''}₹${lk.toFixed(2)} L`;
    }
  }

  const intPart = Math.floor(rupees);
  const decPart = Math.round((rupees - intPart) * 100);

  // Format integer part into Indian numbering system
  let s = intPart.toString();
  let result = '';
  if (s.length > 3) {
    const lastThree = s.substring(s.length - 3);
    const rest = s.substring(0, s.length - 3);
    result = ',' + lastThree;
    let i = rest.length;
    while (i > 2) {
      result = ',' + rest.substring(i - 2, i) + result;
      i -= 2;
    }
    if (i > 0) {
      result = rest.substring(0, i) + result;
    }
  } else {
    result = s;
  }

  const formattedRupees = `${isNegative ? '-' : ''}₹${result}`;
  if (options.showDecimals) {
    const decString = decPart.toString().padStart(2, '0');
    return `${formattedRupees}.${decString}`;
  }
  return formattedRupees;
}

/**
 * Convert Rupees number (e.g. 50000.50) into integer Paise string (e.g. "5000050")
 */
export function rupeesToPaise(rupees: number | string): string {
  const num = typeof rupees === 'string' ? parseFloat(rupees.replace(/[^0-9.-]/g, '')) || 0 : rupees;
  return Math.round(num * 100).toString();
}

/**
 * A. Salary & PF (monthly & annual per employee)
 * annual_salary = monthly_salary * 12
 * employer_PF = annual_salary * 0.12
 * total_salary_cost = annual_salary + employer_PF
 */
export function calculateSalaryAndPF(monthlySalaryPaise: string | number) {
  const monthly = BigInt(monthlySalaryPaise || 0);
  const annualSalary = monthly * 12n;
  // PF is 12% of annual salary: (annual * 12) / 100
  const employerPFAnnual = (annualSalary * 12n) / 100n;
  const employerPFMonthly = (monthly * 12n) / 100n;
  const totalSalaryCostAnnual = annualSalary + employerPFAnnual;
  const totalSalaryCostMonthly = monthly + employerPFMonthly;

  return {
    monthlySalary: monthly.toString(),
    annualSalary: annualSalary.toString(),
    employerPFMonthly: employerPFMonthly.toString(),
    employerPFAnnual: employerPFAnnual.toString(),
    totalSalaryCostMonthly: totalSalaryCostMonthly.toString(),
    totalSalaryCostAnnual: totalSalaryCostAnnual.toString(),
  };
}

/**
 * B. Performance Bonus (annual, based on actual units produced that year)
 * employee_bonus = bonus_per_unit[category] * total_units_produced_that_year
 * Only calculate for employees where is_bonus_eligible = true
 */
export function calculateEmployeeBonus(
  employee: Employee,
  totalUnitsProduced: number,
  bonusRatesMap: Record<string, string> // category -> paise per unit
): bigint {
  if (!employee.isBonusEligible || employee.status !== 'active') return 0n;
  const ratePaise = BigInt(bonusRatesMap[employee.category] || 0);
  return ratePaise * BigInt(totalUnitsProduced);
}

/**
 * C. Insurance (annual, per eligible employee)
 * insurance_cost = premium_per_person * count_of_eligible_employees_in_category
 */
export function calculateEmployeeInsurance(
  employee: Employee,
  insurancePoliciesMap: Record<string, string> // category -> paise premium per year
): bigint {
  if (!employee.isInsuranceEligible || employee.status !== 'active') return 0n;
  return BigInt(insurancePoliciesMap[employee.category] || 0);
}

/**
 * E. Gross Profit:
 * gross_profit = (units_produced * revenue_per_unit) - (units_produced * cost_per_unit)
 */
export function calculateGrossProfit(productionList: ProductionRecord[]) {
  let totalRevenue = 0n;
  let totalCOGS = 0n;
  let totalUnits = 0;

  for (const prod of productionList) {
    const units = BigInt(prod.unitsProduced);
    totalUnits += prod.unitsProduced;
    const rev = BigInt(prod.revenuePerUnit || 0);
    const cost = BigInt(prod.costOfGoodsPerUnit || 0);
    totalRevenue += units * rev;
    totalCOGS += units * cost;
  }

  const grossProfit = totalRevenue - totalCOGS;
  return {
    totalRevenue: totalRevenue.toString(),
    totalCOGS: totalCOGS.toString(),
    grossProfit: grossProfit.toString(),
    totalUnits,
  };
}

/**
 * F. Section 197 Compliance Check (Companies Act 2013):
 * director_remuneration = SUM(salary + PF + bonus) for all is_shareholder = true employees who are Directors
 * section_197_limit = gross_profit * 0.11
 * compliance_status = "COMPLIANT" if director_remuneration <= section_197_limit else "EXCEEDED — flag for shareholder approval"
 */
export function checkSection197Compliance(
  employeesList: Employee[],
  totalUnitsProduced: number,
  bonusRatesMap: Record<string, string>,
  grossProfitPaise: string
) {
  let directorRemuneration = 0n;
  const directorDetails: { id: string; name: string; remuneration: string }[] = [];

  for (const emp of employeesList) {
    if (emp.status === 'active' && emp.category === 'Director' && emp.isShareholder) {
      const sal = calculateSalaryAndPF(emp.monthlySalary);
      const bonus = calculateEmployeeBonus(emp, totalUnitsProduced, bonusRatesMap);
      const totalRem = BigInt(sal.totalSalaryCostAnnual) + bonus;
      directorRemuneration += totalRem;
      directorDetails.push({
        id: emp.employeeId,
        name: emp.name,
        remuneration: totalRem.toString(),
      });
    }
  }

  const grossProfit = BigInt(grossProfitPaise || 0);
  // 11% of Gross Profit: (grossProfit * 11) / 100
  const section197Limit = grossProfit > 0n ? (grossProfit * 11n) / 100n : 0n;
  const marginOrExcess = section197Limit - directorRemuneration;
  const isCompliant = directorRemuneration <= section197Limit;

  return {
    directorRemuneration: directorRemuneration.toString(),
    section197Limit: section197Limit.toString(),
    marginOrExcess: marginOrExcess.toString(), // positive is buffer margin, negative is excess
    complianceStatus: isCompliant
      ? 'COMPLIANT'
      : 'EXCEEDED — Flagged for Shareholder Special Resolution / Central Govt Approval',
    isCompliant,
    directorDetails,
  };
}

/**
 * G. Operating Expense Variance Check
 * variance_percent = ((actual - budgeted) / budgeted) * 100
 * flag if variance exceeds +- 10%
 */
export function calculateBudgetVariance(actualPaise: string | number, budgetedPaise: string | number) {
  const actual = Number(actualPaise || 0);
  const budgeted = Number(budgetedPaise || 0);

  if (budgeted === 0) {
    return {
      variancePercent: actual > 0 ? 100 : 0,
      isFlagged: actual > 0,
      isOverBudget: actual > 0,
      differencePaise: actual.toString(),
    };
  }

  const diff = actual - budgeted;
  const variancePercent = (diff / budgeted) * 100;
  const isFlagged = Math.abs(variancePercent) > 10;
  const isOverBudget = diff > 0;

  return {
    variancePercent,
    isFlagged,
    isOverBudget,
    differencePaise: diff.toString(),
  };
}

/**
 * H. Distributable Profit & Dividend Calculation:
 * distributable_profit = gross_profit - total_employee_compensation - total_operating_expenses - taxes_paid - loan_EMI_paid
 * each_shareholder_dividend = distributable_profit * (dividend_percent / 100)
 */
export function calculateDistributableProfit(params: {
  grossProfitPaise: string;
  totalEmployeeCompPaise: string;
  totalOpexPaise: string;
  taxesPaidPaise: string;
  loanEMIPaidPaise: string;
}) {
  const grossProfit = BigInt(params.grossProfitPaise || 0);
  const employeeComp = BigInt(params.totalEmployeeCompPaise || 0);
  const opex = BigInt(params.totalOpexPaise || 0);
  const taxes = BigInt(params.taxesPaidPaise || 0);
  const emi = BigInt(params.loanEMIPaidPaise || 0);

  const distributableProfit = grossProfit - employeeComp - opex - taxes - emi;
  return distributableProfit > 0n ? distributableProfit : 0n;
}

/**
 * I. Loan / EMI Tracking Formula:
 * monthly_EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 * where P=principal, r=monthly interest rate, n=tenure in months
 */
export function calculateLoanEMI(principalRupees: number, annualInterestRatePercent: number, tenureMonths: number): number {
  if (tenureMonths <= 0 || principalRupees <= 0) return 0;
  const monthlyRate = annualInterestRatePercent / 12 / 100;
  if (monthlyRate === 0) return principalRupees / tenureMonths;

  const powerTerm = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principalRupees * monthlyRate * powerTerm) / (powerTerm - 1);
  return emi;
}

/**
 * J. Tax Estimation:
 * estimated_corporate_tax = taxable_profit * 0.25 (editable)
 * estimated_TDS_on_salaries = total_salary_and_bonus * tax_rate_slab (configurable range, e.g. 15%)
 */
export function calculateEstimatedTaxes(
  taxableProfitPaise: string,
  corporateTaxRate = 0.25,
  totalSalaryAndBonusPaise: string,
  tdsRate = 0.15
) {
  const profit = BigInt(taxableProfitPaise || 0);
  const estimatedCorporateTax = profit > 0n ? (profit * BigInt(Math.round(corporateTaxRate * 10000))) / 10000n : 0n;

  const salAndBonus = BigInt(totalSalaryAndBonusPaise || 0);
  const estimatedTDS = (salAndBonus * BigInt(Math.round(tdsRate * 10000))) / 10000n;

  return {
    corporateTax: estimatedCorporateTax.toString(),
    tdsOnSalaries: estimatedTDS.toString(),
    totalTaxEstimate: (estimatedCorporateTax + estimatedTDS).toString(),
  };
}

/**
 * K. Capital Equipment Depreciation:
 * annual_depreciation = (purchase_cost - salvage_value) / useful_life_years
 */
export function calculateAssetDepreciation(
  purchaseCostPaise: string | number,
  salvageValuePaise: string | number,
  usefulLifeYears: number,
  purchaseDateStr: string
) {
  const cost = BigInt(purchaseCostPaise || 0);
  const salvage = BigInt(salvageValuePaise || 0);
  const years = usefulLifeYears > 0 ? BigInt(usefulLifeYears) : 1n;

  const depreciableAmount = cost > salvage ? cost - salvage : 0n;
  const annualDepreciation = depreciableAmount / years;

  // Calculate elapsed years since purchase
  const purchaseDate = new Date(purchaseDateStr || Date.now());
  const now = new Date();
  const elapsedYears = Math.max(0, (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

  const totalDepreciationSoFar = BigInt(Math.min(Number(cost - salvage), Math.floor(Number(annualDepreciation) * elapsedYears)));
  const remainingBookValue = cost - totalDepreciationSoFar;

  return {
    annualDepreciation: annualDepreciation.toString(),
    totalDepreciationToDate: totalDepreciationSoFar.toString(),
    currentBookValue: remainingBookValue.toString(),
    elapsedYears: elapsedYears.toFixed(1),
  };
}

/**
 * L. Loan Amortization Schedule:
 * Generates monthly reducing balance breakdown of principal and interest.
 */
export function calculateAmortizationSchedule(params: {
  principalPaise: string | number;
  annualInterestRatePercent: number;
  tenureMonths: number;
  emiPaise: string | number;
  startDateStr?: string;
}) {
  const schedule: Array<{
    month: number;
    openingBalancePaise: string;
    emiPaise: string;
    interestPaise: string;
    principalPaise: string;
    closingBalancePaise: string;
  }> = [];

  let balance = BigInt(params.principalPaise || 0);
  const emi = BigInt(params.emiPaise || 0);
  const monthlyRateDecimal = params.annualInterestRatePercent / 12 / 100;
  const tenure = Math.min(params.tenureMonths || 60, 120);

  for (let m = 1; m <= tenure; m++) {
    if (balance <= 0n) break;
    const opening = balance;
    // interest = balance * monthlyRate
    const interest = BigInt(Math.round(Number(balance) * monthlyRateDecimal));
    const principalPaid = emi > interest ? (emi - interest > balance ? balance : emi - interest) : 0n;
    const closing = balance - principalPaid > 0n ? balance - principalPaid : 0n;
    balance = closing;

    schedule.push({
      month: m,
      openingBalancePaise: opening.toString(),
      emiPaise: emi.toString(),
      interestPaise: interest.toString(),
      principalPaise: principalPaid.toString(),
      closingBalancePaise: closing.toString(),
    });
  }

  return schedule;
}

/**
 * M. Prototype BOM Unit Cost & Exclusion Calculator:
 * Calculates total cost per prototype and flags/excludes software & SaaS subscriptions from hardware unit cost.
 */
export function calculatePrototypeUnitCost(bomItems: Array<{
  amount: string;
  componentCategory: string;
  isMiscategorized?: boolean;
}>) {
  let totalUnitCostPaise = 0n;
  let excludedCostPaise = 0n;
  let validItemCount = 0;
  let excludedItemCount = 0;
  const byCategory: Record<string, string> = {};

  bomItems.forEach((item) => {
    const amt = BigInt(item.amount || 0);
    if (item.isMiscategorized) {
      excludedCostPaise += amt;
      excludedItemCount += 1;
    } else {
      totalUnitCostPaise += amt;
      validItemCount += 1;
      const cat = item.componentCategory || 'Miscellaneous';
      const existing = BigInt(byCategory[cat] || 0);
      byCategory[cat] = (existing + amt).toString();
    }
  });

  return {
    totalUnitCostPaise: totalUnitCostPaise.toString(),
    excludedCostPaise: excludedCostPaise.toString(),
    validItemCount,
    excludedItemCount,
    byCategory,
  };
}

/**
 * N. Master Generator Cashflow & Balance Calculator:
 * Calculates:
 * 1. Money I Have Now (Cash on Hand)
 * 2. Money I Already Paid (Total Outflows)
 * 3. Money I Have To Pay (Pending Liabilities)
 */
export function calculateGeneratorMasterCashflow(
  data: {
    products: Array<{ productId: string; serialNumber?: string; sellingPrice?: string; saleStatus?: string }>;
    bomLineItems: Array<{ amount: string; isMiscategorized?: boolean }>;
    employees: Array<{ monthlySalary: string; status: string }>;
    loans: Array<{ principalAmount: string; principalRepaid: string; interestPaidToDate: string; outstandingBalance: string }>;
    construction: Array<{ budgetedAmount: string; actualSpent: string }>;
    expenses: Array<{ amount: string; category: string; paymentStatus: string }>;
  },
  options: {
    stage?: 'prototype' | 'selling' | 'full';
    isLoansActive?: boolean;
    isFactoryActive?: boolean;
    founderFundsPaise?: string;
  } = {}
) {
  const isLoansActive = options.isLoansActive ?? (options.stage === 'full');
  const isFactoryActive = options.isFactoryActive ?? (options.stage === 'full');
  const founderCapitalPaise = BigInt(options.founderFundsPaise || '200000000'); // ₹20 Lakhs default founder self-funds

  // 1. Total Financier Loans received as one-time capital (calculated only if section is active)
  let rawLoanReceived = 0n;
  let rawLoanOutstanding = 0n;
  let rawFinancerProfitPaid = 0n;
  let rawLoanPrincipalRepaid = 0n;

  data.loans.forEach((l) => {
    rawLoanReceived += BigInt(l.principalAmount || 0);
    rawLoanOutstanding += BigInt(l.outstandingBalance || 0);
    rawFinancerProfitPaid += BigInt(l.interestPaidToDate || 0);
    rawLoanPrincipalRepaid += BigInt(l.principalRepaid || 0);
  });

  const totalLoanReceived = isLoansActive ? rawLoanReceived : 0n;
  const totalLoanOutstanding = isLoansActive ? rawLoanOutstanding : 0n;
  const totalFinancerProfitPaid = isLoansActive ? rawFinancerProfitPaid : 0n;
  const totalLoanPrincipalRepaid = isLoansActive ? rawLoanPrincipalRepaid : 0n;

  // 2. Generator Units: Sold revenue and build costs
  let totalGeneratorSales = 0n;
  let totalRealizedCashFromSales = 0n;

  data.products.forEach((p) => {
    const sp = BigInt(p.sellingPrice || 0);
    if (sp > 0n) {
      totalGeneratorSales += sp;
      // In Prototype stage, unit is not sold yet, cash enters when marked 'Sold' or in selling/full stage
      if (p.saleStatus === 'Sold' || options.stage === 'selling' || options.stage === 'full') {
        totalRealizedCashFromSales += sp;
      }
    }
  });

  let totalGeneratorCost = 0n;
  data.bomLineItems.forEach((b) => {
    if (!b.isMiscategorized) {
      totalGeneratorCost += BigInt(b.amount || 0);
    }
  });

  const totalGeneratorProfit = totalGeneratorSales > totalGeneratorCost ? totalGeneratorSales - totalGeneratorCost : 0n;

  // 3. Factory Construction (calculated only if section is active)
  let rawConstructionBudget = 0n;
  let rawConstructionPaid = 0n;
  data.construction.forEach((c) => {
    rawConstructionBudget += BigInt(c.budgetedAmount || 0);
    rawConstructionPaid += BigInt(c.actualSpent || 0);
  });
  const rawConstructionRemaining = rawConstructionBudget > rawConstructionPaid ? rawConstructionBudget - rawConstructionPaid : 0n;

  const totalConstructionBudget = isFactoryActive ? rawConstructionBudget : 0n;
  const totalConstructionPaid = isFactoryActive ? rawConstructionPaid : 0n;
  const totalConstructionRemaining = isFactoryActive ? rawConstructionRemaining : 0n;

  // 4. Operating Expenses & Salaries (only active employees count in pending payroll)
  let totalExpensesPaid = 0n;
  let totalExpensesPending = 0n;
  let totalSalariesPaid = 0n;

  data.expenses.forEach((e) => {
    // If financier profit expense was logged while loans are inactive, ignore it
    if (!isLoansActive && e.category === 'Financier Profit & Interest') return;
    // If factory construction expense logged while factory is inactive, ignore it
    if (!isFactoryActive && e.category === 'Factory Construction & PEB Shed') return;

    const amt = BigInt(e.amount || 0);
    if (e.paymentStatus === 'paid') {
      totalExpensesPaid += amt;
      if (e.category === 'Payroll & Salaries') {
        totalSalariesPaid += amt;
      }
    } else {
      totalExpensesPending += amt;
    }
  });

  // Monthly payroll commitment only for currently ACTIVE (hired) employees
  let monthlyPayroll = 0n;
  let activeEmployeesCount = 0;
  data.employees.forEach((emp) => {
    if (emp.status === 'active') {
      monthlyPayroll += BigInt(emp.monthlySalary || 0);
      activeEmployeesCount += 1;
    }
  });

  // 5. Total Inflows = Founder Capital + Activated Loans + Realized Generator Sales
  const totalInflows = founderCapitalPaise + totalLoanReceived + totalRealizedCashFromSales;

  // 6. Total Outflows Already Paid:
  const hasFinancerInExpenses = data.expenses.some((e) => e.category === 'Financier Profit & Interest');
  const addFinancerProfitToPaid = (isLoansActive && !hasFinancerInExpenses) ? totalFinancerProfitPaid : 0n;

  const moneyAlreadyPaid =
    totalConstructionPaid +
    totalGeneratorCost +
    totalLoanPrincipalRepaid +
    totalExpensesPaid +
    addFinancerProfitToPaid;

  // 7. Money I Have Now (Cash in hand):
  const moneyIHaveNow = totalInflows > moneyAlreadyPaid ? totalInflows - moneyAlreadyPaid : 0n;

  // 8. Money I Have to Pay (Liabilities / Pending):
  const moneyIHaveToPay = totalLoanOutstanding + totalConstructionRemaining + totalExpensesPending + monthlyPayroll;

  return {
    moneyIHaveNow,
    moneyAlreadyPaid,
    moneyIHaveToPay,
    founderCapitalPaise,
    totalLoanReceived,
    totalLoanOutstanding,
    totalLoanPrincipalRepaid,
    totalFinancerProfitPaid,
    rawLoanReceived,
    rawLoanOutstanding,
    totalGeneratorSales,
    totalRealizedCashFromSales,
    totalGeneratorCost,
    totalGeneratorProfit,
    totalConstructionBudget,
    totalConstructionPaid,
    totalConstructionRemaining,
    rawConstructionBudget,
    rawConstructionPaid,
    rawConstructionRemaining,
    totalExpensesPaid,
    totalExpensesPending,
    totalSalariesPaid,
    monthlyPayroll,
    activeEmployeesCount,
    isLoansActive,
    isFactoryActive,
  };
}

/**
 * Calculates hierarchical post seniority score for company staff (higher score = higher post).
 * Rank 1: Chairman & Managing Director (CMD) -> Rank 2: COO -> Rank 3: Director ->
 * Rank 4: Core Team Members -> Rank 5: Plant Manager -> Rank 6: Head of Ops / BD Head ->
 * Rank 7: Chief Engineers (IIT) -> Rank 8: Lead Design -> Senior Execs -> Leads -> Field -> Intern.
 */
export function getPostSeniorityScore(emp: Employee): number {
  const post = (emp.post || '').toLowerCase();
  const name = (emp.name || '').toLowerCase();
  const category = (emp.category || '').toLowerCase();

  // 1. Chairman & Managing Director / CMD (Imran)
  if (post.includes('chairman') || post.includes('managing director') || post.includes('cmd') || name === 'imran') {
    return 1000;
  }
  // 2. Chief Operating Officer / COO (Pappu Bhai)
  if (post.includes('chief operating officer') || post.includes('coo') || name.includes('pappu')) {
    return 950;
  }
  // 3. Director-Operations / Director (Simran)
  if (post.includes('director-operations') || (post.includes('director') && !post.includes('managing')) || name.includes('simran')) {
    return 900;
  }
  // 4. Core Team Member / Decision Maker (Supriya)
  if (post.includes('core team member') || name.includes('supriya')) {
    return 850;
  }
  // 5. Plant Manager / Operations Head (Naushad Bhai)
  if (post.includes('plant manager') || (post.includes('operations head') && name.includes('naushad'))) {
    return 800;
  }
  // 6. Head of Operations (Wahid)
  if (post.includes('head of operations') || name.includes('wahid')) {
    return 780;
  }
  // 7. Business Development Head (Kumail)
  if (post.includes('business development head') || post.includes('bd head') || name.includes('kumail')) {
    return 760;
  }
  // 8. Chief Engineer / IIT (Ramendra IIT, Vijay IIT)
  if (post.includes('chief engineer') || name.includes('ramendra') || name.includes('vijay')) {
    return 740;
  }
  // 9. Lead CAD Designer / Chief Design Engineer (Anurag)
  if (post.includes('cad designer') || post.includes('design engineer') || name.includes('anurag')) {
    return 700;
  }
  // 10. Senior Accounts Executive (Mahtab Bhai)
  if (post.includes('senior accounts') || post.includes('accounts') || name.includes('mahtab')) {
    return 650;
  }
  // 11. Operations Team Lead (Jameel)
  if (post.includes('team lead') || (post.includes('operations') && name.includes('jameel'))) {
    return 630;
  }
  // 12. Executive Assistant / Corp. Communications (Neel)
  if (post.includes('executive assistant') || post.includes('communications') || name.includes('neel')) {
    return 610;
  }
  // 13. Senior Marketing Executive (Akash Bhai)
  if (post.includes('senior marketing') || name.includes('akash')) {
    return 590;
  }
  // 14. HR & Admin Executive (Maya)
  if (post.includes('hr & admin') || post.includes('hr') || name.includes('maya')) {
    return 570;
  }
  // 15. Strategic Partnerships Manager (Kumail ka Dost)
  if (post.includes('partnerships manager') || post.includes('partnerships')) {
    return 550;
  }
  // 16. Marketing & Client Relations Exec (Vikas)
  if (post.includes('client relations') || name.includes('vikas')) {
    return 500;
  }
  // 17. Logistics & Dispatch Coordinator (Anwer Lateef)
  if (post.includes('logistics') || post.includes('dispatch') || name.includes('anwer')) {
    return 480;
  }
  // 18. MIS & IT Support Executive (Aqil)
  if (post.includes('mis') || post.includes('it support') || name.includes('aqil')) {
    return 460;
  }
  // 19. Field Operations Coordinator (Faiz)
  if (post.includes('field operations') || name.includes('faiz')) {
    return 440;
  }
  // 20. Junior Operations Executive (Chota Bilal)
  if (post.includes('junior operations') || name.includes('bilal')) {
    return 380;
  }
  // 21. Junior Site Coordinator (Shekhu)
  if (post.includes('junior site') || name.includes('shekhu')) {
    return 350;
  }
  // 22. Junior Field Assistant (Ikhlaq)
  if (post.includes('junior field') || name.includes('ikhlaq')) {
    return 320;
  }
  // 23. Management Trainee / Office Intern (Sammy)
  if (post.includes('trainee') || post.includes('intern') || name.includes('sammy')) {
    return 250;
  }

  // Dynamic fallback for newly added staff based on salary & category
  let score = 200;
  const sal = Number(emp.monthlySalary || 0) / 100;
  score += Math.min(200, sal / 200);
  if (category.includes('core')) score += 200;
  else if (category.includes('head')) score += 100;
  else if (category.includes('management')) score += 50;

  return score;
}


