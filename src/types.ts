// src/types.ts
export type UserRole = 'Admin/Owner' | 'Finance/CA' | 'Department Head' | 'Read-only Viewer';

export type EmployeeCategory = 
  | 'Core Team'
  | 'Department Head'
  | 'Management & Support'
  | 'Field & Logistics'
  | 'Director'
  | 'Senior Manager'
  | 'Engineer'
  | 'Machine Operator'
  | 'Service Staff'
  | 'Computer Staff'
  | 'Heavy Labor'
  | 'Security'
  | 'Cook'
  | string;

export interface Employee {
  id: number;
  employeeId: string;
  name: string;
  post?: string;
  category: EmployeeCategory;
  monthlySalary: string; // in paise
  isBonusEligible: boolean;
  isInsuranceEligible: boolean;
  isShareholder: boolean;
  shareholdingPercent: string;
  dividendPercent: string; // Profit share %
  phase: number; // 1 or 2
  joinDate: string;
  status: 'active' | 'inactive' | 'not_hired';
  phone?: string;
  email?: string;
  avatarUrl?: string;
  emergencyContact?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionRecord {
  id: number;
  month: number;
  year: number;
  unitsProduced: number;
  revenuePerUnit: string; // paise
  costOfGoodsPerUnit: string; // paise
}

export interface BonusRate {
  id: number;
  category: EmployeeCategory;
  bonusPerUnit: string; // paise
  effectiveYear: number;
  versionNotes?: string;
}

export interface InsurancePolicy {
  id: number;
  category: EmployeeCategory;
  premiumPerPersonPerYear: string; // paise
  coverageType: string;
}

export interface Expense {
  id: number;
  expenseId: string;
  category: string;
  subCategory: string;
  amount: string; // paise
  date: string;
  phase: number;
  vendorName: string;
  billReferenceNumber: string;
  gstAmount: string; // paise
  paymentStatus: 'paid' | 'pending';
  approvedBy: string;
  approvalStatus: 'Pending Approval' | 'Approved' | 'Rejected';
  approvalRequiredLevel: 'Auto' | 'Dept Head + Finance' | 'Director' | 'Board/Owner';
  receiptUrl?: string;
}

export interface ExpenseBudget {
  id: number;
  category: string;
  subCategory: string;
  budgetedAmount: string; // paise
  fiscalYear: number;
  phase: number;
}

export interface FactoryConstructionItem {
  id: number;
  component: string;
  budgetedAmount: string; // paise
  actualSpent: string; // paise
  phaseOfConstruction: string;
  percentPhysicalComplete: number;
  startDate: string;
  targetCompletionDate: string;
}

export interface Loan {
  id: number;
  loanId: string;
  lender: string;
  principalAmount: string; // paise
  interestRate: string; // e.g. "9.50"
  tenureMonths: number;
  disbursementDate: string;
  emiAmount: string; // paise
  outstandingBalance: string; // paise
  principalRepaid: string; // paise
  interestPaidToDate: string; // paise
  purpose: string;
  repaymentType?: 'total' | 'emi'; // 'total' (flat/lump-sum profit) or 'emi' (monthly EMI profit)
  totalProfitPaise?: string; // total profit amount in paise
  monthlyProfitPaise?: string; // monthly profit in paise
}

export interface Shareholder {
  id: number;
  name: string;
  shareholdingPercent: string;
  dividendPercent: string;
  panNumber?: string;
  notes?: string;
}

export interface CapitalAsset {
  id: number;
  assetTag: string;
  assetName: string;
  category: string;
  purchaseDate: string;
  purchaseCost: string; // paise
  salvageValue: string; // paise
  usefulLifeYears: number;
  annualRunningMaintenanceCost: string; // paise
}

export interface ProductPrototype {
  id: number;
  productId: string;
  serialNumber?: string;
  productName: string;
  productLine: string;
  powerRatingKva: number;
  status: 'Prototype' | 'In Development' | 'In Production' | 'Discontinued';
  sellingPrice?: string; // paise
  saleStatus?: 'Prototype Built' | 'Ready for Sale' | 'Sold' | 'In Production';
  customerName?: string;
  saleDate?: string;
  notes?: string;
  createdDate: string;
  targetLaunchDate: string;
  targetKvaBenchmark: number;
}

export interface BOMLineItem {
  id: number;
  productId: string;
  componentCategory: string;
  itemName: string;
  amount: string; // paise
  vendorOrPersonName: string;
  paymentMode: 'Cash' | 'GPay' | 'Bank' | 'Cheque';
  date: string;
  isEmployeeAdvance: boolean;
  linkedEmployeeId?: string;
  isMiscategorized: boolean;
  miscategorizedReason?: string;
  notes?: string;
}

export interface EmployeeAdvance {
  id: number;
  advanceId: string;
  employeeId: string;
  amount: string; // paise
  dateGiven: string;
  purpose: string;
  linkedProductId?: string;
  paymentMode: 'Cash' | 'GPay' | 'Bank' | 'Cheque';
  status: 'Outstanding' | 'Adjusted Against Bills Submitted' | 'Reconciled as Vendor Cost' | 'Recovered from Salary';
  isRelatedParty: boolean;
  reconciledDate?: string;
  reconciliationNotes?: string;
}

export interface AuditLog {
  id: number;
  entityType: string;
  entityId: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
  notes?: string;
}

export type BusinessStage = 'prototype' | 'selling' | 'full';

export interface StageSettings {
  currentStage: BusinessStage;
  isLoansActive: boolean;
  isFactoryActive: boolean;
  founderFundsPaise: string;
  activeCrewLevel: 'prototype_crew' | 'core_partners' | 'all_staff';
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  description?: string;
  currentStock: number;
  unit: string;
  minStockLevel: number;
  reorderPoint: number;
  unitCost: string; // in paise
  supplierName: string;
  supplierContactPerson?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierAddress?: string;
  leadTimeDays: number;
  lastRestockedDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

