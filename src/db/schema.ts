// src/db/schema.ts
import { boolean, integer, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table authenticated via Firebase
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('Admin/Owner'), // 'Admin/Owner' | 'Finance/CA' | 'Department Head' | 'Read-only Viewer'
  createdAt: timestamp('created_at').defaultNow(),
});

// Employees Table
// category: Director, Senior Manager, Engineer, Machine Operator, Service Staff, Computer Staff, Heavy Labor, Security, Cook
export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  employeeId: text('employee_id').notNull().unique(),
  name: text('name').notNull(),
  post: text('post').notNull().default(''), // Specific job title/designation
  category: text('category').notNull(), // Department/Group: Core Team, Department Head, Management & Support, Field & Logistics
  monthlySalary: text('monthly_salary').notNull(), // stored as string of integer paise
  isBonusEligible: boolean('is_bonus_eligible').notNull().default(true),
  isInsuranceEligible: boolean('is_insurance_eligible').notNull().default(true),
  isShareholder: boolean('is_shareholder').notNull().default(false),
  shareholdingPercent: numeric('shareholding_percent', { precision: 5, scale: 2 }).notNull().default('0.00'),
  dividendPercent: numeric('dividend_percent', { precision: 5, scale: 2 }).notNull().default('0.00'),
  phase: integer('phase').notNull().default(1), // 1 or 2
  joinDate: text('join_date').notNull(), // YYYY-MM-DD
  status: text('status').notNull().default('active'), // 'active' | 'inactive'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Production Table
export const production = pgTable('production', {
  id: serial('id').primaryKey(),
  month: integer('month').notNull(), // 1 to 12
  year: integer('year').notNull(), // e.g. 2026
  unitsProduced: integer('units_produced').notNull().default(0),
  revenuePerUnit: text('revenue_per_unit').notNull(), // paise
  costOfGoodsPerUnit: text('cost_of_goods_per_unit').notNull(), // paise
  createdAt: timestamp('created_at').defaultNow(),
});

