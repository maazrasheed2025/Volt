// server.ts
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
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
  users,
  inventoryItems,
} from './src/db/schema.ts';
import { seedInitialDataIfEmpty } from './src/db/seed.ts';
import { eq, desc, and, or, like } from 'drizzle-orm';
import { optionalAuth, requireAuth, AuthRequest } from './src/middleware/auth.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to determine approval level for an amount in paise
function determineApprovalLevel(amountPaise: bigint) {
  const autoLimit = 1000000n; // ₹10,000
  const deptFinanceLimit = 5000000n; // ₹50,000
  const directorLimit = 20000000n; // ₹2,00,000

  if (amountPaise < autoLimit) {
    return { level: 'Auto', status: 'Approved', approvedBy: 'System (Auto-Approved < ₹10k)' };
  } else if (amountPaise <= deptFinanceLimit) {
    return { level: 'Dept Head + Finance', status: 'Approved', approvedBy: 'Dept Head & Finance Desk' };
  } else if (amountPaise <= directorLimit) {
    return { level: 'Director', status: 'Approved', approvedBy: 'Managing Director' };
  } else {
    return { level: 'Board/Owner', status: 'Approved', approvedBy: 'Board of Directors Resolution' };
  }
}

// ------------------------------------
// API ROUTES
// ------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Current User profile & role sync
app.get('/api/auth/me', optionalAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      // Default to guest/viewer if unauthenticated in preview
      return res.json({
        uid: 'demo-user',
        email: 'imran@voltedge.in',
        displayName: 'Imran (CMD / Owner)',
        role: 'Admin/Owner',
        isDemo: true,
      });
    }

    const existing = await db.select().from(users).where(eq(users.uid, req.user.uid)).limit(1);
    if (existing.length > 0) {
      return res.json(existing[0]);
    }

    // Register user in database
    const newUser = await db.insert(users).values({
      uid: req.user.uid,
      email: req.user.email || 'user@factory.in',
      displayName: req.user.name || 'Factory Executive',
      role: 'Admin/Owner', // default role for first authenticated user
    }).returning();

    res.json(newUser[0]);
  } catch (err: any) {
    console.error('Error fetching/creating user:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update User Role (Admin only feature in UI)
app.post('/api/auth/role', optionalAuth, async (req, res) => {
  try {
    const { role, uid } = req.body;
    if (uid && uid !== 'demo-user') {
      await db.update(users).set({ role }).where(eq(users.uid, uid));
    }
    res.json({ success: true, role });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Comprehensive Dashboard Aggregates
app.get('/api/dashboard/overview', optionalAuth, async (req, res) => {
  try {
    const safeSelect = async (queryFn: () => Promise<any[]>, fallback: any[] = []) => {
      try {
        return await queryFn();
      } catch (e) {
        console.warn('Dashboard aggregate subquery warning:', e);
        return fallback;
      }
    };

    const [
      allEmployees,
      allProduction,
      allBonusRates,
      allInsurance,
      allExpenses,
      allConstruction,
      allLoans,
      allShareholders,
      allAssets,
      allProducts,
      allBoms,
      allAdvances,
      allBudgets,
      allSettings,
      allInventory,
    ] = await Promise.all([
      safeSelect(() => db.select().from(employees)),
      safeSelect(() => db.select().from(production)),
      safeSelect(() => db.select().from(bonusRates)),
      safeSelect(() => db.select().from(insurancePolicies)),
      safeSelect(() => db.select().from(expenses)),
      safeSelect(() => db.select().from(factoryConstructionBudget)),
      safeSelect(() => db.select().from(loans)),
      safeSelect(() => db.select().from(shareholders)),
      safeSelect(() => db.select().from(capitalEquipment)),
      safeSelect(() => db.select().from(products)),
      safeSelect(() => db.select().from(bomLineItems)),
      safeSelect(() => db.select().from(employeeAdvances)),
      safeSelect(() => db.select().from(expenseBudgets)),
      safeSelect(() => db.select().from(systemSettings)),
      safeSelect(() => db.select().from(inventoryItems)),
    ]);

    res.json({
      employees: allEmployees,
      production: allProduction,
      bonusRates: allBonusRates,
      insurancePolicies: allInsurance,
      expenses: allExpenses,
      constructionBudget: allConstruction,
      loans: allLoans,
      shareholders: allShareholders,
      capitalEquipment: allAssets,
      products: allProducts,
      bomLineItems: allBoms,
      employeeAdvances: allAdvances,
      expenseBudgets: allBudgets,
      systemSettings: allSettings,
      inventoryItems: allInventory,
    });
  } catch (err: any) {
    console.warn('Dashboard overview fetch warning:', err);
    res.status(200).json({
      employees: [],
      production: [],
      bonusRates: [],
      insurancePolicies: [],
      expenses: [],
      constructionBudget: [],
      loans: [],
      shareholders: [],
      capitalEquipment: [],
      products: [],
      bomLineItems: [],
      employeeAdvances: [],
      expenseBudgets: [],
      systemSettings: [],
      inventoryItems: [],
      warning: err.message,
    });
  }
});

// --- EMPLOYEES CRUD ---
app.get('/api/employees', optionalAuth, async (req, res) => {
  try {
    const data = await db.select().from(employees);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', optionalAuth, async (req, res) => {
  try {
    const emp = req.body;
    const inserted = await db.insert(employees).values(emp).returning();

    // Log audit
    await db.insert(auditLogs).values({
      entityType: 'Employee',
      entityId: emp.employeeId,
      fieldChanged: 'created',
      oldValue: 'None',
      newValue: `Name: ${emp.name}, Salary: ₹${Number(emp.monthlySalary)/100}`,
      changedBy: req.body.changedBy || 'Admin',
      notes: 'New employee onboarded',
    });

    res.json(inserted[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const old = await db.select().from(employees).where(eq(employees.id, id)).limit(1);

    const updated = await db.update(employees).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(employees.id, id)).returning();

    if (old.length > 0 && updates.monthlySalary && old[0].monthlySalary !== updates.monthlySalary) {
      await db.insert(auditLogs).values({
        entityType: 'Salary Rate',
        entityId: old[0].employeeId,
        fieldChanged: 'monthly_salary',
        oldValue: `₹${Number(old[0].monthlySalary)/100}`,
        newValue: `₹${Number(updates.monthlySalary)/100}`,
        changedBy: updates.changedBy || 'Admin',
        notes: `Salary update for ${old[0].name}`,
      });
    }

    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(employees).where(eq(employees.id, id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle employee status between active and not_hired
app.put('/api/employees/:id/toggle-status', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const updated = await db.update(employees).set({
      status,
      updatedAt: new Date(),
    }).where(eq(employees.id, id)).returning();
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Switch Business Stage (prototype, selling, full)
app.post('/api/stage/switch', optionalAuth, async (req, res) => {
  try {
    const { stage, isLoansActive, isFactoryActive, founderFundsPaise } = req.body;

    // 1. Persist current stage
    await db.insert(systemSettings).values({
      key: 'current_app_stage',
      value: stage,
      description: 'Active business stage (prototype, selling, full)',
    }).onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: stage, updatedAt: new Date() },
    });

    // 2. Persist loan section toggle
    if (isLoansActive !== undefined) {
      await db.insert(systemSettings).values({
        key: 'loans_section_active',
        value: String(isLoansActive),
        description: 'Whether financier loans are active in cashflow calculations',
      }).onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: String(isLoansActive), updatedAt: new Date() },
      });
    }

    // 3. Persist factory section toggle
    if (isFactoryActive !== undefined) {
      await db.insert(systemSettings).values({
        key: 'factory_section_active',
        value: String(isFactoryActive),
        description: 'Whether factory construction is active in cashflow calculations',
      }).onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: String(isFactoryActive), updatedAt: new Date() },
      });
    }

    // 4. Persist founder self-funds if provided
    if (founderFundsPaise !== undefined) {
      await db.insert(systemSettings).values({
        key: 'founder_capital_paise',
        value: String(founderFundsPaise),
        description: 'Initial founder capital/self-funds injected to build prototype (paise)',
      }).onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: String(founderFundsPaise), updatedAt: new Date() },
      });
    }

    // 5. NOTE: User requirement: Do not overwrite or change employee hired status when switching stage.
    // Employees retain their individual hired/active status independently of company operating stage.

    res.json({ success: true, stage });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Set Crew Level (prototype_crew, core_partners, all_staff)
app.post('/api/settings/set-crew-level', optionalAuth, async (req, res) => {
  try {
    const { level, customActiveNames } = req.body;
    const allEmps = await db.select().from(employees);

    for (const emp of allEmps) {
      let newStatus = 'not_hired';
      if (customActiveNames && Array.isArray(customActiveNames)) {
        if (customActiveNames.includes(emp.name) || customActiveNames.includes(emp.employeeId)) {
          newStatus = 'active';
        }
      } else if (level === 'prototype_crew') {
        if (['Imran', 'Pappu Bhai', 'Simran', 'Naushad Bhai', 'Wahid'].includes(emp.name)) {
          newStatus = 'active';
        }
      } else if (level === 'core_partners') {
        if (['Imran', 'Pappu Bhai', 'Simran', 'Naushad Bhai', 'Wahid', 'Kumail', 'Ramendra IIT', 'Vijay IIT'].includes(emp.name)) {
          newStatus = 'active';
        }
      } else if (level === 'all_staff') {
        newStatus = 'active';
      }

      if (emp.status !== newStatus) {
        await db.update(employees).set({ status: newStatus }).where(eq(employees.id, emp.id));
      }
    }

    await db.insert(systemSettings).values({
      key: 'active_crew_level',
      value: level,
      description: 'Active staff payroll level',
    }).onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: level, updatedAt: new Date() },
    });

    res.json({ success: true, level });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle individual section (loans, factory, etc.)
app.post('/api/settings/toggle-section', optionalAuth, async (req, res) => {
  try {
    const { section, active } = req.body;
    const key = section === 'loans' ? 'loans_section_active' : 'factory_section_active';
    await db.insert(systemSettings).values({
      key,
      value: String(active),
      description: `${section} active state`,
    }).onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: String(active), updatedAt: new Date() },
    });
    res.json({ success: true, section, active });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update founder capital / self-funds
app.put('/api/settings/founder-capital', optionalAuth, async (req, res) => {
  try {
    const { amountPaise } = req.body;
    await db.insert(systemSettings).values({
      key: 'founder_capital_paise',
      value: String(amountPaise),
      description: 'Initial founder capital/self-funds injected to build prototype (paise)',
    }).onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: String(amountPaise), updatedAt: new Date() },
    });
    res.json({ success: true, amountPaise });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update corporate tax rate and tax regime
app.post('/api/settings/tax-settings', optionalAuth, async (req, res) => {
  try {
    const { taxRate, regimeName } = req.body;
    if (taxRate !== undefined) {
      await db.insert(systemSettings).values({
        key: 'corporate_tax_rate',
        value: String(taxRate),
        description: 'Corporate income tax rate under current rules',
      }).onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: String(taxRate), updatedAt: new Date() },
      });
    }
    if (regimeName) {
      await db.insert(systemSettings).values({
        key: 'tax_regime_name',
        value: String(regimeName),
        description: 'Selected Indian corporate tax regime under Section 115BAA/115BAB/MSME',
      }).onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: String(regimeName), updatedAt: new Date() },
      });
    }
    res.json({ success: true, taxRate, regimeName });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Record a salary payment to an employee that records into expenses
app.post('/api/employees/:id/pay-salary', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { amountPaise, monthYear, paymentMode, notes } = req.body;
    const emp = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
    if (emp.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const targetEmp = emp[0];
    const payAmount = amountPaise || targetEmp.monthlySalary;

    const expenseId = `SAL-${targetEmp.employeeId}-${Date.now().toString().slice(-5)}`;
    const newExpense = await db.insert(expenses).values({
      expenseId,
      category: 'Payroll & Salaries',
      subCategory: `${targetEmp.post || targetEmp.category} Monthly Salary`,
      amount: payAmount.toString(),
      date: new Date().toISOString().split('T')[0],
      phase: 1,
      vendorName: targetEmp.name,
      billReferenceNumber: `SAL-${monthYear || 'CURRENT'}-${targetEmp.employeeId}`,
      gstAmount: '0',
      paymentStatus: 'paid',
      approvedBy: 'Managing Director / Imran (Payroll Desk)',
      approvalStatus: 'Approved',
      approvalRequiredLevel: 'Auto',
    }).returning();

    res.json({ success: true, expense: newExpense[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch Pay All Due Salaries for a given month
app.post('/api/employees/pay-all-salaries', optionalAuth, async (req, res) => {
  try {
    const { monthYear } = req.body;
    const activeStaff = await db.select().from(employees).where(eq(employees.status, 'active'));
    const payableStaff = activeStaff.filter((e) => BigInt(e.monthlySalary || '0') > 0n);

    const createdExpenses = [];
    const today = new Date().toISOString().split('T')[0];

    for (const emp of payableStaff) {
      const expenseId = `SAL-${emp.employeeId}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
      const exp = await db.insert(expenses).values({
        expenseId,
        category: 'Payroll & Salaries',
        subCategory: `${emp.post || emp.category} Monthly Salary`,
        amount: emp.monthlySalary,
        date: today,
        phase: 1,
        vendorName: emp.name,
        billReferenceNumber: `SAL-${monthYear || 'BATCH'}-${emp.employeeId}`,
        gstAmount: '0',
        paymentStatus: 'paid',
        approvedBy: 'Managing Director / Imran (Payroll Desk)',
        approvalStatus: 'Approved',
        approvalRequiredLevel: 'Auto',
      }).returning();
      createdExpenses.push(exp[0]);
    }

    res.json({ success: true, count: createdExpenses.length, expenses: createdExpenses });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Remove already disbursed salary / undo salary disbursement (single employee or batch month)
app.post('/api/employees/undo-salary-payment', optionalAuth, async (req, res) => {
  try {
    const { employeeId, monthYear, expenseId } = req.body;

    // 1. Direct deletion by expenseId
    if (expenseId) {
      await db.delete(expenses).where(eq(expenses.id, parseInt(expenseId)));
      return res.json({ success: true, message: 'Disbursed salary expense removed' });
    }

    const currentMonth = monthYear || new Date().toISOString().slice(0, 7);

    // 2. Deletion by employeeId for specified month
    if (employeeId) {
      const emp = await db.select().from(employees).where(eq(employees.id, parseInt(employeeId))).limit(1);
      if (emp.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      const targetEmp = emp[0];
      const salaryExpenses = await db.select().from(expenses).where(
        eq(expenses.category, 'Payroll & Salaries')
      );
      const toDelete = salaryExpenses.filter((exp) => {
        const matchesEmp = exp.vendorName === targetEmp.name || exp.billReferenceNumber.includes(targetEmp.employeeId);
        const matchesMonth = exp.date.startsWith(currentMonth) || exp.billReferenceNumber.includes(currentMonth);
        return matchesEmp && matchesMonth;
      });

      for (const exp of toDelete) {
        await db.delete(expenses).where(eq(expenses.id, exp.id));
      }
      return res.json({ success: true, removedCount: toDelete.length, message: `Removed ${toDelete.length} salary disbursement(s) for ${targetEmp.name}` });
    }

    // 3. Batch deletion for all employees for specified month
    const allSalaryExpenses = await db.select().from(expenses).where(
      eq(expenses.category, 'Payroll & Salaries')
    );
    const batchToDelete = allSalaryExpenses.filter(
      (exp) => exp.date.startsWith(currentMonth) || exp.billReferenceNumber.includes(currentMonth)
    );
    for (const exp of batchToDelete) {
      await db.delete(expenses).where(eq(expenses.id, exp.id));
    }

    res.json({ success: true, removedCount: batchToDelete.length, message: `Removed ${batchToDelete.length} salary disbursements for ${currentMonth}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Disburse Profit Share to Partners / Shareholders
app.post('/api/profit-distribution', optionalAuth, async (req, res) => {
  try {
    const { totalProfitPaise, sourceDescription, distributions, taxDeductedPaise, corporateTaxRatePercent } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const createdExpenses = [];

    // If estimated corporate tax was deducted before distribution, log the statutory tax expense!
    if (taxDeductedPaise && BigInt(taxDeductedPaise) > 0n) {
      const taxExpenseId = `TAX-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 1000)}`;
      const taxExp = await db.insert(expenses).values({
        expenseId: taxExpenseId,
        category: 'Corporate Income Tax',
        subCategory: `Corporate Income Tax (${corporateTaxRatePercent || 25}%) Estimated Liability`,
        amount: taxDeductedPaise.toString(),
        date: today,
        phase: 1,
        vendorName: 'Income Tax Department (Govt of India)',
        billReferenceNumber: `IT-EST-TAX-${today}`,
        gstAmount: '0',
        paymentStatus: 'paid',
        approvedBy: 'Managing Director & Tax Consultant',
        approvalStatus: 'Approved',
        approvalRequiredLevel: 'Director',
      }).returning();
      createdExpenses.push(taxExp[0]);
    }

    for (const dist of distributions) {
      if (BigInt(dist.amountPaise || '0') <= 0n) continue;

      const expenseId = `DIV-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 1000)}`;
      const exp = await db.insert(expenses).values({
        expenseId,
        category: 'Profit Distribution & Dividends',
        subCategory: `Partner Net Profit Share (${dist.dividendPercent}%) - ${dist.partnerName}`,
        amount: dist.amountPaise.toString(),
        date: today,
        phase: 1,
        vendorName: dist.partnerName,
        billReferenceNumber: `PROFIT-NET-${today}-${dist.partnerName.slice(0, 4).toUpperCase()}`,
        gstAmount: '0',
        paymentStatus: 'paid',
        approvedBy: 'Board of Directors Resolution / CMD Imran',
        approvalStatus: 'Approved',
        approvalRequiredLevel: 'Board/Owner',
      }).returning();
      createdExpenses.push(exp[0]);
    }

    res.json({ success: true, count: createdExpenses.length, expenses: createdExpenses });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Undo or delete profit distribution entries (single voucher or whole batch)
app.post('/api/profit-distribution/undo', optionalAuth, async (req, res) => {
  try {
    const { expenseId, batchReference, date } = req.body;

    // 1. Single voucher deletion
    if (expenseId) {
      const deleted = await db.delete(expenses).where(eq(expenses.id, parseInt(expenseId))).returning();
      return res.json({ success: true, count: deleted.length, message: 'Profit distribution voucher removed' });
    }

    // 2. Batch deletion by billReferenceNumber or date
    const allDistExpenses = await db.select().from(expenses).where(
      or(
        eq(expenses.category, 'Profit Distribution & Dividends'),
        eq(expenses.category, 'Corporate Income Tax')
      )
    );

    const toDelete = allDistExpenses.filter((exp) => {
      if (batchReference && exp.billReferenceNumber.includes(batchReference)) {
        return true;
      }
      if (date && exp.date === date) {
        return true;
      }
      return false;
    });

    for (const exp of toDelete) {
      await db.delete(expenses).where(eq(expenses.id, exp.id));
    }

    res.json({
      success: true,
      count: toDelete.length,
      message: `Removed ${toDelete.length} profit distribution voucher(s)`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// --- PRODUCTION CRUD ---
app.get('/api/production', optionalAuth, async (req, res) => {
  try {
    const data = await db.select().from(production);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/production', optionalAuth, async (req, res) => {
  try {
    const inserted = await db.insert(production).values(req.body).returning();
    res.json(inserted[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- BONUS RATES CRUD (Audit logged) ---
app.get('/api/bonus-rates', optionalAuth, async (req, res) => {
  try {
    const data = await db.select().from(bonusRates);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bonus-rates/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { bonusPerUnit, versionNotes, changedBy } = req.body;
    const old = await db.select().from(bonusRates).where(eq(bonusRates.id, id)).limit(1);

    const updated = await db.update(bonusRates).set({
      bonusPerUnit,
      versionNotes,
      updatedAt: new Date(),
    }).where(eq(bonusRates.id, id)).returning();

    if (old.length > 0) {
      await db.insert(auditLogs).values({
        entityType: 'Bonus Rate',
        entityId: old[0].category,
        fieldChanged: 'bonus_per_unit',
        oldValue: `₹${Number(old[0].bonusPerUnit)/100}/unit`,
        newValue: `₹${Number(bonusPerUnit)/100}/unit`,
        changedBy: changedBy || 'Admin',
        notes: versionNotes || 'Updated category bonus rate per unit',
      });
    }

    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- EXPENSES WITH WORKFLOW APPROVAL ---
app.get('/api/expenses', optionalAuth, async (req, res) => {
  try {
    const data = await db.select().from(expenses).orderBy(desc(expenses.createdAt));
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', optionalAuth, async (req, res) => {
  try {
    const exp = req.body;
    const amountPaise = BigInt(exp.amount || 0);
    const routing = determineApprovalLevel(amountPaise);

    const newExpense = {
      ...exp,
      expenseId: exp.expenseId || `EXP-${Date.now().toString().slice(-6)}`,
      approvalStatus: routing.status,
      approvalRequiredLevel: routing.level,
      approvedBy: exp.approvedBy || routing.approvedBy,
    };

    const inserted = await db.insert(expenses).values(newExpense).returning();
    res.json(inserted[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/expenses/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    let routingUpdates = {};
    if (updates.amount) {
      const amountPaise = BigInt(updates.amount || 0);
      const routing = determineApprovalLevel(amountPaise);
      routingUpdates = {
        approvalStatus: updates.approvalStatus || routing.status,
        approvalRequiredLevel: updates.approvalRequiredLevel || routing.level,
        approvedBy: updates.approvedBy || routing.approvedBy,
      };
    }
    const updated = await db.update(expenses).set({
      ...updates,
      ...routingUpdates,
    }).where(eq(expenses.id, id)).returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(expenses).where(eq(expenses.id, id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- FACTORY CONSTRUCTION BUDGET ---
app.get('/api/construction', optionalAuth, async (req, res) => {
  try {
    const data = await db.select().from(factoryConstructionBudget);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/construction', optionalAuth, async (req, res) => {
  try {
    const inserted = await db.insert(factoryConstructionBudget).values(req.body).returning();
    res.json(inserted[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/construction/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await db.update(factoryConstructionBudget).set({
      ...req.body,
      updatedAt: new Date(),
    }).where(eq(factoryConstructionBudget.id, id)).returning();
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/construction/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(factoryConstructionBudget).where(eq(factoryConstructionBudget.id, id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- LOANS CRUD ---
app.get('/api/loans', optionalAuth, async (req, res) => {
  try {
    const data = await db.select().from(loans);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/loans', optionalAuth, async (req, res) => {
  try {
    const inserted = await db.insert(loans).values(req.body).returning();
    res.json(inserted[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/loans/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await db.update(loans).set({
      ...req.body,
      updatedAt: new Date(),
    }).where(eq(loans.id, id)).returning();
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/loans/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(loans).where(eq(loans.id, id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Record Financier Profit / Loan Payment (User: "pay them profit time to time and that total profit of theirs will be calculated and get into expanses")
app.post('/api/loans/:id/payment', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { profitPaidPaise, principalPaidPaise, paymentDate, notes } = req.body;
    
    const existingLoan = await db.select().from(loans).where(eq(loans.id, id)).limit(1);
    if (existingLoan.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    const loan = existingLoan[0];

    const currentPrincipalRepaid = BigInt(loan.principalRepaid || '0');
    const currentInterestPaid = BigInt(loan.interestPaidToDate || '0');
    const currentOutstanding = BigInt(loan.outstandingBalance || loan.principalAmount);

    const addPrincipal = BigInt(principalPaidPaise || '0');
    const addProfit = BigInt(profitPaidPaise || '0');

    const newPrincipalRepaid = (currentPrincipalRepaid + addPrincipal).toString();
    const newInterestPaid = (currentInterestPaid + addProfit).toString();
    const newOutstanding = currentOutstanding > addPrincipal ? (currentOutstanding - addPrincipal).toString() : '0';

    const updated = await db.update(loans).set({
      principalRepaid: newPrincipalRepaid,
      interestPaidToDate: newInterestPaid,
      outstandingBalance: newOutstanding,
      updatedAt: new Date(),
    }).where(eq(loans.id, id)).returning();

    // If profit/interest was paid, automatically add it into the expenses table as requested!
    if (addProfit > 0n) {
      const expenseId = `EXP-FIN-${Date.now().toString().slice(-6)}`;
      await db.insert(expenses).values({
        expenseId,
        category: 'Financier Profit & Interest',
        subCategory: 'Lender Profit Share',
        amount: addProfit.toString(),
        date: paymentDate || new Date().toISOString().split('T')[0],
        phase: 1,
        vendorName: loan.lender,
        billReferenceNumber: `FIN-PROFIT-${loan.loanId}`,
        gstAmount: '0',
        paymentStatus: 'paid',
        approvedBy: 'Managing Director / Owner',
        approvalStatus: 'Approved',
        approvalRequiredLevel: 'Director',
      });
    }

    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- SHAREHOLDERS & DIVIDENDS ---
app.get('/api/shareholders', optionalAuth, async (req, res) => {
  try {
    const data = await db.select().from(shareholders);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/shareholders/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const old = await db.select().from(shareholders).where(eq(shareholders.id, id)).limit(1);

    const updated = await db.update(shareholders).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(shareholders.id, id)).returning();

    if (old.length > 0 && updates.dividendPercent && old[0].dividendPercent !== updates.dividendPercent) {
      await db.insert(auditLogs).values({
        entityType: 'Dividend Percent',
        entityId: old[0].name,
        fieldChanged: 'dividend_percent',
        oldValue: `${old[0].dividendPercent}%`,
        newValue: `${updates.dividendPercent}%`,
        changedBy: updates.changedBy || 'Admin',
        notes: updates.notes || 'Shareholder dividend revision (Rule 3(4))',
      });
    }

    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- CAPITAL ASSETS ---
app.get('/api/capital-equipment', optionalAuth, async (req, res) => {
  try {
    const data = await db.select().from(capitalEquipment);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/capital-equipment', optionalAuth, async (req, res) => {
  try {
    const inserted = await db.insert(capitalEquipment).values(req.body).returning();
    res.json(inserted[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- PROTOTYPES & BOM MODULE ---
app.get('/api/products', optionalAuth, async (req, res) => {
  try {
    const data = await db.select().from(products);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', optionalAuth, async (req, res) => {
  try {
    const inserted = await db.insert(products).values(req.body).returning();
    res.json(inserted[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await db.update(products).set({
      ...req.body,
      updatedAt: new Date(),
    }).where(eq(products.id, id)).returning();
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(products).where(eq(products.id, id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bom-line-items', optionalAuth, async (req, res) => {
  try {
    const data = await db.select().from(bomLineItems);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bom-line-items', optionalAuth, async (req, res) => {
  try {
    const item = req.body;
    // Auto-exclusion rule: check if item name looks like software or cloud subscription
    const nameLower = (item.itemName || '').toLowerCase();
    const isSoftwareKeyword = /software|subscription|autocad|solidworks|cloud|saas|license|chatgpt|gemini|aws|hosting/i.test(nameLower);

    let isMiscategorized = item.isMiscategorized || false;
    let miscategorizedReason = item.miscategorizedReason || '';

    if (isSoftwareKeyword && !isMiscategorized) {
      isMiscategorized = true;
      miscategorizedReason = 'Software/subscription item auto-detected in Prototype BOM. Excluded from prototype build cost; prompt to refile under Technology & IT.';
    }

    const inserted = await db.insert(bomLineItems).values({
      ...item,
      isMiscategorized,
      miscategorizedReason,
    }).returning();

    res.json(inserted[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bom-line-items/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await db.update(bomLineItems).set(req.body).where(eq(bomLineItems.id, id)).returning();
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bom-line-items/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(bomLineItems).where(eq(bomLineItems.id, id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- EMPLOYEE ADVANCES (SEPARATE LEDGER) ---
app.get('/api/employee-advances', optionalAuth, async (req, res) => {
  try {
    const data = await db.select().from(employeeAdvances);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employee-advances', optionalAuth, async (req, res) => {
  try {
    const adv = req.body;
    
    // Check if employee is a shareholder / director -> Auto flag Related Party (Companies Act Section 188)
    const emp = await db.select().from(employees).where(eq(employees.employeeId, adv.employeeId)).limit(1);
    let isRelated = false;
    if (emp.length > 0 && (emp[0].isShareholder || emp[0].category === 'Director')) {
      isRelated = true;
    }

    const inserted = await db.insert(employeeAdvances).values({
      ...adv,
      isRelatedParty: isRelated,
      status: adv.status || 'Outstanding',
    }).returning();

    if (isRelated) {
      await db.insert(auditLogs).values({
        entityType: 'Related Party Advance',
        entityId: adv.employeeId,
        fieldChanged: 'Section 188 Advance Given',
        oldValue: 'None',
        newValue: `₹${Number(adv.amount)/100} to ${emp[0]?.name}`,
        changedBy: adv.changedBy || 'System Flag',
        notes: 'Section 188 Related Party Transaction auto-flagged for board disclosure',
      });
    }

    res.json(inserted[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reconcile employee advance (manual action, never auto-zeroed)
app.put('/api/employee-advances/:id/reconcile', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, reconciliationNotes, reconciledDate } = req.body;

    const updated = await db.update(employeeAdvances).set({
      status,
      reconciliationNotes,
      reconciledDate: reconciledDate || new Date().toISOString().split('T')[0],
      updatedAt: new Date(),
    }).where(eq(employeeAdvances.id, id)).returning();

    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- AUDIT LOGS ---
app.get('/api/audit-logs', optionalAuth, async (req, res) => {
  try {
    const data = await db.select().from(auditLogs).orderBy(desc(auditLogs.changedAt));
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- SYSTEM SETTINGS ---
app.get('/api/settings', optionalAuth, async (req, res) => {
  try {
    const data = await db.select().from(systemSettings);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/:key', optionalAuth, async (req, res) => {
  try {
    const { value, description } = req.body;
    const key = req.params.key;
    const updated = await db.update(systemSettings).set({
      value,
      description,
      updatedAt: new Date(),
    }).where(eq(systemSettings.key, key)).returning();
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- INVENTORY MANAGEMENT (RAW MATERIAL STOCK, REORDER POINTS & SUPPLIERS) ---
app.get('/api/inventory', optionalAuth, async (req, res) => {
  try {
    const items = await db.select().from(inventoryItems).orderBy(inventoryItems.id);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory', optionalAuth, async (req, res) => {
  try {
    const itemData = req.body;
    // Auto-generate SKU if missing
    if (!itemData.sku) {
      const count = await db.select().from(inventoryItems);
      itemData.sku = `RAW-${itemData.category ? itemData.category.slice(0, 3).toUpperCase() : 'MAT'}-${String(count.length + 1).padStart(3, '0')}`;
    }
    const inserted = await db.insert(inventoryItems).values({
      ...itemData,
      currentStock: Number(itemData.currentStock || 0),
      minStockLevel: Number(itemData.minStockLevel || 5),
      reorderPoint: Number(itemData.reorderPoint || 10),
      unitCost: itemData.unitCost ? String(itemData.unitCost) : '0',
      leadTimeDays: Number(itemData.leadTimeDays || 7),
    }).returning();
    res.json(inserted[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/inventory/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = { ...req.body, updatedAt: new Date() };
    if (updates.currentStock !== undefined) updates.currentStock = Number(updates.currentStock);
    if (updates.minStockLevel !== undefined) updates.minStockLevel = Number(updates.minStockLevel);
    if (updates.reorderPoint !== undefined) updates.reorderPoint = Number(updates.reorderPoint);
    if (updates.leadTimeDays !== undefined) updates.leadTimeDays = Number(updates.leadTimeDays);

    const updated = await db.update(inventoryItems).set(updates).where(eq(inventoryItems.id, id)).returning();
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory/:id/adjust-stock', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { delta, reason, notes } = req.body;
    const existing = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const current = existing[0];
    const newStock = Math.max(0, current.currentStock + Number(delta || 0));
    const today = new Date().toISOString().split('T')[0];

    const updated = await db.update(inventoryItems).set({
      currentStock: newStock,
      lastRestockedDate: delta > 0 ? today : current.lastRestockedDate,
      notes: notes ? `${current.notes || ''} [${today} ${delta > 0 ? '+' : ''}${delta}: ${reason || 'Manual Adjust'}]`.trim() : current.notes,
      updatedAt: new Date(),
    }).where(eq(inventoryItems.id, id)).returning();

    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/inventory/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------
// FULL APP DATA BACKUP & RESTORE API
// ------------------------------------

const inMemoryCloudBackups: any[] = [];

// Save cloud snapshot
app.post('/api/backup/cloud/save', optionalAuth, async (req, res) => {
  try {
    const { backup } = req.body;
    if (!backup || !backup.payload) {
      return res.status(400).json({ error: 'Invalid backup object' });
    }
    inMemoryCloudBackups.unshift(backup);
    if (inMemoryCloudBackups.length > 10) {
      inMemoryCloudBackups.pop();
    }
    res.json({ success: true, totalSnapshots: inMemoryCloudBackups.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List cloud snapshots
app.get('/api/backup/cloud/list', optionalAuth, async (req, res) => {
  try {
    res.json({ backups: inMemoryCloudBackups });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Full state restore
app.post('/api/backup/restore', optionalAuth, async (req, res) => {
  try {
    const { backup } = req.body;
    if (!backup || !backup.collections) {
      return res.status(400).json({ error: 'Invalid backup payload: missing collections' });
    }

    const {
      employees: backupEmployees,
      expenses: backupExpenses,
      inventoryItems: backupInventory,
      loans: backupLoans,
      systemSettings: backupSettings,
    } = backup.collections;

    // Restore employees if provided
    if (Array.isArray(backupEmployees) && backupEmployees.length > 0) {
      for (const emp of backupEmployees) {
        if (emp.id) {
          const existing = await db.select().from(employees).where(eq(employees.id, Number(emp.id))).limit(1);
          if (existing.length > 0) {
            await db.update(employees).set({
              name: emp.name,
              post: emp.post || '',
              category: emp.category,
              monthlySalary: String(emp.monthlySalary),
              shareholdingPercent: emp.shareholdingPercent || '0.00',
              dividendPercent: emp.dividendPercent || '0.00',
              status: emp.status || 'active',
              updatedAt: new Date(),
            }).where(eq(employees.id, Number(emp.id)));
          } else {
            await db.insert(employees).values({
              name: emp.name,
              employeeId: emp.employeeId || `EMP-${Date.now()}`,
              post: emp.post || '',
              category: emp.category || 'Core Team',
              monthlySalary: String(emp.monthlySalary || '0'),
              shareholdingPercent: emp.shareholdingPercent || '0.00',
              dividendPercent: emp.dividendPercent || '0.00',
              joinDate: emp.joinDate || '2025-04-01',
              status: emp.status || 'active',
            } as any);
          }
        }
      }
    }

    // Restore expenses if provided
    if (Array.isArray(backupExpenses) && backupExpenses.length > 0) {
      for (const exp of backupExpenses) {
        if (exp.id) {
          const existing = await db.select().from(expenses).where(eq(expenses.id, Number(exp.id))).limit(1);
          if (existing.length === 0) {
            await db.insert(expenses).values({
              expenseId: exp.expenseId || `EXP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              category: exp.category,
              subCategory: exp.subCategory,
              amount: String(exp.amount),
              date: exp.date,
              vendorName: exp.vendorName,
              billReferenceNumber: exp.billReferenceNumber || 'RESTORED-BILL',
              paymentStatus: exp.paymentStatus || exp.status || 'paid',
            } as any);
          }
        }
      }
    }

    // Restore inventory if provided
    if (Array.isArray(backupInventory) && backupInventory.length > 0) {
      for (const item of backupInventory) {
        if (item.id) {
          const existing = await db.select().from(inventoryItems).where(eq(inventoryItems.id, Number(item.id))).limit(1);
          if (existing.length > 0) {
            await db.update(inventoryItems).set({
              currentStock: item.currentStock,
              unitCost: item.unitCost || item.unitCostPaise || '0',
              category: item.category,
              supplierName: item.supplierName,
              updatedAt: new Date(),
            }).where(eq(inventoryItems.id, Number(item.id)));
          }
        }
      }
    }

    // Restore systemSettings if provided
    if (Array.isArray(backupSettings) && backupSettings.length > 0) {
      for (const setItem of backupSettings) {
        if (setItem.key) {
          const existing = await db.select().from(systemSettings).where(eq(systemSettings.key, setItem.key)).limit(1);
          if (existing.length > 0) {
            await db.update(systemSettings).set({ value: setItem.value, updatedAt: new Date() }).where(eq(systemSettings.key, setItem.key));
          } else {
            await db.insert(systemSettings).values({ key: setItem.key, value: setItem.value });
          }
        }
      }
    }

    res.json({
      success: true,
      restoredAt: new Date().toISOString(),
      summary: {
        employeesCount: backupEmployees?.length || 0,
        expensesCount: backupExpenses?.length || 0,
        inventoryCount: backupInventory?.length || 0,
      },
    });
  } catch (err: any) {
    console.error('Restore error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------
// VITE & SERVER STARTUP
// ------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VoltEdge Generator Manufacturing ERP running on http://0.0.0.0:${PORT}`);
  });

  // Seed initial manufacturing data in the background if empty (non-blocking)
  seedInitialDataIfEmpty().catch((seedErr) => {
    console.warn('Initial data seed non-fatal warning:', seedErr);
  });
}

startServer();
