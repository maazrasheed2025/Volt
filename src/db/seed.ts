// src/db/seed.ts
import { db } from './index.ts';
import {
  employees,
  production,
  bonusRates,
  insurancePolicies,
  expenses,
  factoryConstructionBudget,
  loans,
  shareholders,
  capitalEquipment,
  products,
  bomLineItems,
  employeeAdvances,
  expenseBudgets,
  systemSettings,
  auditLogs,
} from './schema.ts';
import { eq } from 'drizzle-orm';

export async function seedInitialDataIfEmpty() {
  try {
    const existingEmployees = await db.select().from(employees).limit(1);
    if (existingEmployees.length > 0) {
      console.log('Database already initialized with data.');
      return;
    }

    console.log('Seeding initial manufacturing company dataset...');

    // 1. Seed Shareholders (8 equity partners with 100% shareholding & profit share)
    await db.insert(shareholders).values([
      {
        name: 'Imran (Chairman & Managing Director)',
        shareholdingPercent: '75.00',
        dividendPercent: '40.00',
        panNumber: 'AAACI7540D',
        notes: 'CMD - 75% Shareholding (Absolute Control & Voting Power), 40% Profit Share',
      },
      {
        name: 'Pappu Bhai (Chief Operating Officer - COO)',
        shareholdingPercent: '5.00',
        dividendPercent: '10.00',
        panNumber: 'ABCPP5010B',
        notes: 'COO - 5% Shareholding (Senior Role Advantage), 10% Profit Share',
      },
      {
        name: 'Simran (Director-Operations)',
        shareholdingPercent: '5.00',
        dividendPercent: '10.00',
        panNumber: 'ACDPS5010S',
        notes: 'Director-Operations - 5% Shareholding (Senior Role Advantage), 10% Profit Share',
      },
      {
        name: 'Naushad Bhai (Plant Manager / Operations Head)',
        shareholdingPercent: '3.00',
        dividendPercent: '8.00',
        panNumber: 'ADENB3008N',
        notes: 'Plant Manager - 3% Shareholding (Core Team Member), 8% Profit Share',
      },
      {
        name: 'Wahid (Head of Operations)',
        shareholdingPercent: '3.00',
        dividendPercent: '8.00',
        panNumber: 'AEFW3008W',
        notes: 'Head of Operations - 3% Shareholding (Core Team Member), 8% Profit Share',
      },
      {
        name: 'Kumail (Business Development Head)',
        shareholdingPercent: '3.00',
        dividendPercent: '8.00',
        panNumber: 'AFGK3008K',
        notes: 'BD Head - 3% Shareholding (Core Team Member), 8% Profit Share',
      },
      {
        name: 'Ramendra IIT (Chief Engineer)',
        shareholdingPercent: '3.00',
        dividendPercent: '8.00',
        panNumber: 'AGHR3008R',
        notes: 'Chief Engineer - 3% Shareholding (Core Team Member), 8% Profit Share',
      },
      {
        name: 'Vijay IIT (Chief Engineer)',
        shareholdingPercent: '3.00',
        dividendPercent: '8.00',
        panNumber: 'AHIV3008V',
        notes: 'Chief Engineer - 3% Shareholding (Core Team Member), 8% Profit Share',
      },
    ]);

    // 2. Bonus Rates per unit (Paise) - versioned for 2026
    await db.insert(bonusRates).values([
      { category: 'Director', bonusPerUnit: '1500', effectiveYear: 2026, versionNotes: '₹15.00/unit produced' },
      { category: 'Senior Manager', bonusPerUnit: '1000', effectiveYear: 2026, versionNotes: '₹10.00/unit produced' },
      { category: 'Engineer', bonusPerUnit: '800', effectiveYear: 2026, versionNotes: '₹8.00/unit produced' },
      { category: 'Machine Operator', bonusPerUnit: '500', effectiveYear: 2026, versionNotes: '₹5.00/unit produced' },
      { category: 'Service Staff', bonusPerUnit: '300', effectiveYear: 2026, versionNotes: '₹3.00/unit produced' },
      { category: 'Computer Staff', bonusPerUnit: '400', effectiveYear: 2026, versionNotes: '₹4.00/unit produced' },
      { category: 'Heavy Labor', bonusPerUnit: '350', effectiveYear: 2026, versionNotes: '₹3.50/unit produced' },
      { category: 'Security', bonusPerUnit: '250', effectiveYear: 2026, versionNotes: '₹2.50/unit produced' },
      { category: 'Cook', bonusPerUnit: '200', effectiveYear: 2026, versionNotes: '₹2.00/unit produced' },
    ]);

    // 3. Insurance Policies (Paise per person per year)
    await db.insert(insurancePolicies).values([
      { category: 'Director', premiumPerPersonPerYear: '3500000', coverageType: 'Executive Comprehensive Health + Term ₹25L' }, // ₹35,000
      { category: 'Senior Manager', premiumPerPersonPerYear: '2200000', coverageType: 'Group Health Floater ₹15L' }, // ₹22,000
      { category: 'Engineer', premiumPerPersonPerYear: '1800000', coverageType: 'Group Health + Personal Accidental ₹10L' }, // ₹18,000
      { category: 'Machine Operator', premiumPerPersonPerYear: '1200000', coverageType: 'ESIC / Workmen Comp + Accidental ₹5L' }, // ₹12,000
      { category: 'Service Staff', premiumPerPersonPerYear: '900000', coverageType: 'Group Mediclaim ₹3L' }, // ₹9,000
      { category: 'Computer Staff', premiumPerPersonPerYear: '1400000', coverageType: 'Group Health ₹5L' }, // ₹14,000
      { category: 'Heavy Labor', premiumPerPersonPerYear: '1100000', coverageType: 'High-Hazard Workmen Compensation ₹5L' }, // ₹11,000
      { category: 'Security', premiumPerPersonPerYear: '800000', coverageType: 'Group Mediclaim + Term ₹2L' }, // ₹8,000
      { category: 'Cook', premiumPerPersonPerYear: '750000', coverageType: 'Group Mediclaim ₹2L' }, // ₹7,500
    ]);

    // 4. Employees Master Roster (24 actual team members with real roles, salaries, and profit shares)
    await db.insert(employees).values([
      // 👑 Core Team (Decision Makers & Leaders)
      {
        employeeId: 'EMP-001',
        name: 'Imran',
        post: 'Chairman & Managing Director',
        category: 'Core Team',
        monthlySalary: '4000000', // ₹40,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: true,
        shareholdingPercent: '75.00',
        dividendPercent: '40.00',
        phase: 1,
        joinDate: '2023-01-01',
        status: 'active',
      },
      {
        employeeId: 'EMP-002',
        name: 'Pappu Bhai',
        post: 'Chief Operating Officer (COO)',
        category: 'Core Team',
        monthlySalary: '3500000', // ₹35,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: true,
        shareholdingPercent: '5.00',
        dividendPercent: '10.00',
        phase: 1,
        joinDate: '2023-01-15',
        status: 'active',
      },
      {
        employeeId: 'EMP-003',
        name: 'Simran',
        post: 'Director-Operations',
        category: 'Core Team',
        monthlySalary: '3500000', // ₹35,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: true,
        shareholdingPercent: '5.00',
        dividendPercent: '10.00',
        phase: 1,
        joinDate: '2023-02-01',
        status: 'active',
      },
      {
        employeeId: 'EMP-004',
        name: 'Supriya',
        post: 'Core Team Member (Joining Later)',
        category: 'Core Team',
        monthlySalary: '0', // TBD / Decided Later
        isBonusEligible: false,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 2,
        joinDate: '2026-06-01',
        status: 'active',
      },

      // ⚙️ Department Heads (Core Operations)
      {
        employeeId: 'EMP-005',
        name: 'Naushad Bhai',
        post: 'Plant Manager / Operations Head',
        category: 'Department Head',
        monthlySalary: '3000000', // ₹30,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: true,
        shareholdingPercent: '3.00',
        dividendPercent: '8.00',
        phase: 1,
        joinDate: '2023-03-01',
        status: 'active',
      },
      {
        employeeId: 'EMP-006',
        name: 'Wahid',
        post: 'Head of Operations',
        category: 'Department Head',
        monthlySalary: '3000000', // ₹30,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: true,
        shareholdingPercent: '3.00',
        dividendPercent: '8.00',
        phase: 1,
        joinDate: '2023-03-01',
        status: 'active',
      },
      {
        employeeId: 'EMP-007',
        name: 'Kumail',
        post: 'Business Development Head',
        category: 'Department Head',
        monthlySalary: '3000000', // ₹30,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: true,
        shareholdingPercent: '3.00',
        dividendPercent: '8.00',
        phase: 1,
        joinDate: '2023-03-15',
        status: 'active',
      },
      {
        employeeId: 'EMP-008',
        name: 'Ramendra IIT',
        post: 'Chief Engineer',
        category: 'Department Head',
        monthlySalary: '3000000', // ₹30,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: true,
        shareholdingPercent: '3.00',
        dividendPercent: '8.00',
        phase: 1,
        joinDate: '2023-04-01',
        status: 'active',
      },
      {
        employeeId: 'EMP-009',
        name: 'Vijay IIT',
        post: 'Chief Engineer',
        category: 'Department Head',
        monthlySalary: '3000000', // ₹30,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: true,
        shareholdingPercent: '3.00',
        dividendPercent: '8.00',
        phase: 1,
        joinDate: '2023-04-01',
        status: 'active',
      },
      {
        employeeId: 'EMP-010',
        name: 'Anurag',
        post: 'Lead CAD Designer / Chief Design Engineer (Technical Head)',
        category: 'Department Head',
        monthlySalary: '2500000', // ₹25,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 1,
        joinDate: '2023-05-01',
        status: 'active',
      },

      // 🤝 Management & Support Team (Day-to-Day Execution)
      {
        employeeId: 'EMP-011',
        name: 'Mahtab Bhai',
        post: 'Senior Accounts Executive (Critical finance handling)',
        category: 'Management & Support',
        monthlySalary: '2300000', // ₹23,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 1,
        joinDate: '2023-06-01',
        status: 'active',
      },
      {
        employeeId: 'EMP-012',
        name: 'Jameel',
        post: 'Operations Team Lead (Day-to-day team manage)',
        category: 'Management & Support',
        monthlySalary: '2200000', // ₹22,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 1,
        joinDate: '2023-06-15',
        status: 'active',
      },
      {
        employeeId: 'EMP-013',
        name: 'Neel',
        post: 'Executive Assistant / Corp. Communications (Good English, direct support)',
        category: 'Management & Support',
        monthlySalary: '2200000', // ₹22,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 1,
        joinDate: '2023-07-01',
        status: 'active',
      },
      {
        employeeId: 'EMP-014',
        name: 'Akash Bhai',
        post: 'Senior Marketing Executive (Piramal background)',
        category: 'Management & Support',
        monthlySalary: '2000000', // ₹20,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 1,
        joinDate: '2023-07-15',
        status: 'active',
      },
      {
        employeeId: 'EMP-015',
        name: 'Maya',
        post: 'HR & Admin Executive (Staff & Office admin)',
        category: 'Management & Support',
        monthlySalary: '2000000', // ₹20,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 1,
        joinDate: '2023-08-01',
        status: 'active',
      },
      {
        employeeId: 'EMP-016',
        name: 'Kumail ka Dost',
        post: 'Strategic Partnerships Manager (Network use)',
        category: 'Management & Support',
        monthlySalary: '2000000', // ₹20,000 / month (+ Incentives)
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 1,
        joinDate: '2023-08-15',
        status: 'active',
      },

      // 🚀 Field, Logistics & Expansion Team (Ground Level)
      {
        employeeId: 'EMP-017',
        name: 'Vikas',
        post: 'Marketing & Client Relations Exec (Yes Bank background)',
        category: 'Field & Logistics',
        monthlySalary: '1800000', // ₹18,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 1,
        joinDate: '2023-09-01',
        status: 'active',
      },
      {
        employeeId: 'EMP-018',
        name: 'Anwer Lateef',
        post: 'Logistics & Dispatch Coordinator',
        category: 'Field & Logistics',
        monthlySalary: '1800000', // ₹18,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 1,
        joinDate: '2023-09-15',
        status: 'active',
      },
      {
        employeeId: 'EMP-019',
        name: 'Aqil (Arif ka Bhai)',
        post: 'MIS & IT Support Executive (Computer/IT support)',
        category: 'Field & Logistics',
        monthlySalary: '1800000', // ₹18,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 1,
        joinDate: '2023-10-01',
        status: 'active',
      },
      {
        employeeId: 'EMP-020',
        name: 'Faiz',
        post: 'Field Operations Coordinator (Ground work manage)',
        category: 'Field & Logistics',
        monthlySalary: '1800000', // ₹18,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 1,
        joinDate: '2023-10-15',
        status: 'active',
      },
      {
        employeeId: 'EMP-021',
        name: 'Chota Bilal',
        post: 'Junior Operations Executive (Expansion training)',
        category: 'Field & Logistics',
        monthlySalary: '1500000', // ₹15,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 1,
        joinDate: '2023-11-01',
        status: 'active',
      },
      {
        employeeId: 'EMP-022',
        name: 'Shekhu',
        post: 'Junior Site Coordinator – Hiraman Purwa (Light post)',
        category: 'Field & Logistics',
        monthlySalary: '1500000', // ₹15,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 1,
        joinDate: '2023-11-15',
        status: 'active',
      },
      {
        employeeId: 'EMP-023',
        name: 'Ikhlaq',
        post: 'Junior Field Assistant – Chamanganj (Light post)',
        category: 'Field & Logistics',
        monthlySalary: '1500000', // ₹15,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 1,
        joinDate: '2023-12-01',
        status: 'active',
      },
      {
        employeeId: 'EMP-024',
        name: 'Sammy',
        post: 'Management Trainee / Office Intern (Internship)',
        category: 'Field & Logistics',
        monthlySalary: '1500000', // ₹15,000 / month
        isBonusEligible: true,
        isInsuranceEligible: true,
        isShareholder: false,
        shareholdingPercent: '0.00',
        dividendPercent: '0.00',
        phase: 1,
        joinDate: '2024-01-01',
        status: 'active',
      },
    ]);

    // 5. Production Records (Monthly 2026)
    // units_produced, revenue_per_unit (₹3,80,000 = 38000000 paise), cost_of_goods (₹2,60,000 = 26000000 paise)
    await db.insert(production).values([
      { month: 1, year: 2026, unitsProduced: 12, revenuePerUnit: '38000000', costOfGoodsPerUnit: '25500000' },
      { month: 2, year: 2026, unitsProduced: 15, revenuePerUnit: '38000000', costOfGoodsPerUnit: '25200000' },
      { month: 3, year: 2026, unitsProduced: 18, revenuePerUnit: '38500000', costOfGoodsPerUnit: '25000000' },
      { month: 4, year: 2026, unitsProduced: 22, revenuePerUnit: '38500000', costOfGoodsPerUnit: '24800000' },
      { month: 5, year: 2026, unitsProduced: 25, revenuePerUnit: '39000000', costOfGoodsPerUnit: '24600000' },
      { month: 6, year: 2026, unitsProduced: 28, revenuePerUnit: '39000000', costOfGoodsPerUnit: '24500000' },
    ]);

    // 6. Factory Construction Budget (Paise)
    await db.insert(factoryConstructionBudget).values([
      {
        component: 'Land Acquisition & Registration',
        budgetedAmount: '2500000000', // ₹2.50 Cr
        actualSpent: '2520000000', // ₹2.52 Cr
        phaseOfConstruction: 'Phase 1 Site Prep',
        percentPhysicalComplete: 100,
        startDate: '2024-01-15',
        targetCompletionDate: '2024-06-30',
      },
      {
        component: 'Civil Construction & Pre-Engineered Building Shed',
        budgetedAmount: '3500000000', // ₹3.50 Cr
        actualSpent: '2800000000', // ₹2.80 Cr
        phaseOfConstruction: 'Phase 2 Heavy Foundation',
        percentPhysicalComplete: 80,
        startDate: '2024-07-01',
        targetCompletionDate: '2026-11-30',
      },
      {
        component: 'Utilities, HT Power Line & Substation Transformers',
        budgetedAmount: '1200000000', // ₹1.20 Cr
        actualSpent: '950000000', // ₹0.95 Cr
        phaseOfConstruction: 'Utilities Integration',
        percentPhysicalComplete: 75,
        startDate: '2025-01-10',
        targetCompletionDate: '2026-12-15',
      },
      {
        component: 'Machinery Installation, Cranes & Automated Test Bench',
        budgetedAmount: '1800000000', // ₹1.80 Cr
        actualSpent: '920000000', // ₹0.92 Cr
        phaseOfConstruction: 'Final Commissioning',
        percentPhysicalComplete: 50,
        startDate: '2025-06-01',
        targetCompletionDate: '2027-02-28',
      },
      {
        component: 'Statutory Compliance, Factory Licensing & Fire NOC',
        budgetedAmount: '450000000', // ₹45 Lakhs
        actualSpent: '380000000', // ₹38 Lakhs
        phaseOfConstruction: 'Regulatory Approval',
        percentPhysicalComplete: 85,
        startDate: '2025-03-01',
        targetCompletionDate: '2026-12-31',
      },
    ]);

    // 7. Loans & Financing
    await db.insert(loans).values([
      {
        loanId: 'LN-SBI-2024-01',
        lender: 'State Bank of India (Industrial Finance Branch)',
        principalAmount: '5000000000', // ₹5.00 Cr
        interestRate: '9.25',
        tenureMonths: 84, // 7 years
        disbursementDate: '2024-02-01',
        emiAmount: '8118000', // ₹81,180 in paise = 8118000
        outstandingBalance: '3820000000', // ₹3.82 Cr
        principalRepaid: '1180000000',
        interestPaidToDate: '725000000',
        purpose: 'Factory Construction & Heavy Shed Infra',
      },
      {
        loanId: 'LN-HDFC-2025-02',
        lender: 'HDFC Bank Equipment Finance',
        principalAmount: '1500000000', // ₹1.50 Cr
        interestRate: '9.80',
        tenureMonths: 60,
        disbursementDate: '2025-03-15',
        emiAmount: '3172000', // ₹31,720
        outstandingBalance: '1240000000',
        principalRepaid: '260000000',
        interestPaidToDate: '155000000',
        purpose: 'CNC Laser & Hydraulic Press Machinery',
      },
    ]);

    // 8. Capital Equipment Assets
    await db.insert(capitalEquipment).values([
      {
        assetTag: 'EQP-GEN-01',
        assetName: 'Cummins Silent 125kVA Backup Generator Set',
        category: 'generator sets',
        purchaseDate: '2024-03-10',
        purchaseCost: '145000000', // ₹14.50 Lakhs
        salvageValue: '15000000', // ₹1.5 Lakh
        usefulLifeYears: 10,
        annualRunningMaintenanceCost: '6500000', // ₹65k/yr
      },
      {
        assetTag: 'EQP-CNC-02',
        assetName: 'Bystronic 4kW Fiber Laser Cutting Bed',
        category: 'machinery',
        purchaseDate: '2024-08-20',
        purchaseCost: '680000000', // ₹68 Lakhs
        salvageValue: '60000000',
        usefulLifeYears: 12,
        annualRunningMaintenanceCost: '18000000',
      },
      {
        assetTag: 'EQP-VCL-03',
        assetName: 'Tata Ultra T.7 Heavy Delivery Truck',
        category: 'vehicles',
        purchaseDate: '2024-11-05',
        purchaseCost: '185000000', // ₹18.50 Lakhs
        salvageValue: '25000000',
        usefulLifeYears: 8,
        annualRunningMaintenanceCost: '12000000',
      },
    ]);

    // 9. Products / Prototypes (Generator Sets by Serial Number)
    await db.insert(products).values([
      {
        productId: 'PRD-GEN-30KVA',
        serialNumber: 'GEN-30KVA-PROTO-01',
        productName: '30kVA Industrial Acoustic Generator Set Prototype',
        productLine: 'Generator Set',
        powerRatingKva: 30,
        status: 'Prototype',
        sellingPrice: '185000000', // ₹18,50,000 (Cost reaching ~₹16 Lakhs, healthy profit margin)
        saleStatus: 'Prototype Built',
        createdDate: '2026-01-10',
        targetLaunchDate: '2026-11-15',
        targetKvaBenchmark: 125,
      },
      {
        productId: 'PRD-GEN-82.5KVA',
        serialNumber: 'GEN-82.5KVA-SN001',
        productName: '82.5kVA Heavy Standby Genset Series II',
        productLine: 'Generator Set',
        powerRatingKva: 83,
        status: 'In Development',
        sellingPrice: '250000000', // ₹25,00,000
        saleStatus: 'In Development',
        createdDate: '2026-03-01',
        targetLaunchDate: '2027-04-30',
        targetKvaBenchmark: 250,
      },
    ]);

    // 10. BOM Line Items for 30kVA Generator Set (64 Actual Parts & Prototype Expenses Categorized)
    await db.insert(bomLineItems).values([
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Hardware & Fasteners', itemName: 'Nut Bolt', amount: '140000', vendorOrPersonName: 'Local Hardware Market', paymentMode: 'Cash', date: '2026-02-10', notes: 'Assembly hardware for prototype frame' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Hardware & Fasteners', itemName: 'Nut Bolt Plate Wale', amount: '310000', vendorOrPersonName: 'Local Hardware Market', paymentMode: 'Cash', date: '2026-02-12', notes: 'Special plate fasteners' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Hardware & Fasteners', itemName: 'Nut Bolts', amount: '700000', vendorOrPersonName: 'Local Hardware Market', paymentMode: 'Cash', date: '2026-02-15', notes: 'Heavy-duty high-tensile bolts' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Mechanical & Transmission', itemName: 'Pully', amount: '1000000', vendorOrPersonName: 'Lathe & Pulley Works', paymentMode: 'Cash', date: '2026-02-18', notes: 'Machined transmission pulley' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Mechanical & Transmission', itemName: 'Pully', amount: '1340000', vendorOrPersonName: 'Lathe & Pulley Works', paymentMode: 'Bank', date: '2026-02-20', notes: 'Dual-groove precision pulley' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Mechanical & Transmission', itemName: 'Pully (Dhanteras)', amount: '1000000', vendorOrPersonName: 'Lathe & Pulley Works', paymentMode: 'Cash', date: '2025-10-29', notes: 'Festive batch transmission pulley' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Fabrication & Machining', itemName: 'Sardar Ji', amount: '1500000', vendorOrPersonName: 'Sardar Ji Workshop', paymentMode: 'Cash', date: '2026-02-25', notes: 'Chassis fabrication & precision lathe turning' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Fabrication & Machining', itemName: 'Sardar Ji GPay', amount: '800000', vendorOrPersonName: 'Sardar Ji Workshop', paymentMode: 'GPay', date: '2026-03-01', notes: 'Shaft turning and bearing seat fitting' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Fabrication & Machining', itemName: 'Sardar Ji Diwali', amount: '1000000', vendorOrPersonName: 'Sardar Ji Workshop', paymentMode: 'Cash', date: '2025-11-01', notes: 'Festival fabrication work on generator frame' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Fabrication & Machining', itemName: 'Sardar Ji', amount: '3500000', vendorOrPersonName: 'Sardar Ji Workshop', paymentMode: 'Bank', date: '2026-03-05', notes: 'Heavy base frame welding & alignment setup' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Structure & Base Fabrication', itemName: 'Square Block', amount: '600000', vendorOrPersonName: 'Metal Casting Mart', paymentMode: 'Cash', date: '2026-03-08', notes: 'Cast iron mounting square block' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Structure & Base Fabrication', itemName: 'Square Block', amount: '1400000', vendorOrPersonName: 'Metal Casting Mart', paymentMode: 'Bank', date: '2026-03-10', notes: 'Heavy vibration dampening square block' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Structure & Base Fabrication', itemName: 'Square Block', amount: '420000', vendorOrPersonName: 'Metal Casting Mart', paymentMode: 'Cash', date: '2026-03-12', notes: 'Secondary mounting block' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Structure & Base Fabrication', itemName: 'Block Sheet', amount: '350000', vendorOrPersonName: 'Steel Sheet Mart', paymentMode: 'Cash', date: '2026-03-14', notes: 'High strength steel block sheet' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Mechanical & Transmission', itemName: '3 Palle Wali Bearing', amount: '10000', vendorOrPersonName: 'Bearing House', paymentMode: 'Cash', date: '2026-03-15', notes: 'Three-lip sealed bearing' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Mechanical & Transmission', itemName: '3 Palle Wali Bearing', amount: '20000', vendorOrPersonName: 'Bearing House', paymentMode: 'Cash', date: '2026-03-15', notes: 'High-speed bearing unit' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Mechanical & Transmission', itemName: 'One Way', amount: '115000', vendorOrPersonName: 'Transmission Spares', paymentMode: 'Cash', date: '2026-03-16', notes: 'One-way sprag clutch unit' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Mechanical & Transmission', itemName: 'One Way gear', amount: '440000', vendorOrPersonName: 'Gear Works', paymentMode: 'Cash', date: '2026-03-18', notes: 'One-way drive transmission gear' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Engineering & Design', itemName: 'Anurag (CAD Design)', amount: '600000', vendorOrPersonName: 'Anurag (Technical Head)', paymentMode: 'GPay', date: '2026-03-20', isEmployeeAdvance: true, linkedEmployeeId: 'EMP-010', notes: 'CAD modeling & structural blueprint fee' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Structure & Base Fabrication', itemName: 'steel Sheet', amount: '800000', vendorOrPersonName: 'Sheet Metal Dealer', paymentMode: 'Bank', date: '2026-03-22', notes: 'Heavy gauge cold rolled steel sheet' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Structure & Base Fabrication', itemName: 'Shaft Sheet', amount: '3100000', vendorOrPersonName: 'Heavy Steel Mart', paymentMode: 'Bank', date: '2026-03-25', notes: 'Solid alloy steel shaft stock & plate' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Structure & Base Fabrication', itemName: 'Angle', amount: '700000', vendorOrPersonName: 'Steel Iron Mart', paymentMode: 'Cash', date: '2026-03-28', notes: 'Structural steel angle framing' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Core Power & Electricals', itemName: 'Alternator', amount: '9000000', vendorOrPersonName: 'Power Equipment Supplier', paymentMode: 'Bank', date: '2026-04-01', notes: 'Brushless industrial alternator core' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Core Power & Electricals', itemName: 'Motor ac Crompton', amount: '5200000', vendorOrPersonName: 'Crompton Industrial Dealer', paymentMode: 'Bank', date: '2026-04-03', notes: 'Crompton AC industrial drive motor' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Battery & Energy Storage', itemName: 'Battery Exide', amount: '3500000', vendorOrPersonName: 'Exide Battery Agency', paymentMode: 'Bank', date: '2026-04-05', notes: 'Exide heavy-duty industrial starting battery' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Core Power & Electricals', itemName: 'AC', amount: '3000000', vendorOrPersonName: 'Electricals Wholesale', paymentMode: 'Bank', date: '2026-04-08', notes: 'AC power conversion equipment' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Engineering & R&D Advance', itemName: 'Ramendra iit advance', amount: '3000000', vendorOrPersonName: 'Ramendra IIT (Chief Engineer)', paymentMode: 'Bank', date: '2026-04-10', isEmployeeAdvance: true, linkedEmployeeId: 'EMP-008', notes: 'R&D advance for prototype engine integration' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Engineering & R&D Advance', itemName: 'Ramendra iit advance', amount: '300000', vendorOrPersonName: 'Ramendra IIT (Chief Engineer)', paymentMode: 'GPay', date: '2026-04-12', isEmployeeAdvance: true, linkedEmployeeId: 'EMP-008', notes: 'Instrumentation sensor purchase advance' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Core Power & Electricals', itemName: 'Battery Rickshaw motor', amount: '1827000', vendorOrPersonName: 'E-Vehicle Motor Spares', paymentMode: 'GPay', date: '2026-04-14', notes: 'High-torque BLDC test motor' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Structure & Base Fabrication', itemName: 'Channel', amount: '1800000', vendorOrPersonName: 'Structural Iron & Steel', paymentMode: 'Bank', date: '2026-04-15', notes: 'ISMC heavy chassis foundation channel' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Mechanical & Transmission', itemName: 'Flywheel', amount: '1600000', vendorOrPersonName: 'Flywheel Casting Works', paymentMode: 'Bank', date: '2026-04-18', notes: 'Balanced dynamic inertia flywheel' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Mechanical & Transmission', itemName: 'Bearing', amount: '1600000', vendorOrPersonName: 'Heavy Industrial Bearings', paymentMode: 'Bank', date: '2026-04-20', notes: 'Spherical roller main shaft bearing' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Fabrication & Machining', itemName: 'Ghisai', amount: '400000', vendorOrPersonName: 'Surface Finishing Works', paymentMode: 'Cash', date: '2026-04-21', notes: 'Surface grinding, deburring & bed leveling' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Structure & Base Fabrication', itemName: 'castor Wheel', amount: '400000', vendorOrPersonName: 'Hardware Wheels Mart', paymentMode: 'Cash', date: '2026-04-22', notes: 'Heavy duty lockable polyurethane castor wheels' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Structure & Base Fabrication', itemName: 'Sheet for Motor base', amount: '160000', vendorOrPersonName: 'Sheet Metal Dealer', paymentMode: 'Cash', date: '2026-04-23', notes: 'Vibration isolation motor base mounting plate' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Fabrication & Machining', itemName: 'pully bore', amount: '1250000', vendorOrPersonName: 'Precision Boring Works', paymentMode: 'Bank', date: '2026-04-24', notes: 'Keyway broaching & high-precision pulley bore' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Fabrication & Machining', itemName: 'Shaft Boring', amount: '1000000', vendorOrPersonName: 'Precision Boring Works', paymentMode: 'Bank', date: '2026-04-25', notes: 'Drive shaft center boring and concentric balancing' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Electrical, Instrumentation & Panels', itemName: 'Electrical System', amount: '30000000', vendorOrPersonName: 'Industrial Electrical Systems', paymentMode: 'Bank', date: '2026-04-26', notes: 'Master electrical control console, breaker & logic system' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Acoustic Canopy & Enclosure', itemName: 'Canopy', amount: '20000000', vendorOrPersonName: 'Acoustic Canopy Fabricators', paymentMode: 'Bank', date: '2026-04-28', notes: 'Heavy acoustic soundproof powder-coated generator canopy' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Electrical, Instrumentation & Panels', itemName: 'Wiring Socket', amount: '20000000', vendorOrPersonName: 'Industrial Control Panels', paymentMode: 'Bank', date: '2026-04-29', notes: 'Three-phase industrial distribution socket assembly & loom' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Electrical, Instrumentation & Panels', itemName: 'wire aur fan ac box', amount: '370000', vendorOrPersonName: 'Electricals Wholesale', paymentMode: 'Cash', date: '2026-04-30', notes: 'Ventilation fan & panel box heat extraction wiring' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Structure & Base Fabrication', itemName: 'channel 3 inch Sunday', amount: '230000', vendorOrPersonName: 'Steel Iron Mart', paymentMode: 'Cash', date: '2026-05-03', notes: '3-inch cross brace support steel channel' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Electrical, Instrumentation & Panels', itemName: 'Ac box altinator wire', amount: '100000', vendorOrPersonName: 'Electrical Spares', paymentMode: 'Cash', date: '2026-05-04', notes: 'High temperature copper alternator interconnect wire' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Structure & Base Fabrication', itemName: 'Angle Channel futkar', amount: '100000', vendorOrPersonName: 'Local Iron Vendor', paymentMode: 'Cash', date: '2026-05-05', notes: 'Retail structural angle and brace pieces' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Battery & Energy Storage', itemName: 'Ankul Battery Car', amount: '600000', vendorOrPersonName: 'Battery Spares', paymentMode: 'Cash', date: '2026-05-06', notes: 'Auxiliary battery bank testing unit' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Engineering & R&D Advance', itemName: 'Ramendra 1 May 26', amount: '5000000', vendorOrPersonName: 'Ramendra IIT (Chief Engineer)', paymentMode: 'Bank', date: '2026-05-01', isEmployeeAdvance: true, linkedEmployeeId: 'EMP-008', notes: 'Technical development & high-load tuning fee' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Engineering & R&D Advance', itemName: 'Ramendra 1 May 26', amount: '10000000', vendorOrPersonName: 'Ramendra IIT (Chief Engineer)', paymentMode: 'Bank', date: '2026-05-01', isEmployeeAdvance: true, linkedEmployeeId: 'EMP-008', notes: 'Patented magnetic coupling prototype milestone disbursement' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Mechanical & Transmission', itemName: 'belt', amount: '870000', vendorOrPersonName: 'Industrial Belts Agency', paymentMode: 'Cash', date: '2026-05-07', notes: 'Heavy-torque synchronous transmission belt set' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Fabrication & Machining', itemName: 'motor banwai', amount: '140000', vendorOrPersonName: 'Motor Rewinding Workshop', paymentMode: 'Cash', date: '2026-05-08', notes: 'Motor shaft machining & custom bracket customization' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Electrical, Instrumentation & Panels', itemName: 'ac box wire mcb altinator', amount: '175000', vendorOrPersonName: 'Electrical Spares', paymentMode: 'Cash', date: '2026-05-09', notes: 'MCB circuit protection switches & buswire' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Mechanical & Transmission', itemName: 'wahid disk break advance', amount: '400000', vendorOrPersonName: 'Wahid (Head of Operations)', paymentMode: 'GPay', date: '2026-05-10', isEmployeeAdvance: true, linkedEmployeeId: 'EMP-006', notes: 'Advance for disc braking rotor procurement' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Electrical, Instrumentation & Panels', itemName: 'rpm meter, voltage meter, sab', amount: '480000', vendorOrPersonName: 'Instrumentation Meters Mart', paymentMode: 'Cash', date: '2026-05-11', notes: 'Digital RPM tachometer, digital voltmeter & complete gauge set' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Mechanical & Transmission', itemName: 'Belt replacement', amount: '150000', vendorOrPersonName: 'Industrial Belts Agency', paymentMode: 'Cash', date: '2026-05-12', notes: 'High friction heat resistant replacement belt' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Fabrication & Machining', itemName: 'sardar ji 18 may', amount: '1500000', vendorOrPersonName: 'Sardar Ji Workshop', paymentMode: 'GPay', date: '2026-05-18', notes: 'Final lathe adjustment and alignment balance checking' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Hardware & Fasteners', itemName: 'Duct Tape', amount: '20000', vendorOrPersonName: 'Local Hardware Mart', paymentMode: 'Cash', date: '2026-05-19', notes: 'Insulation & workshop bundling tape' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Mechanical & Transmission', itemName: 'belt replacement', amount: '225000', vendorOrPersonName: 'Industrial Belts Agency', paymentMode: 'Cash', date: '2026-05-20', notes: 'Extended durability V-ribbed belt' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Battery & Energy Storage', itemName: 'battery terminal cable', amount: '56000', vendorOrPersonName: 'Battery Spares', paymentMode: 'Cash', date: '2026-05-21', notes: 'Heavy copper battery post lugs & cabling' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Mechanical & Transmission', itemName: 'badi pully 3', amount: '700000', vendorOrPersonName: 'Lathe & Pulley Works', paymentMode: 'Cash', date: '2026-05-22', notes: 'Triple-sheave heavy drive pulley' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Core Power & Electricals', itemName: 'motor dc nai nanya', amount: '5300000', vendorOrPersonName: 'Industrial DC Motor Mart', paymentMode: 'Bank', date: '2026-05-23', notes: 'Brand new DC traction motor unit' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Structure & Base Fabrication', itemName: 'dc motor k liye channel', amount: '160000', vendorOrPersonName: 'Steel Iron Mart', paymentMode: 'Cash', date: '2026-05-24', notes: 'Mounting steel channel custom cut for DC motor' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Battery & Energy Storage', itemName: 'battery advance', amount: '200000', vendorOrPersonName: 'Battery Agency', paymentMode: 'GPay', date: '2026-05-25', notes: 'Booking advance for auxiliary battery modules' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Battery & Energy Storage', itemName: 'battery advance', amount: '800000', vendorOrPersonName: 'Battery Agency', paymentMode: 'Bank', date: '2026-05-26', notes: 'Secondary battery bank reservation payment' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Software & Subscriptions', itemName: 'gemini subscription', amount: '200000', vendorOrPersonName: 'Google / Gemini API', paymentMode: 'Bank', date: '2026-05-27', isMiscategorized: true, miscategorizedReason: 'Software subscription (R&D Tool)', notes: 'AI R&D tool for generator control programming' },
      { productId: 'PRD-GEN-30KVA', componentCategory: 'Battery & Energy Storage', itemName: 'battery', amount: '3200000', vendorOrPersonName: 'Battery Wholesale Agency', paymentMode: 'Bank', date: '2026-05-28', notes: 'Final battery bank delivery payment' },
    ]);

    // 11. Employee Advances (Separate Ledger)
    await db.insert(employeeAdvances).values([
      {
        advanceId: 'ADV-2026-001',
        employeeId: 'EMP-004', // Pooja Kulkarni (Engineer)
        amount: '5000000', // ₹50,000
        dateGiven: '2026-02-01',
        purpose: 'Urgent emergency components and instrumentation wiring for 30kVA test bed',
        linkedProductId: 'PRD-GEN-30KVA',
        paymentMode: 'GPay',
        status: 'Adjusted Against Bills Submitted',
        isRelatedParty: false,
        reconciledDate: '2026-02-15',
        reconciliationNotes: 'Bill for ₹38,000 submitted (DSE controller), balance ₹12,000 refunded via UPI',
      },
      {
        advanceId: 'ADV-2026-002',
        employeeId: 'EMP-002', // Vikram Mehta (Director & Shareholder - RELATED PARTY FLAG)
        amount: '12000000', // ₹1,20,000
        dateGiven: '2026-02-18',
        purpose: 'Specialized alternator rotor balance tooling procured directly from precision lab',
        linkedProductId: 'PRD-GEN-30KVA',
        paymentMode: 'Bank',
        status: 'Outstanding',
        isRelatedParty: true, // Section 188 Companies Act disclosure flag!
        reconciliationNotes: 'Awaiting formal GST tax invoice from German tooling distributor',
      },
      {
        advanceId: 'ADV-2026-003',
        employeeId: 'EMP-005', // Rohan Deshmukh (Engineer)
        amount: '2500000', // ₹25,000
        dateGiven: '2026-03-05',
        purpose: 'Local purchase of pneumatic fittings and high-torque bolts for canopy assembly',
        linkedProductId: 'PRD-GEN-30KVA',
        paymentMode: 'Cash',
        status: 'Outstanding',
        isRelatedParty: false,
        reconciliationNotes: 'Parts received; pending invoice submission at finance desk',
      },
    ]);

    // 12. Sample Expenses across categories (with approval routing thresholds)
    // <₹10,000 auto, ₹10k-50k Dept Head + Finance, ₹50k-200k Director, >₹200k Board/Owner
    await db.insert(expenses).values([
      {
        expenseId: 'EXP-2026-001',
        category: 'Manufacturing & Production',
        subCategory: 'electricity',
        amount: '18500000', // ₹1,85,000
        date: '2026-02-05',
        phase: 1,
        vendorName: 'MSEDCL (State Electricity Distribution)',
        billReferenceNumber: 'MS-FEB-98124',
        gstAmount: '3330000', // ₹33,300 (18%)
        paymentStatus: 'paid',
        approvedBy: 'Rajesh Sharma (Director)',
        approvalStatus: 'Approved',
        approvalRequiredLevel: 'Director',
      },
      {
        expenseId: 'EXP-2026-002',
        category: 'Manufacturing & Production',
        subCategory: 'tools',
        amount: '3500000', // ₹35,000
        date: '2026-02-12',
        phase: 1,
        vendorName: 'Bostik Industrial Fasteners',
        billReferenceNumber: 'INV-44120',
        gstAmount: '630000',
        paymentStatus: 'paid',
        approvedBy: 'Amitabh Sen (Senior Manager) & CA Desk',
        approvalStatus: 'Approved',
        approvalRequiredLevel: 'Dept Head + Finance',
      },
      {
        expenseId: 'EXP-2026-003',
        category: 'Administrative & Office',
        subCategory: 'supplies',
        amount: '680000', // ₹6,800 (< ₹10,000)
        date: '2026-02-14',
        phase: 1,
        vendorName: 'Shree Ganesh Stationary & Paper',
        billReferenceNumber: 'CSH-8821',
        gstAmount: '122400',
        paymentStatus: 'paid',
        approvedBy: 'System (Rule: < ₹10k)',
        approvalStatus: 'Approved',
        approvalRequiredLevel: 'Auto',
      },
      {
        expenseId: 'EXP-2026-004',
        category: 'Professional & Legal Fees',
        subCategory: 'CA fees',
        amount: '7500000', // ₹75,000
        date: '2026-02-28',
        phase: 1,
        vendorName: 'M/s Kothari & Singhania Chartered Accountants',
        billReferenceNumber: 'KS-Q4-AUDIT',
        gstAmount: '1350000',
        paymentStatus: 'paid',
        approvedBy: 'Rajesh Sharma (Director)',
        approvalStatus: 'Approved',
        approvalRequiredLevel: 'Director',
      },
      {
        expenseId: 'EXP-2026-005',
        category: 'Facility & Infrastructure',
        subCategory: 'rent/lease',
        amount: '22000000', // ₹2,20,000 (> ₹2,00,000)
        date: '2026-03-01',
        phase: 1,
        vendorName: 'MIDC Industrial Landlord Estate',
        billReferenceNumber: 'RNT-2026-MAR',
        gstAmount: '3960000',
        paymentStatus: 'paid',
        approvedBy: 'Board of Directors Sign-off',
        approvalStatus: 'Approved',
        approvalRequiredLevel: 'Board/Owner',
      },
      {
        expenseId: 'EXP-2026-006',
        category: 'Transportation & Logistics',
        subCategory: 'freight',
        amount: '4200000', // ₹42,000
        date: '2026-03-08',
        phase: 1,
        vendorName: 'V-Trans Express Logistics',
        billReferenceNumber: 'VT-902341',
        gstAmount: '210000',
        paymentStatus: 'paid',
        approvedBy: 'Amitabh Sen (Senior Manager)',
        approvalStatus: 'Approved',
        approvalRequiredLevel: 'Dept Head + Finance',
      },
    ]);

    // 13. Expense Budgets (for variance calculation)
    await db.insert(expenseBudgets).values([
      { category: 'Manufacturing & Production', subCategory: 'electricity', budgetedAmount: '16000000', fiscalYear: 2026, phase: 1 }, // ₹1,60,000 budget vs ₹1,85k actual (+15.6% flagged!)
      { category: 'Manufacturing & Production', subCategory: 'tools', budgetedAmount: '4000000', fiscalYear: 2026, phase: 1 }, // ₹40,000
      { category: 'Administrative & Office', subCategory: 'supplies', budgetedAmount: '700000', fiscalYear: 2026, phase: 1 }, // ₹7,000
      { category: 'Professional & Legal Fees', subCategory: 'CA fees', budgetedAmount: '7500000', fiscalYear: 2026, phase: 1 },
      { category: 'Facility & Infrastructure', subCategory: 'rent/lease', budgetedAmount: '22000000', fiscalYear: 2026, phase: 1 },
      { category: 'Transportation & Logistics', subCategory: 'freight', budgetedAmount: '3500000', fiscalYear: 2026, phase: 1 }, // ₹35,000 budget vs ₹42,000 actual (+20% flagged!)
    ]);

    // 14. Audit Log initial records
    await db.insert(auditLogs).values([
      {
        entityType: 'Bonus Rate',
        entityId: 'Director',
        fieldChanged: 'bonus_per_unit',
        oldValue: '₹12.00/unit',
        newValue: '₹15.00/unit',
        changedBy: 'Rajesh Sharma (Admin)',
        notes: 'Board revision for FY 2026-27 production volume expansion',
      },
      {
        entityType: 'Dividend Percent',
        entityId: 'Vikram Mehta',
        fieldChanged: 'dividend_percent',
        oldValue: '30.00%',
        newValue: '40.00%',
        changedBy: 'Board of Directors Resolution',
        notes: 'Rule 3(4) Companies (Declaration and Payment of Dividend) Rules 2014 approval',
      },
    ]);

    // 15. System Settings
    await db.insert(systemSettings).values([
      { key: 'corporate_tax_rate', value: '0.25', description: 'Base corporate income tax rate (25% under Section 115BAA)' },
      { key: 'tds_salary_slab_rate', value: '0.15', description: 'Configurable estimated average TDS percentage range on compensation' },
      { key: 'approval_threshold_auto', value: '1000000', description: 'Auto-approval limit in paise (₹10,000)' },
      { key: 'approval_threshold_dept_finance', value: '5000000', description: 'Dept Head + Finance limit in paise (₹50,000)' },
      { key: 'approval_threshold_director', value: '20000000', description: 'Director signoff threshold in paise (₹2,00,000)' },
    ]);

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding initial data:', err);
  }
}