// Bonus Rate Table (Versioned)
export const bonusRates = pgTable('bonus_rates', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(),
  bonusPerUnit: text('bonus_per_unit').notNull(), // paise per unit
  effectiveYear: integer('effective_year').notNull(), // versioned by year
  versionNotes: text('version_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Insurance Table
export const insurancePolicies = pgTable('insurance_policies', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(),
  premiumPerPersonPerYear: text('premium_per_person_per_year').notNull(), // paise
  coverageType: text('coverage_type').notNull(), // e.g., 'Group Health + Accidental ₹5L'
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Expense Entries
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  expenseId: text('expense_id').notNull().unique(),
  category: text('category').notNull(),
  subCategory: text('sub_category').notNull(),
  amount: text('amount').notNull(), // paise
  date: text('date').notNull(), // YYYY-MM-DD
  phase: integer('phase').notNull().default(1), // 1 or 2
  vendorName: text('vendor_name').notNull(),
  billReferenceNumber: text('bill_reference_number').notNull(),
  gstAmount: text('gst_amount').notNull().default('0'), // paise
  paymentStatus: text('payment_status').notNull().default('paid'), // 'paid' | 'pending'
  approvedBy: text('approved_by').notNull().default('Auto-Approved'),
  approvalStatus: text('approval_status').notNull().default('Approved'), // 'Pending Approval' | 'Approved' | 'Rejected'
  approvalRequiredLevel: text('approval_required_level').notNull().default('Auto'), // 'Auto' | 'Dept Head + Finance' | 'Director' | 'Board/Owner'
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Budget table for category/sub_category variance tracking
export const expenseBudgets = pgTable('expense_budgets', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(),
  subCategory: text('sub_category').notNull(),
  budgetedAmount: text('budgeted_amount').notNull(), // monthly budget in paise
  fiscalYear: integer('fiscal_year').notNull().default(2026),
  phase: integer('phase').notNull().default(1),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Factory Construction Budget Table
export const factoryConstructionBudget = pgTable('factory_construction_budget', {
  id: serial('id').primaryKey(),
  component: text('component').notNull(), // land, civil construction, utilities, machinery installation, compliance
  budgetedAmount: text('budgeted_amount').notNull(), // paise
  actualSpent: text('actual_spent').notNull().default('0'), // paise
  phaseOfConstruction: text('phase_of_construction').notNull(), // 'Phase 1 Site Prep' | 'Phase 2 Heavy Foundation' | 'Utilities Integration' | 'Final Commissioning'
  percentPhysicalComplete: integer('percent_physical_complete').notNull().default(0),
  startDate: text('start_date').notNull(),
  targetCompletionDate: text('target_completion_date').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Loans / Financing Table
export const loans = pgTable('loans', {
  id: serial('id').primaryKey(),
  loanId: text('loan_id').notNull().unique(),
  lender: text('lender').notNull(),
  principalAmount: text('principal_amount').notNull(), // paise
  interestRate: numeric('interest_rate', { precision: 5, scale: 2 }).notNull(), // annual % e.g. 9.50
  tenureMonths: integer('tenure_months').notNull(),
  disbursementDate: text('disbursement_date').notNull(), // YYYY-MM-DD
  emiAmount: text('emi_amount').notNull(), // paise
  outstandingBalance: text('outstanding_balance').notNull(), // paise
  principalRepaid: text('principal_repaid').notNull().default('0'), // paise
  interestPaidToDate: text('interest_paid_to_date').notNull().default('0'), // paise
  purpose: text('purpose').notNull(), // e.g. 'Factory Construction'
  repaymentType: text('repayment_type').notNull().default('total'), // 'total' (flat/lump-sum profit) or 'emi' (monthly profit/EMI)
  totalProfitPaise: text('total_profit_paise').notNull().default('0'), // total profit amount in paise
  monthlyProfitPaise: text('monthly_profit_paise').notNull().default('0'), // monthly profit amount in paise
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Shareholders Table
export const shareholders = pgTable('shareholders', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  shareholdingPercent: numeric('shareholding_percent', { precision: 5, scale: 2 }).notNull(),
  dividendPercent: numeric('dividend_percent', { precision: 5, scale: 2 }).notNull(),
  panNumber: text('pan_number'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Capital Equipment (Depreciable Assets)
export const capitalEquipment = pgTable('capital_equipment', {
  id: serial('id').primaryKey(),
  assetTag: text('asset_tag').notNull().unique(),
  assetName: text('asset_name').notNull(),
  category: text('category').notNull(), // generator sets, machinery, vehicles
  purchaseDate: text('purchase_date').notNull(), // YYYY-MM-DD
  purchaseCost: text('purchase_cost').notNull(), // paise
  salvageValue: text('salvage_value').notNull().default('0'), // paise
  usefulLifeYears: integer('useful_life_years').notNull().default(10),
  annualRunningMaintenanceCost: text('annual_running_maintenance_cost').notNull().default('0'), // paise
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Product / Prototype Table (Generator Sets by Serial Number)
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  productId: text('product_id').notNull().unique(), // e.g. "PRD-GEN-30KVA"
  serialNumber: text('serial_number').notNull().default(''), // e.g. "GEN-30KVA-SN001"
  productName: text('product_name').notNull(), // e.g. "30kVA Industrial Acoustic Generator Set Prototype"
  productLine: text('product_line').notNull().default('Generator Set'),
  powerRatingKva: integer('power_rating_kva').notNull().default(30), // e.g. 30 kVA
  status: text('status').notNull().default('Prototype'), // Prototype | In Development | In Production | Discontinued
  sellingPrice: text('selling_price').notNull().default('0'), // in paise (e.g. 65000000 = ₹6,50,000)
  saleStatus: text('sale_status').notNull().default('Prototype Built'), // 'Prototype Built' | 'Ready for Sale' | 'Sold' | 'In Production'
  customerName: text('customer_name'),
  saleDate: text('sale_date'),
  notes: text('notes'),
  createdDate: text('created_date').notNull(),
  targetLaunchDate: text('target_launch_date').notNull(),
  targetKvaBenchmark: integer('target_kva_benchmark').notNull().default(125), // for projected scaling
  updatedAt: timestamp('updated_at').defaultNow(),
});

// BOM Line Items Table
export const bomLineItems = pgTable('bom_line_items', {
  id: serial('id').primaryKey(),
  productId: text('product_id').notNull(),
  componentCategory: text('component_category').notNull(), // Major Components, Electrical & Wiring, Mechanical Parts & Fabrication, Labor/Vendor Payments, Enclosure, Miscellaneous
  itemName: text('item_name').notNull(),
  amount: text('amount').notNull(), // paise
  vendorOrPersonName: text('vendor_or_person_name').notNull(),
  paymentMode: text('payment_mode').notNull().default('Bank'), // Cash, GPay, Bank, Cheque
  date: text('date').notNull(), // YYYY-MM-DD
  isEmployeeAdvance: boolean('is_employee_advance').notNull().default(false),
  linkedEmployeeId: text('linked_employee_id'),
  isMiscategorized: boolean('is_miscategorized').notNull().default(false), // Auto-flagged if software/subscription
  miscategorizedReason: text('miscategorized_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Employee Advance Table (Separate Ledger from Salary)
export const employeeAdvances = pgTable('employee_advances', {
  id: serial('id').primaryKey(),
  advanceId: text('advance_id').notNull().unique(),
  employeeId: text('employee_id').notNull(),
  amount: text('amount').notNull(), // paise
  dateGiven: text('date_given').notNull(), // YYYY-MM-DD
  purpose: text('purpose').notNull(),
  linkedProductId: text('linked_product_id'), // if tied to a prototype
  paymentMode: text('payment_mode').notNull().default('GPay'), // Cash, GPay, Bank, Cheque
  status: text('status').notNull().default('Outstanding'), // Outstanding | Adjusted Against Bills Submitted | Reconciled as Vendor Cost | Recovered from Salary
  isRelatedParty: boolean('is_related_party').notNull().default(false), // Companies Act Section 188 auto-flag
  reconciledDate: text('reconciled_date'),
  reconciliationNotes: text('reconciliation_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Audit Log Table
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  entityType: text('entity_type').notNull(), // 'Salary Rate' | 'Bonus Rate' | 'Dividend Percent' | 'Section 197' | 'Advance'
  entityId: text('entity_id').notNull(),
  fieldChanged: text('field_changed').notNull(),
  oldValue: text('old_value').notNull(),
  newValue: text('new_value').notNull(),
  changedBy: text('changed_by').notNull(),
  changedAt: timestamp('changed_at').defaultNow(),
  notes: text('notes'),
});

// System Settings (Tax rates, TDS range, config)
export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Raw Material Inventory Table (Stock levels, reorder points, suppliers)
export const inventoryItems = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  currentStock: integer('current_stock').notNull().default(0),
  unit: text('unit').notNull().default('Pcs'),
  minStockLevel: integer('min_stock_level').notNull().default(5),
  reorderPoint: integer('reorder_point').notNull().default(10),
  unitCost: text('unit_cost').notNull().default('0'), // in paise
  supplierName: text('supplier_name').notNull(),
  supplierContactPerson: text('supplier_contact_person'),
  supplierPhone: text('supplier_phone'),
  supplierEmail: text('supplier_email'),
  supplierAddress: text('supplier_address'),
  leadTimeDays: integer('lead_time_days').notNull().default(7),
  lastRestockedDate: text('last_restocked_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

