// src/data/categories.ts
export interface ExpenseCategoryConfig {
  name: string;
  subCategories: string[];
}

export const EXPENSE_CATEGORIES: ExpenseCategoryConfig[] = [
  {
    name: 'Manufacturing & Production',
    subCategories: [
      'spares',
      'tools',
      'QC materials',
      'packaging',
      'lubricants',
      'electricity',
      'water',
      'gas',
      'machinery AMC',
      'building repairs',
      'electrical maintenance'
    ]
  },
  {
    name: 'Facility & Infrastructure',
    subCategories: [
      'rent/lease',
      'property tax',
      'security',
      'fire safety',
      'housekeeping',
      'waste disposal',
      'pest control'
    ]
  },
  {
    name: 'Transportation & Logistics',
    subCategories: [
      'freight',
      'vehicle fuel/maintenance',
      'vehicle insurance',
      'loading/unloading',
      'warehousing'
    ]
  },
  {
    name: 'Marketing & Business Development',
    subCategories: [
      'advertising',
      'digital marketing',
      'trade shows',
      'sales commission',
      'entertainment',
      'travel'
    ]
  },
  {
    name: 'Administrative & Office',
    subCategories: [
      'supplies',
      'telephone/internet',
      'postage',
      'software licenses',
      'bank charges',
      'pantry'
    ]
  },
  {
    name: 'Professional & Legal Fees',
    subCategories: [
      'CA fees',
      'CS fees',
      'legal fees',
      'audit fees',
      'consultancy'
    ]
  },
  {
    name: 'Technology & IT',
    subCategories: [
      'hardware',
      'software',
      'hosting',
      'cybersecurity',
      'IT support'
    ]
  },
  {
    name: 'Financial Costs',
    subCategories: [
      'loan interest',
      'bank guarantee/LC charges',
      'property/liability insurance',
      'forex'
    ]
  },
  {
    name: 'Capital Equipment',
    subCategories: [
      'generator sets',
      'machinery',
      'vehicles'
    ]
  },
  {
    name: 'Taxes & Compliance',
    subCategories: [
      'GST',
      'corporate income tax',
      'factory license',
      'environmental clearance',
      'trade license'
    ]
  },
  {
    name: 'R&D & Training',
    subCategories: [
      'prototype development',
      'staff skills training',
      'safety drills certification',
      'testing certifications'
    ]
  },
  {
    name: 'Contingency & Reserves',
    subCategories: [
      'emergency repairs',
      'unforeseen regulatory fees',
      'statutory reserve fund'
    ]
  }
];

export const BOM_COMPONENT_CATEGORIES = [
  'Major Components',
  'Electrical & Wiring',
  'Mechanical Parts & Fabrication',
  'Labor/Vendor Payments',
  'Enclosure',
  'Miscellaneous'
] as const;

export const EMPLOYEE_CATEGORIES = [
  'Director',
  'Senior Manager',
  'Engineer',
  'Machine Operator',
  'Service Staff',
  'Computer Staff',
  'Heavy Labor',
  'Security',
  'Cook'
] as const;
