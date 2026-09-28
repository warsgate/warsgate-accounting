export type DocumentType = 
  | 'QUOTATION' 
  | 'INVOICE' 
  | 'TAX_INVOICE' 
  | 'RECEIPT' 
  | 'DELIVERY_ORDER'
  | 'PURCHASE_ORDER' 
  | 'PURCHASE_INVOICE'
  | 'PAYMENT_VOUCHER'
  | 'WHT_CERTIFICATE';

export type DocumentStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface DocumentItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  discount: number; // in percentage or flat
  amount: number; // (qty * price) - discount
  vatInclusive: boolean;
  withholdingTaxRate: number; // 0, 1, 2, 3, 5
}

export interface Contact {
  id: string;
  name: string;
  companyName: string;
  taxId: string;
  isBranch: boolean;
  branchCode: string; // e.g. "00000" (Head Office) or "00001"
  address: string;
  phone: string;
  email: string;
  type: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  creditDays: number;
  totalTransactions: number;
  balanceDue: number;
}

export interface ProductService {
  id: string;
  code: string;
  name: string;
  category: 'AUTOMATION_HARDWARE' | 'SOFTWARE' | 'ENGINEERING_SERVICE' | 'MAINTENANCE';
  type: 'PRODUCT' | 'SERVICE';
  unit: string;
  unitPrice: number;
  costPrice: number;
  stockQty: number;
  minStockAlert: number;
  description?: string;
}

export interface AccountingDocument {
  id: string;
  documentNo: string;
  type: DocumentType;
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  referencePoNo?: string;  // เลขที่ใบสั่งซื้อลูกค้า (Customer PO Ref No.)
  referenceDocNo?: string; // เลขที่เอกสารอ้างอิงภายใน (Internal Reference Doc No.)
  projectNote?: string;    // ชื่อโครงการ/งาน
  contact: Contact;
  items: DocumentItem[];
  subtotal: number;
  discountTotal: number;
  vatRate: number; // default 7%
  vatAmount: number;
  grandTotal: number;
  withholdingTaxTotal: number;
  netPayment: number;
  status: DocumentStatus;
  notes: string;
  paymentMethod?: 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'CREDIT_CARD';
  bankAccount?: string;
  createdByName: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNo: string;
  branch: string;
  accountType: 'SAVINGS' | 'CURRENT';
  balance: number;
  isDefault: boolean;
}

export interface CompanyProfile {
  name: string;
  nameEn: string;
  taxId: string;
  branchCode: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  authorizedSignatory: string;
  signatoryPosition: string;
}

export interface ChartOfAccount {
  code: string;
  name: string;
  category: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  type: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  jvNo: string;
  date: string;
  description?: string;
  referenceNo: string;
  entries: {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }[];
  status: 'POSTED' | 'DRAFT';
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  accountsReceivable: number; // AR (ยอดค้างรับ)
  accountsPayable: number;    // AP (ยอดค้างจ่าย)
  cashAndBankBalance: number;
  vatSalesTotal: number;
  vatPurchaseTotal: number;
  netVatToPay: number;
}

export interface DocumentNumberSetting {
  prefix: string;
  dateFormat: 'YYYYMM' | 'YYMM' | 'YYYY' | 'NONE';
  digits: number; // 3, 4, 5, 6
  nextNumber: number;
  separator: '-' | '/' | '';
}

export interface DocumentNumberingConfig {
  QUOTATION: DocumentNumberSetting;
  INVOICE: DocumentNumberSetting;
  TAX_INVOICE: DocumentNumberSetting;
  RECEIPT: DocumentNumberSetting;
  DELIVERY_ORDER: DocumentNumberSetting;
  PURCHASE_ORDER: DocumentNumberSetting;
  PURCHASE_INVOICE: DocumentNumberSetting;
  PAYMENT_VOUCHER: DocumentNumberSetting;
  WHT_CERTIFICATE: DocumentNumberSetting;
}

export interface BomPart {
  id: string;
  projectId: string;
  moduleId?: string;
  itemNo: number;
  dwgNo?: string;
  partName: string;
  typeSpec?: string;
  category?: string;
  partType?: string;
  qty: number;
  unit: string;
  maker?: string;
  supplier?: string;
  targetUnitPrice: number;
  unitPrice: number;
  totalAmount: number;
  poNumber?: string;
  storeLocation?: string;
  orderDate?: string;
  receiveDate?: string;
  status: string;
  remarks?: string;
}

export interface BomProject {
  id: string;
  code: string;
  name: string;
  customer?: string;
  customerId?: string;
  dwgNo?: string;
  targetBudget?: number;
  status?: string;
  totalPartsCount?: number;
  totalEstimatedCost?: number;
  suppliers?: string[];
  parts?: BomPart[];
  modules?: Array<{ id: string; code: string; name: string }>;
  updatedAt?: string;
}

// ─── Milestone Billing & Progressive Invoicing ─────────────────────────────
export type MilestoneStatus = 'WAITING' | 'INVOICED' | 'PAID';

export interface ProjectMilestone {
  id: string;
  milestoneNo: number;
  title: string;
  percentage: number;
  amount: number;
  dueDate?: string;
  status: MilestoneStatus;
  invoiceDocNo?: string;
  invoiceDocId?: string;
  notes?: string;
}

export interface ContractMilestonePlan {
  id: string;
  contractTitle: string;
  quotationId?: string;
  quotationDocNo?: string;
  referencePoNo?: string;
  projectCode?: string;
  projectName: string;
  customerContact: Contact;
  totalContractAmount: number;
  milestones: ProjectMilestone[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// ─── Multi-User Roles & Permissions & Audit Trail ─────────────────────────
export type UserRole = 
  | 'MD_ADMIN'      // กรรมการผู้จัดการ / ดูแลระบบสูงสุด
  | 'ENGINEER_PM'   // วิศวกรโครงการ / ผู้จัดการโครงการ
  | 'SALES'         // ฝ่ายขาย (ใบเสนอราคา, วางบิล)
  | 'PURCHASING'    // ฝ่ายจัดซื้อ (ใบสั่งซื้อ PO, ซัพพลายเออร์)
  | 'ACCOUNTANT';   // ฝ่ายบัญชีและการเงิน (ใบกำกับภาษี, ภาษี, AR/AP)

export interface UserPermissions {
  canApprove: boolean;
  canViewPnL: boolean;
  canManageSettings: boolean;
  canEditBOM: boolean;
  canIssueInvoices: boolean;
  canIssuePO: boolean;
  canManageTax: boolean;
  canDeleteDocs: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  email: string;
  avatarColor: string;
  avatarInitials: string;
  department: string;
  permissions: UserPermissions;
}

export type AuditAction = 
  | 'CREATE_DOC' 
  | 'UPDATE_DOC' 
  | 'DELETE_DOC' 
  | 'STATUS_CHANGE' 
  | 'SWITCH_ROLE' 
  | 'EXPORT_DATA' 
  | 'IMPORT_DATA' 
  | 'MILESTONE_INVOICE' 
  | 'SETTINGS_UPDATE';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  targetDocNo?: string;
  details: string;
  ipAddress?: string;
}



