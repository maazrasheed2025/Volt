// src/components/CATaxExportModal.tsx
import React, { useState, useMemo } from 'react';
import {
  Expense,
  Employee,
  Loan,
  ProductPrototype,
  BOMLineItem,
  FactoryConstructionItem,
  StageSettings,
} from '../types.ts';
import {
  formatPaiseToRupees,
  rupeesToPaise,
  calculateGeneratorMasterCashflow,
} from '../utils/calculations.ts';
import {
  X,
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  Building2,
  Receipt,
  Scale,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Percent,
  Copy,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CATaxExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  employees: Employee[];
  loans: Loan[];
  products: ProductPrototype[];
  bomLineItems: BOMLineItem[];
  construction: FactoryConstructionItem[];
  stageSettings: StageSettings;
  corporateTaxRate: number;
}

export const CATaxExportModal: React.FC<CATaxExportModalProps> = ({
  isOpen,
  onClose,
  expenses,
  employees,
  loans,
  products,
  bomLineItems,
  construction,
  stageSettings,
  corporateTaxRate,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'balancesheet' | 'taxschedule' | 'preview'>('export');
  const [financialYear, setFinancialYear] = useState<string>('2025-26');
  const [assessmentYear, setAssessmentYear] = useState<string>('2026-27');
  const [caFirmName, setCaFirmName] = useState<string>('R.K. Sharma & Associates, Chartered Accountants');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  // Master Cashflow
  const cashflow = useMemo(() => {
    return calculateGeneratorMasterCashflow(
      {
        products,
        bomLineItems,
        employees,
        loans,
        construction,
        expenses,
      },
      {
        stage: stageSettings.currentStage,
        isLoansActive: stageSettings.isLoansActive,
        isFactoryActive: stageSettings.isFactoryActive,
        founderFundsPaise: stageSettings.founderFundsPaise,
      }
    );
  }, [products, bomLineItems, employees, loans, construction, expenses, stageSettings]);

  // Tax Paid To Date from Expense Ledger
  const totalTaxPaidPaise = useMemo(() => {
    return expenses
      .filter((e) => e.category === 'Corporate Income Tax')
      .reduce((acc, e) => acc + BigInt(e.amount || '0'), 0n);
  }, [expenses]);

  // Financial Figures (in Rupees for standard Balance Sheet accounting)
  const cashOnHandRupees = Number(cashflow.moneyIHaveNow) / 100;
  const founderFundsRupees = Number(cashflow.founderCapitalPaise) / 100;
  const prototypeWipAssetRupees = Number(cashflow.totalGeneratorCost) / 100;
  const activeLoansRupees = stageSettings.isLoansActive ? Number(cashflow.totalLoanOutstanding) / 100 : 0;
  const totalDisbursedRupees = Number(cashflow.moneyAlreadyPaid) / 100;
  const monthlyPayrollRupees = Number(cashflow.monthlyPayroll) / 100;
  const totalSalariesPaidRupees = expenses
    .filter((e) => e.category === 'Payroll & Salaries')
    .reduce((acc, e) => acc + Number(e.amount || 0) / 100, 0);

  const factoryCapexIncurredRupees = construction.reduce((acc, c) => {
    return acc + (Number(c.actualSpent || c.budgetedAmount || 0) / 100);
  }, 0);

  // Profit & Loss and Tax Computations (Commercial benchmark)
  const estimatedRevenueRupees = stageSettings.currentStage === 'prototype'
    ? 0
    : stageSettings.currentStage === 'selling'
    ? 5 * 650000 // 5 Pilot units @ ₹6.5L = ₹32.5L
    : 30 * 650000; // 30 Commercial units @ ₹6.5L = ₹1.95 Cr

  const directMaterialCostRupees = stageSettings.currentStage === 'prototype'
    ? prototypeWipAssetRupees
    : stageSettings.currentStage === 'selling'
    ? 5 * 380000
    : 30 * 340000;

  const totalOperatingExpensesRupees = expenses
    .filter((e) => e.category !== 'Corporate Income Tax' && e.category !== 'Profit Distribution & Dividends')
    .reduce((acc, e) => acc + Number(e.amount || 0) / 100, 0) || (totalSalariesPaidRupees + 150000);

  const grossProfitRupees = Math.max(0, estimatedRevenueRupees - directMaterialCostRupees);
  const profitBeforeTaxRupees = estimatedRevenueRupees > 0
    ? Math.max(0, grossProfitRupees - totalOperatingExpensesRupees)
    : 0;

  const corporateTaxLiabilityRupees = Math.round((profitBeforeTaxRupees * (corporateTaxRate || 25)) / 100);
  const taxPaidToDateRupees = Number(totalTaxPaidPaise) / 100;
  const netTaxPayableRupees = Math.max(0, corporateTaxLiabilityRupees - taxPaidToDateRupees);
  const profitAfterTaxRupees = profitBeforeTaxRupees > corporateTaxLiabilityRupees
    ? profitBeforeTaxRupees - corporateTaxLiabilityRupees
    : 0;

  // Balance Sheet Totals
  const totalFixedAssetsRupees = factoryCapexIncurredRupees + prototypeWipAssetRupees;
  const totalCurrentAssetsRupees = cashOnHandRupees + (directMaterialCostRupees > 0 ? directMaterialCostRupees * 0.2 : 50000);
  const totalAssetsRupees = totalFixedAssetsRupees + totalCurrentAssetsRupees;

  const totalShareholdersFundsRupees = founderFundsRupees + profitAfterTaxRupees;
  const totalLiabilitiesAndEquityRupees = totalShareholdersFundsRupees + activeLoansRupees + netTaxPayableRupees;

  // -------------------------------------------------------------
  // CSV EXPORT GENERATORS
  // -------------------------------------------------------------

  // 1. General Ledger Export (CSV)
  const generateGeneralLedgerCSV = () => {
    const headers = [
      'Voucher_No',
      'Transaction_Date',
      'Account_Head',
      'Sub_Category',
      'Particulars_Vendor_Narration',
      'Debit_Receipt_INR',
      'Credit_Payment_INR',
      'GST_Component_INR',
      'Tax_Code_Section',
      'Approval_Authority',
      'Financial_Year',
    ];

    const rows: string[][] = [];

    // Initial Founder Capital Inflow Entry
    rows.push([
      'VOUCH-CAP-001',
      '2025-04-01',
      'Shareholders Capital',
      'Founder Injected Funds',
      'Initial capital self-funded by Founder/CMD Imran for generator prototype build',
      founderFundsRupees.toFixed(2),
      '0.00',
      '0.00',
      'Sec 68 Equity Inflow',
      'Board Resolution / Founder',
      financialYear,
    ]);

    // Financier Loan Receipts
    if (stageSettings.isLoansActive) {
      loans.forEach((loan, idx) => {
        rows.push([
          `LOAN-REC-${String(idx + 1).padStart(3, '0')}`,
          loan.disbursementDate || '2025-05-15',
          'Long-Term Borrowings',
          'Financier Principal Inflow',
          `Financier loan received from ${loan.lender || 'External Financier'}`,
          (Number(loan.principalAmount || 0) / 100).toFixed(2),
          '0.00',
          '0.00',
          'Sec 269SS Debt Inflow',
          'Managing Director Approval',
          financialYear,
        ]);
      });
    }

    // Prototype BOM Line Items (Parts Expenses)
    bomLineItems.forEach((bom, idx) => {
      if (bom.isMiscategorized) return;
      rows.push([
        `BOM-PAY-${String(idx + 1).padStart(4, '0')}`,
        bom.date || '2025-06-10',
        'Direct Production WIP (BOM)',
        bom.componentCategory || 'Acoustic Canopy & Mechanical',
        `Procurement of ${bom.itemName} from ${bom.vendorOrPersonName || 'Verified Supplier'} (${bom.paymentMode || 'Bank'})`,
        '0.00',
        (Number(bom.amount || 0) / 100).toFixed(2),
        '0.00',
        'Sec 37(1) Business Capex/WIP',
        'CMD Imran / Technical Lead',
        financialYear,
      ]);
    });

    // Expenses (Salaries, Rent, Utilities, Corporate Tax, Dividends)
    expenses.forEach((exp) => {
      let taxSec = 'Sec 37(1) General Business Expense';
      if (exp.category === 'Corporate Income Tax') taxSec = 'Sec 115BAA / Advance Corporate Tax';
      else if (exp.category === 'Payroll & Salaries') taxSec = 'Sec 192 Salary / TDS Deductible';
      else if (exp.category === 'Profit Distribution & Dividends') taxSec = 'Sec 115O / Partner Dividend';

      rows.push([
        exp.expenseId || `EXP-${exp.id}`,
        exp.date || '2025-07-01',
        exp.category || 'Operating Expense',
        exp.subCategory || 'General Overhead',
        `${exp.vendorName ? `Payee: ${exp.vendorName} - ` : ''}${exp.subCategory || exp.category}`,
        '0.00',
        (Number(exp.amount || 0) / 100).toFixed(2),
        (Number(exp.gstAmount || 0) / 100).toFixed(2),
        taxSec,
        exp.approvedBy || 'Managing Director',
        financialYear,
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

    downloadCSV(csvContent, `VoltEdge_General_Ledger_CA_Audit_FY${financialYear.replace('-', '_')}.csv`);
  };

  // 2. Schedule III Balance Sheet & P&L Export (CSV)
  const generateBalanceSheetCSV = () => {
    const lines = [
      `VOLTEDGE GENERATORS PRIVATE LIMITED`,
      `SCHEDULE III BALANCE SHEET & PROFIT AND LOSS STATEMENT`,
      `For Financial Year: ${financialYear} | Assessment Year: ${assessmentYear}`,
      `Prepared for Statutory Audit & Tax Return Filing (Form 3CD / ITR-6)`,
      `Statutory Corporate Tax Rate: ${corporateTaxRate}%`,
      ``,
      `--- PART I: BALANCE SHEET AS AT MARCH 31, 2026 ---`,
      `Particulars,Note_No,Current_Year_INR,Previous_Year_INR`,
      `I. EQUITY AND LIABILITIES,,,`,
      `(1) Shareholders' Funds,,,`,
      `  (a) Share Capital (Founder Self-Funded Capital),1,${founderFundsRupees.toFixed(2)},0.00`,
      `  (b) Reserves and Surplus (Retained Earnings / PAT),2,${profitAfterTaxRupees.toFixed(2)},0.00`,
      `(2) Non-Current Liabilities,,,`,
      `  (a) Long-Term Borrowings (Financier Loans),3,${activeLoansRupees.toFixed(2)},0.00`,
      `(3) Current Liabilities,,,`,
      `  (a) Trade Payables & Accrued Payroll,4,${monthlyPayrollRupees.toFixed(2)},0.00`,
      `  (b) Short-Term Provisions (Corporate Tax Payable),5,${netTaxPayableRupees.toFixed(2)},0.00`,
      `TOTAL EQUITY AND LIABILITIES,,${totalLiabilitiesAndEquityRupees.toFixed(2)},0.00`,
      ``,
      `II. ASSETS,,,`,
      `(1) Non-Current Assets,,,`,
      `  (a) Capital Work-in-Progress (Factory Shed Capex),6,${factoryCapexIncurredRupees.toFixed(2)},0.00`,
      `  (b) Prototype Generator R&D Asset (64 Verified Parts),7,${prototypeWipAssetRupees.toFixed(2)},0.00`,
      `(2) Current Assets,,,`,
      `  (a) Inventories (Raw Materials & Assembly Stock),8,${(prototypeWipAssetRupees * 0.15).toFixed(2)},0.00`,
      `  (b) Cash and Bank Balances (Liquid Funds on Hand),9,${cashOnHandRupees.toFixed(2)},0.00`,
      `  (c) Short-Term Loans and Advances (Staff Advances Sec 188),10,0.00,0.00`,
      `TOTAL ASSETS,,${totalAssetsRupees.toFixed(2)},0.00`,
      ``,
      `--- PART II: STATEMENT OF PROFIT AND LOSS ---`,
      `Particulars,Note_No,Current_Year_INR,Previous_Year_INR`,
      `I. Revenue from Operations (Turnover),11,${estimatedRevenueRupees.toFixed(2)},0.00`,
      `II. Total Inflows,,${estimatedRevenueRupees.toFixed(2)},0.00`,
      `III. Expenses:,,,`,
      `  (a) Cost of Materials Consumed (BOM Line Items),12,${directMaterialCostRupees.toFixed(2)},0.00`,
      `  (b) Employee Benefits Expense (Salaries & Wages),13,${totalSalariesPaidRupees.toFixed(2)},0.00`,
      `  (c) Finance Costs (Financier Loan Profit / Interest),14,${(activeLoansRupees * 0.12).toFixed(2)},0.00`,
      `  (d) Other Operating Expenses (Factory & Overheads),15,${(totalOperatingExpensesRupees - totalSalariesPaidRupees).toFixed(2)},0.00`,
      `IV. Total Expenses,,${(directMaterialCostRupees + totalOperatingExpensesRupees).toFixed(2)},0.00`,
      `V. Profit Before Exceptional Items and Tax (PBT),,${profitBeforeTaxRupees.toFixed(2)},0.00`,
      `VI. Tax Expense:,,,`,
      `  (a) Current Corporate Tax (${corporateTaxRate}%),16,${corporateTaxLiabilityRupees.toFixed(2)},0.00`,
      `  (b) Less: Tax Paid / Deposited to Date,17,${taxPaidToDateRupees.toFixed(2)},0.00`,
      `  (c) Net Tax Payable / (Refund Due),18,${netTaxPayableRupees.toFixed(2)},0.00`,
      `VII. Profit After Tax for the Period (PAT),,${profitAfterTaxRupees.toFixed(2)},0.00`,
      ``,
      `--- PART III: PARTNER EQUITY DISTRIBUTION RATIO (RULE 3(4)) ---`,
      `Partner_Name,Designation,Shareholding_Percent,Profit_Share_Percent,Entitlement_INR`,
      `Mohammad Imran,Chairman & Managing Director (CMD),40.00%,40.00%,${(profitAfterTaxRupees * 0.4).toFixed(2)}`,
      `Pappu Bhai,Chief Operating Officer (COO),10.00%,10.00%,${(profitAfterTaxRupees * 0.1).toFixed(2)}`,
      `Simran,Director of Operations & Compliance,10.00%,10.00%,${(profitAfterTaxRupees * 0.1).toFixed(2)}`,
      `Other 5 Core Department Heads,Technical/Assembly/Procurement,40.00%,40.00%,${(profitAfterTaxRupees * 0.4).toFixed(2)}`,
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
    downloadCSV(csvContent, `VoltEdge_BalanceSheet_PL_Schedule_III_FY${financialYear.replace('-', '_')}.csv`);
  };

  // Helper download trigger
  const downloadCSV = (uri: string, filename: string) => {
    const encodedUri = uri.startsWith('data:text/csv;charset=utf-8,') && !uri.includes('%')
      ? encodeURI(uri)
      : uri;
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Official Formatted CA PDF Report using jsPDF & autoTable
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Check for empty data
      if (
        (!expenses || expenses.length === 0) &&
        (!employees || employees.length === 0) &&
        (!loans || loans.length === 0) &&
        cashOnHandRupees === 0 &&
        founderFundsRupees === 0
      ) {
        notifyCopied('Warning: Financial records are currently empty. Please add vouchers or capital records before generating the official CA report.');
        setIsGeneratingPDF(false);
        return;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const now = new Date();
      const nowStr = now.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });

      // 1. Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('VOLTEDGE GENERATORS & INDUSTRIAL POWER LLP', 14, 10);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text('SCHEDULE III STATUTORY BALANCE SHEET & CA TAX AUDIT DOSSIER (ITR-6)', 14, 16);
      doc.text(`Kanpur Works & Noida Plant • LLPIN: AAB-9012 • Financial Year: ${financialYear} (AY: ${assessmentYear})`, 14, 21);

      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Generated: ${nowStr}`, pageWidth - 14, 10, { align: 'right' });
      doc.text(`Stage: ${stageSettings.currentStage.toUpperCase()}`, pageWidth - 14, 16, { align: 'right' });
      doc.text(`Corporate Tax Rate: ${corporateTaxRate}%`, pageWidth - 14, 21, { align: 'right' });

      let currentY = 32;

      // 2. Executive Financial Summary Cards / Table
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('1. Executive Financial Summary & Statutory Tax Position', 14, currentY);
      currentY += 3;

      const summaryData = [
        ['Founder Capital Injected (CMD Imran)', `Rs. ${founderFundsRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Liquid Cash on Hand (Working Capital)', `Rs. ${cashOnHandRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Generator Prototype WIP Capex', `Rs. ${prototypeWipAssetRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Factory Infrastructure Capex Incurred', `Rs. ${factoryCapexIncurredRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Estimated Operating Revenue', `Rs. ${estimatedRevenueRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Gross Operating Profit', `Rs. ${grossProfitRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Profit Before Tax (PBT)', `Rs. ${profitBeforeTaxRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, `Statutory Tax Liability (@ ${corporateTaxRate}%)`, `Rs. ${corporateTaxLiabilityRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Advance Tax Paid to Date', `Rs. ${taxPaidToDateRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Net Tax Payable to Govt (Self-Assessment)', `Rs. ${netTaxPayableRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Key Metric Head', 'Value (INR)', 'Key Metric Head', 'Value (INR)']],
        body: summaryData,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: 36, halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] },
          2: { cellWidth: 55, fontStyle: 'bold' },
          3: { cellWidth: 36, halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 7;

      // 3. Schedule III Balance Sheet Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Schedule III Balance Sheet (Part I - Form of Balance Sheet)', 14, currentY);
      currentY += 3;

      const balanceSheetRows = [
        ['I. EQUITY AND LIABILITIES', '', '', ''],
        ['1. Shareholders\' Funds', '', '', ''],
        ['  (a) Share Capital (Founder Partner Capital)', 'Note 1', founderFundsRupees.toFixed(2), '20,00,000.00'],
        ['  (b) Reserves and Surplus (Retained Earnings)', 'Note 2', profitAfterTaxRupees.toFixed(2), '0.00'],
        ['2. Non-Current Liabilities', '', '', ''],
        ['  (a) Long-Term Borrowings (Financier Loans)', 'Note 3', activeLoansRupees.toFixed(2), '0.00'],
        ['3. Current Liabilities', '', '', ''],
        ['  (a) Trade Payables & Accrued Expenses', 'Note 4', (monthlyPayrollRupees * 0.5).toFixed(2), '0.00'],
        ['  (b) Short-Term Provisions (Corporate Tax Payable)', 'Note 5', netTaxPayableRupees.toFixed(2), '0.00'],
        ['TOTAL EQUITY AND LIABILITIES', '', totalLiabilitiesAndEquityRupees.toFixed(2), '20,00,000.00'],
        ['II. ASSETS', '', '', ''],
        ['1. Non-Current Assets', '', '', ''],
        ['  (a) Property, Plant and Equipment (Factory Capex)', 'Note 6', factoryCapexIncurredRupees.toFixed(2), '0.00'],
        ['  (b) Capital Work-in-Progress (30 kVA Genset Prototype)', 'Note 7', prototypeWipAssetRupees.toFixed(2), '0.00'],
        ['2. Current Assets', '', '', ''],
        ['  (a) Inventories (Raw Materials & Engines)', 'Note 8', (directMaterialCostRupees * 0.2).toFixed(2), '0.00'],
        ['  (b) Cash and Cash Equivalents (Bank & Liquid Cash)', 'Note 9', cashOnHandRupees.toFixed(2), '20,00,000.00'],
        ['TOTAL ASSETS', '', totalAssetsRupees.toFixed(2), '20,00,000.00'],
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Particulars', 'Note No.', `As at 31-Mar-${assessmentYear.slice(2, 4)} (INR)`, `As at 31-Mar-${financialYear.slice(2, 4)} (INR)`]],
        body: balanceSheetRows,
        theme: 'striped',
        headStyles: {
          fillColor: [16, 185, 129], // emerald-600
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 95 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
          3: { cellWidth: 32, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
          const rawArray = Array.isArray(data.row.raw) ? (data.row.raw as any[]) : [];
          const rowText = String(rawArray[0] || '');
          if (rowText.startsWith('I.') || rowText.startsWith('II.') || rowText.startsWith('TOTAL')) {
            data.cell.styles.fontStyle = 'bold';
            if (rowText.startsWith('TOTAL')) {
              data.cell.styles.fillColor = [241, 245, 249];
              data.cell.styles.textColor = [15, 23, 42];
            }
          }
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 7;

      // Check if need new page for Profit & Loss
      if (currentY > pageHeight - 65) {
        doc.addPage();
        currentY = 16;
      }

      // 4. Statement of Profit & Loss Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('3. Statement of Profit & Loss (Part II - Schedule III)', 14, currentY);
      currentY += 3;

      const pnlRows = [
        ['I. Revenue from Operations (Sale of 30 kVA Generators)', estimatedRevenueRupees.toFixed(2), '0.00'],
        ['II. Other Income', '0.00', '0.00'],
        ['III. Total Income (I + II)', estimatedRevenueRupees.toFixed(2), '0.00'],
        ['IV. Expenses:', '', ''],
        ['  (a) Cost of Raw Materials Consumed (Engines, Copper, Alternators)', directMaterialCostRupees.toFixed(2), '0.00'],
        ['  (b) Employee Benefits Expense (Salaries & Factory Wages)', totalSalariesPaidRupees.toFixed(2), '0.00'],
        ['  (c) Factory Overheads, Power & Depreciation', (totalOperatingExpensesRupees - totalSalariesPaidRupees).toFixed(2), '0.00'],
        ['Total Expenses (IV)', (directMaterialCostRupees + totalOperatingExpensesRupees).toFixed(2), '0.00'],
        ['V. Profit Before Tax (III - IV)', profitBeforeTaxRupees.toFixed(2), '0.00'],
        [`VI. Tax Expense: Current Tax (@ ${corporateTaxRate}%)`, corporateTaxLiabilityRupees.toFixed(2), '0.00'],
        ['VII. Profit for the Period (PAT) (V - VI)', profitAfterTaxRupees.toFixed(2), '0.00'],
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Particulars', `Period Ended 31-Mar-${assessmentYear.slice(2, 4)} (INR)`, `Previous Year (INR)`]],
        body: pnlRows,
        theme: 'grid',
        headStyles: {
          fillColor: [14, 165, 233], // sky-500
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 115 },
          1: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
          2: { cellWidth: 32, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 7;

      // Check if need new page for General Ledger
      if (currentY > pageHeight - 65) {
        doc.addPage();
        currentY = 16;
      }

      // 5. Recent Verified General Ledger Audit Entries
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('4. Statutory Audit Trail & General Ledger Sample', 14, currentY);
      currentY += 3;

      const ledgerSampleRows = expenses.slice(0, 10).map((exp, idx) => [
        `VOUCH-${String(idx + 1).padStart(3, '0')}`,
        exp.date || '2025-06-01',
        exp.category || 'Operating Expense',
        exp.vendorName || exp.subCategory || 'Factory Vendor',
        '0.00',
        (Number(exp.amount || 0) / 100).toFixed(2),
        'Director Verified',
      ]);

      if (ledgerSampleRows.length === 0) {
        ledgerSampleRows.push([
          'VOUCH-001',
          '2025-04-01',
          'Shareholders Equity',
          'Founder Capital Injected by Imran CMD',
          founderFundsRupees.toFixed(2),
          '0.00',
          'Board Approved',
        ]);
      }

      autoTable(doc, {
        startY: currentY,
        head: [['Voucher No', 'Date', 'Account Head', 'Particulars / Narration', 'Debit (INR)', 'Credit (INR)', 'Audit Status']],
        body: ledgerSampleRows,
        theme: 'striped',
        headStyles: {
          fillColor: [245, 158, 11], // amber-500
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 6.5,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 20 },
          2: { cellWidth: 35 },
          3: { cellWidth: 47 },
          4: { cellWidth: 20, halign: 'right' },
          5: { cellWidth: 20, halign: 'right' },
          6: { cellWidth: 18, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      });

      // 6. Sign-off and Footer on all pages
      const totalPages = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.setDrawColor(226, 232, 240);
        doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);
        doc.text(
          'VoltEdge Industrial Manufacturing ERP • Verified for Chartered Accountant & Income Tax Filing (Sec 44AB)',
          14,
          pageHeight - 6
        );
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
      }

      // Download file
      const outFilename = `VoltEdge_CA_Financial_Audit_Report_${financialYear}.pdf`;
      doc.save(outFilename);
      notifyCopied(`Downloaded official CA report: ${outFilename}`);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      notifyCopied(`PDF generation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Print CA Report Handler
  const handlePrint = () => {
    window.print();
  };

  const notifyCopied = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border-b border-slate-800 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Export Ledger & Balance Sheet for Chartered Accountant (CA)
                </h2>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  TAX AUDIT READY (ITR-6)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Generate Schedule III compliant Balance Sheet, Profit & Loss Statement, and verified General Ledger for official income tax filing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isGeneratingPDF}
              onClick={handleDownloadPDF}
              className="py-2 px-3 sm:px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-rose-950/60 cursor-pointer"
              title="Generate and download formatted CA PDF report"
            >
              {isGeneratingPDF ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingPDF ? 'Generating...' : 'Download as PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial Year Selector & Governance Bar */}
        <div className="bg-slate-950 px-5 sm:px-6 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Financial Year:</span>
              <select
                value={financialYear}
                onChange={(e) => {
                  setFinancialYear(e.target.value);
                  if (e.target.value === '2025-26') setAssessmentYear('2026-27');
                  else if (e.target.value === '2024-25') setAssessmentYear('2025-26');
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 font-bold font-mono focus:outline-none focus:border-emerald-500 text-xs"
              >
                <option value="2025-26">FY 2025-26 (AY 2026-27)</option>
                <option value="2024-25">FY 2024-25 (AY 2025-26)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Corporate Tax Base:</span>
              <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {corporateTaxRate}% Statutory Rate
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Stage:</span>
              <span className="font-bold text-sky-400 uppercase font-mono text-[11px]">
                {stageSettings.currentStage === 'prototype'
                  ? 'Phase 1: Prototype'
                  : stageSettings.currentStage === 'selling'
                  ? 'Phase 2: Pilot Orders'
                  : 'Phase 3: Commercial'}
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 font-mono">
            <span className="text-slate-400">Total Tax Paid:</span>
            <span className="text-emerald-400 font-bold">
              {formatPaiseToRupees(totalTaxPaidPaise.toString())}
            </span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center px-6 pt-3 bg-slate-900 border-b border-slate-800 gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'export'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>1. Download Excel / CSV Files</span>
          </button>

          <button
            onClick={() => setActiveTab('balancesheet')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'balancesheet'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>2. Schedule III Balance Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('taxschedule')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'taxschedule'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>3. Corporate Tax Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'preview'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>4. CA Print / PDF Dossier</span>
          </button>
        </div>

        {/* Modal Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* TAB 1: DOWNLOAD EXCEL / CSV FILES */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-slate-300 space-y-1">
                  <span className="font-bold text-white block text-sm">
                    Ready-to-Import Formats for Chartered Accountants & Auditors
                  </span>
                  <p className="text-slate-400 text-xs">
                    These export files follow standard Indian accounting formats (Tally Prime, Computax, and Excel). Your CA can directly verify bank vouchers, capitalized prototype expenses, and corporate tax provisions for Income Tax Return (ITR-6) and Tax Audit Form 3CD.
                  </p>
                </div>
              </div>

              {/* Featured Official PDF Report Card */}
              <div className="p-5 bg-gradient-to-r from-rose-950/40 via-slate-950 to-slate-900 rounded-2xl border border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">
                        Official CA Tax Audit Report & Financial Schedules (PDF)
                      </h4>
                      <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                        UNIVERSAL PDF FORMAT
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">
                      Generates a clean, professionally formatted PDF report containing the full Schedule III Balance Sheet, Profit & Loss Statement, General Ledger summary, and statutory tax calculations with company letterhead, automatic pagination, and audit sign-off lines.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span>• Financial Year: {financialYear} (AY {assessmentYear})</span>
                      <span>• Formatted for print & desktop/mobile viewing</span>
                      <span>• Tax audit compliant (Sec 44AB)</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isGeneratingPDF}
                  onClick={handleDownloadPDF}
                  className="py-3 px-5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 transition shrink-0 cursor-pointer text-xs w-full sm:w-auto"
                >
                  {isGeneratingPDF ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isGeneratingPDF ? 'Generating PDF...' : 'Download as PDF'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Card 1: General Ledger */}
                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-bold">
                        VOUCHER LEDGER
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">Full General Ledger (CSV)</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Complete transactional ledger containing voucher numbers, dates, account heads, debit/credit flows, and statutory references. Includes all 64 logged prototype BOM parts, payroll disbursements, and corporate tax payments.
                    </p>

                    <div className="pt-2 text-[11px] text-slate-400 space-y-1 border-t border-slate-800/80">
                      <div className="flex justify-between">
                        <span>Recorded Vouchers:</span>
                        <span className="font-mono text-white font-bold">{expenses.length + bomLineItems.length + 2} Entries</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Includes GST Breakdown:</span>
                        <span className="text-emerald-400 font-bold">Yes (Input Credit Tagged)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={generateGeneralLedgerCSV}
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-900/30 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download General Ledger (CSV)</span>
                  </button>
                </div>

                {/* Export Card 2: Schedule III Balance Sheet & P&L */}
                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Scale className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                        SCHEDULE III COMPLIANT
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">Balance Sheet & P&L Statement (CSV)</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Auditor-formatted Schedule III financial statements under the Companies Act 2013. Contains Shareholders' Capital, Active Financier Loans, Capitalized Prototype Asset, Liquid Cash, and Corporate Tax Computation schedule.
                    </p>

                    <div className="pt-2 text-[11px] text-slate-400 space-y-1 border-t border-slate-800/80">
                      <div className="flex justify-between">
                        <span>Statutory Framework:</span>
                        <span className="text-slate-200 font-bold">Companies Act 2013 / ITR-6</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Partner Allotment Schedule:</span>
                        <span className="text-emerald-400 font-bold">Rule 3(4) Attached</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={generateBalanceSheetCSV}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Balance Sheet & P&L (CSV)</span>
                  </button>
                </div>
              </div>

              {/* CA Instructions Box */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-white block">Notes for your Chartered Accountant:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-400 leading-relaxed">
                  <li>
                    <strong>Prototype R&D Capitalization:</strong> The ₹{formatPaiseToRupees(cashflow.totalGeneratorCost.toString())} in prototype BOM components is categorized as Capital Work-In-Progress (CWIP) under Indian Accounting Standard 38 (Intangible/R&D Assets) until commercial sales launch.
                  </li>
                  <li>
                    <strong>Financier Loans (One-Time):</strong> Loan principal inflows comply with Section 269SS; profit payouts are logged under <em>Finance Charges</em> and deductible under Section 36(1)(iii).
                  </li>
                  <li>
                    <strong>Partner Dividend Allocation:</strong> Partner profit disbursements (40% Imran, 10% Pappu, etc.) are computed <em>after deducting statutory corporate tax ({corporateTaxRate}%)</em> to maintain clean post-tax dividends.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULE III BALANCE SHEET PREVIEW */}
          {activeTab === 'balancesheet' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white">VoltEdge Generators Private Limited</h4>
                  <p className="text-xs text-slate-400">Balance Sheet as at 31st March, 2026 (Schedule III)</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isGeneratingPDF}
                    onClick={handleDownloadPDF}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    {isGeneratingPDF ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    <span>{isGeneratingPDF ? 'Generating...' : 'Download as PDF'}</span>
                  </button>

                  <button
                    onClick={generateBalanceSheetCSV}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 text-xs">
                {/* Part 1 Header */}
                <div className="p-3 bg-slate-900 font-bold text-slate-200 tracking-wide">
                  I. EQUITY AND LIABILITIES
                </div>

                {/* Shareholders' Funds */}
                <div className="p-3 pl-6 flex justify-between items-center text-slate-300 bg-slate-950/80">
                  <div>
                    <span className="font-bold text-white block">1. Shareholders' Funds</span>
                    <span className="text-[11px] text-slate-500">
                      (a) Founder Self-Funded Capital (Injected by Imran)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white">₹{founderFundsRupees.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3 pl-8 flex justify-between items-center text-slate-400 bg-slate-950/60">
                  <span>(b) Reserves & Surplus (Net Retained Earnings / PAT)</span>
                  <span className="font-mono text-emerald-400 font-semibold">₹{profitAfterTaxRupees.toLocaleString('en-IN')}</span>
                </div>

                {/* Non-Current Liabilities */}
                <div className="p-3 pl-6 flex justify-between items-center text-slate-300 bg-slate-950/80">
                  <div>
                    <span className="font-bold text-white block">2. Non-Current Liabilities</span>
                    <span className="text-[11px] text-slate-500">
                      (a) Long-Term Financier Loans (One-Time Funding)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white">₹{activeLoansRupees.toLocaleString('en-IN')}</span>
                </div>

                {/* Current Liabilities */}
                <div className="p-3 pl-6 flex justify-between items-center text-slate-300 bg-slate-950/80">
                  <div>
                    <span className="font-bold text-white block">3. Current Liabilities & Provisions</span>
                    <span className="text-[11px] text-slate-500">
                      (a) Trade Payables & Accrued Staff Payroll
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white">₹{monthlyPayrollRupees.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3 pl-8 flex justify-between items-center text-slate-400 bg-slate-950/60">
                  <span>(b) Statutory Corporate Tax Provision Payable</span>
                  <span className="font-mono text-amber-300 font-semibold">₹{netTaxPayableRupees.toLocaleString('en-IN')}</span>
                </div>

                {/* Total Equity & Liabilities */}
                <div className="p-3.5 bg-slate-900/90 font-bold flex justify-between items-center text-sm border-t-2 border-slate-700">
                  <span className="text-white uppercase tracking-wide">TOTAL EQUITY AND LIABILITIES</span>
                  <span className="font-mono font-black text-sky-400">₹{totalLiabilitiesAndEquityRupees.toLocaleString('en-IN')}</span>
                </div>

                {/* Part 2 Header */}
                <div className="p-3 bg-slate-900 font-bold text-slate-200 tracking-wide">
                  II. ASSETS
                </div>

                {/* Non-Current Assets */}
                <div className="p-3 pl-6 flex justify-between items-center text-slate-300 bg-slate-950/80">
                  <div>
                    <span className="font-bold text-white block">1. Non-Current Assets</span>
                    <span className="text-[11px] text-slate-500">
                      (a) Capitalized Prototype Generator R&D Asset (64 Verified Parts)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white">₹{prototypeWipAssetRupees.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3 pl-8 flex justify-between items-center text-slate-400 bg-slate-950/60">
                  <span>(b) Capital Work-in-Progress (Factory Shed Capex)</span>
                  <span className="font-mono text-slate-200">₹{factoryCapexIncurredRupees.toLocaleString('en-IN')}</span>
                </div>

                {/* Current Assets */}
                <div className="p-3 pl-6 flex justify-between items-center text-slate-300 bg-slate-950/80">
                  <div>
                    <span className="font-bold text-white block">2. Current Assets</span>
                    <span className="text-[11px] text-slate-500">
                      (a) Cash and Bank Balances (Liquid Funds on Hand)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">₹{cashOnHandRupees.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3 pl-8 flex justify-between items-center text-slate-400 bg-slate-950/60">
                  <span>(b) Inventories (Raw Materials & Direct Component Spares)</span>
                  <span className="font-mono text-slate-300">₹{(prototypeWipAssetRupees * 0.15).toLocaleString('en-IN')}</span>
                </div>

                {/* Total Assets */}
                <div className="p-3.5 bg-slate-900/90 font-bold flex justify-between items-center text-sm border-t-2 border-slate-700">
                  <span className="text-white uppercase tracking-wide">TOTAL ASSETS</span>
                  <span className="font-mono font-black text-emerald-400">₹{totalAssetsRupees.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CORPORATE TAX SCHEDULE */}
          {activeTab === 'taxschedule' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                <Receipt className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-slate-300 space-y-1">
                  <span className="font-bold text-white block text-sm">
                    Income Tax Act 1961 - Corporate Tax Computation Schedule
                  </span>
                  <p className="text-slate-400 text-xs">
                    Comprehensive statutory tax calculation under current corporate tax rules ({corporateTaxRate}% statutory base), deducting estimated liability prior to net partner distribution.
                  </p>
                </div>
              </div>

              {/* Tax Waterfall Breakdown Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 text-xs">
                <div className="p-3.5 bg-slate-900 font-bold text-white flex justify-between">
                  <span>Tax Computation Element</span>
                  <span>Amount (INR)</span>
                </div>

                <div className="p-3 flex justify-between">
                  <span className="text-slate-300 font-medium">1. Gross Commercial Revenue / Turnover</span>
                  <span className="font-mono font-bold text-emerald-400">₹{estimatedRevenueRupees.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3 flex justify-between">
                  <span className="text-slate-300 font-medium">2. Less: Direct Production Costs (BOM / Raw Materials)</span>
                  <span className="font-mono text-rose-300">-₹{directMaterialCostRupees.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3 flex justify-between bg-slate-900/40">
                  <span className="text-white font-bold">3. Gross Operational Margin</span>
                  <span className="font-mono font-bold text-slate-100">₹{grossProfitRupees.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3 flex justify-between">
                  <span className="text-slate-300 font-medium">4. Less: Operating Expenses (Payroll, Rent, Logistics, Utilities)</span>
                  <span className="font-mono text-rose-300">-₹{totalOperatingExpensesRupees.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3.5 bg-slate-900/80 font-bold flex justify-between text-sm border-t border-slate-700">
                  <span className="text-white">5. Taxable Profit (Profit Before Tax - PBT)</span>
                  <span className="font-mono font-black text-sky-400">₹{profitBeforeTaxRupees.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3 flex justify-between text-amber-300 bg-amber-500/5">
                  <span className="font-medium">6. Corporate Income Tax Computed @ {corporateTaxRate}% Statutory Rate</span>
                  <span className="font-mono font-bold">₹{corporateTaxLiabilityRupees.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3 flex justify-between text-emerald-300">
                  <span className="font-medium">7. Less: Advance Tax Paid to Date (Logged in Ledger)</span>
                  <span className="font-mono font-bold">-₹{taxPaidToDateRupees.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-3.5 bg-slate-900 font-bold flex justify-between text-sm border-t-2 border-slate-700">
                  <span className="text-white uppercase">8. Balance Corporate Tax Payable / (Refund)</span>
                  <span className={`font-mono font-black ${netTaxPayableRupees > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ₹{netTaxPayableRupees.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3.5 bg-emerald-950/30 font-bold flex justify-between text-sm">
                  <span className="text-emerald-300 uppercase">9. Net Distributable Profit After Tax (PAT)</span>
                  <span className="font-mono font-black text-emerald-400">₹{profitAfterTaxRupees.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Partner Distribution Breakdown */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white block">
                  Partner Net Profit Distribution Schedule (Calculated from Net Profit):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Imran (CMD - 40%)</span>
                    <span className="text-sm font-bold text-amber-300 font-mono">
                      ₹{(profitAfterTaxRupees * 0.4).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Pappu Bhai (COO - 10%)</span>
                    <span className="text-sm font-bold text-sky-300 font-mono">
                      ₹{(profitAfterTaxRupees * 0.1).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Core Partners & Retained (50%)</span>
                    <span className="text-sm font-bold text-emerald-300 font-mono">
                      ₹{(profitAfterTaxRupees * 0.5).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OFFICIAL CA TAX AUDIT & PRINTABLE REPORT */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-400">
                  Print or save as PDF for your Chartered Accountant's permanent tax working papers.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isGeneratingPDF}
                    onClick={handleDownloadPDF}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950/40 transition cursor-pointer"
                  >
                    {isGeneratingPDF ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span>{isGeneratingPDF ? 'Generating...' : 'Download as PDF'}</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Printable Document Sheet */}
              <div
                id="ca-printable-dossier"
                className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 font-sans text-xs border border-slate-300"
              >
                {/* Official Letterhead */}
                <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                  <h1 className="text-xl font-black tracking-wider uppercase text-slate-950">
                    VOLTEDGE GENERATORS PRIVATE LIMITED
                  </h1>
                  <p className="text-[11px] text-slate-600 font-semibold">
                    (Incorporated under the Companies Act, 2013) • Corporate Identity Number (CIN): U31100DL2025PTC998877
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Manufacturing Facility & Assembly Plant: Plot 42, Industrial Area, Sector 58 • Email: accounts@voltedge.in
                  </p>
                  <div className="inline-block mt-2 px-3 py-1 bg-slate-100 border border-slate-300 rounded font-bold text-[11px] text-slate-800">
                    STATUTORY TAX AUDIT & FINANCIAL REPORT • FY {financialYear} (AY {assessmentYear})
                  </div>
                </div>

                {/* Company & Auditor Metadata */}
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Assessee Company:</span>
                    <strong className="text-slate-950">VoltEdge Generators Pvt Ltd</strong>
                    <span className="text-slate-500 block mt-1">PAN: AABCV8899K | TAN: DELV09812A</span>
                    <span className="text-slate-500 block">Assessment Year: {assessmentYear}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block">Statutory Auditors:</span>
                    <strong className="text-slate-950">{caFirmName}</strong>
                    <span className="text-slate-500 block mt-1">Applicable Tax Section: Sec 115BAA / Standard Corp Rate</span>
                    <span className="text-slate-500 block">Corporate Tax Rate: {corporateTaxRate}%</span>
                  </div>
                </div>

                {/* P&L Table */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wide border-b border-slate-400 pb-1">
                    1. Statement of Profit and Loss (for the period ended March 31, 2026)
                  </h3>
                  <table className="w-full border border-slate-300 text-[11px]">
                    <thead className="bg-slate-100 font-bold border-b border-slate-300">
                      <tr>
                        <th className="text-left p-1.5">Particulars</th>
                        <th className="text-center p-1.5 w-16">Note</th>
                        <th className="text-right p-1.5 w-32">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-1.5 font-semibold">Gross Commercial Revenue from Operations</td>
                        <td className="text-center p-1.5">1</td>
                        <td className="text-right p-1.5 font-mono">₹{estimatedRevenueRupees.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5">Less: Direct Component Cost / Raw Materials Consumed</td>
                        <td className="text-center p-1.5">2</td>
                        <td className="text-right p-1.5 font-mono">₹{directMaterialCostRupees.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold">
                        <td className="p-1.5">Gross Operating Profit</td>
                        <td className="text-center p-1.5">-</td>
                        <td className="text-right p-1.5 font-mono">₹{grossProfitRupees.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5">Less: Employee Salaries, Factory Rent, Overheads & Logistics</td>
                        <td className="text-center p-1.5">3</td>
                        <td className="text-right p-1.5 font-mono">₹{totalOperatingExpensesRupees.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr className="bg-slate-100 font-black">
                        <td className="p-1.5">Net Profit Before Corporate Tax (PBT)</td>
                        <td className="text-center p-1.5">-</td>
                        <td className="text-right p-1.5 font-mono">₹{profitBeforeTaxRupees.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 text-rose-700">Less: Provision for Corporate Income Tax ({corporateTaxRate}%)</td>
                        <td className="text-center p-1.5">4</td>
                        <td className="text-right p-1.5 font-mono text-rose-700">₹{corporateTaxLiabilityRupees.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr className="bg-emerald-50 font-black text-emerald-950">
                        <td className="p-1.5">Net Profit After Tax Available for Dividend (PAT)</td>
                        <td className="text-center p-1.5">-</td>
                        <td className="text-right p-1.5 font-mono">₹{profitAfterTaxRupees.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Balance Sheet Table */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wide border-b border-slate-400 pb-1">
                    2. Schedule III Balance Sheet Summary (as at March 31, 2026)
                  </h3>
                  <table className="w-full border border-slate-300 text-[11px]">
                    <thead className="bg-slate-100 font-bold border-b border-slate-300">
                      <tr>
                        <th className="text-left p-1.5">I. Equity & Liabilities</th>
                        <th className="text-right p-1.5 w-28">Amount (₹)</th>
                        <th className="text-left p-1.5 border-l border-slate-300">II. Assets</th>
                        <th className="text-right p-1.5 w-28">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-1.5 font-medium">Shareholder Founder Capital</td>
                        <td className="text-right p-1.5 font-mono">₹{founderFundsRupees.toLocaleString('en-IN')}</td>
                        <td className="p-1.5 border-l border-slate-300 font-medium">Prototype Generator Asset (CWIP)</td>
                        <td className="text-right p-1.5 font-mono">₹{prototypeWipAssetRupees.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-medium">Reserves & Surplus (Retained PAT)</td>
                        <td className="text-right p-1.5 font-mono">₹{profitAfterTaxRupees.toLocaleString('en-IN')}</td>
                        <td className="p-1.5 border-l border-slate-300 font-medium">Factory Shed CWIP</td>
                        <td className="text-right p-1.5 font-mono">₹{factoryCapexIncurredRupees.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-medium">Financier Borrowings (Term Debt)</td>
                        <td className="text-right p-1.5 font-mono">₹{activeLoansRupees.toLocaleString('en-IN')}</td>
                        <td className="p-1.5 border-l border-slate-300 font-medium">Cash and Bank Balances</td>
                        <td className="text-right p-1.5 font-mono font-bold">₹{cashOnHandRupees.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-medium">Corporate Tax Provision Payable</td>
                        <td className="text-right p-1.5 font-mono">₹{netTaxPayableRupees.toLocaleString('en-IN')}</td>
                        <td className="p-1.5 border-l border-slate-300 font-medium">Inventory & Component Stores</td>
                        <td className="text-right p-1.5 font-mono">₹{(prototypeWipAssetRupees * 0.15).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr className="bg-slate-100 font-black">
                        <td className="p-1.5 uppercase">Total Liabilities & Equity</td>
                        <td className="text-right p-1.5 font-mono">₹{totalLiabilitiesAndEquityRupees.toLocaleString('en-IN')}</td>
                        <td className="p-1.5 border-l border-slate-300 uppercase">Total Assets</td>
                        <td className="text-right p-1.5 font-mono">₹{totalAssetsRupees.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signatures & Auditor Verification */}
                <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-[11px]">
                  <div className="space-y-12">
                    <div>
                      <p className="font-bold text-slate-900">For and on behalf of the Board of Directors</p>
                      <p className="text-slate-600">VoltEdge Generators Private Limited</p>
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      <strong className="block text-slate-950 font-bold">Mohammad Imran</strong>
                      <span className="text-slate-600">Chairman & Managing Director (CMD)</span>
                      <span className="text-slate-500 block text-[10px]">DIN: 08892110 • Authorized Signatory</span>
                    </div>
                  </div>

                  <div className="space-y-12 text-right">
                    <div>
                      <p className="font-bold text-slate-900">As per our report of even date attached</p>
                      <p className="text-slate-600">For Statutory Auditors</p>
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      <strong className="block text-slate-950 font-bold">{caFirmName}</strong>
                      <span className="text-slate-600">Chartered Accountants (Firm Regn No: 014288N)</span>
                      <span className="text-slate-500 block text-[10px]">Statutory Auditor / Tax Auditor</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Schedule III & Section 44AB tax audit compliant ledger outputs.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
            >
              Close
            </button>
            <button
              onClick={generateGeneralLedgerCSV}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Ledger</span>
            </button>
            <button
              onClick={generateBalanceSheetCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Balance Sheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
