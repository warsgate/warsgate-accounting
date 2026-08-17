export type DocumentType = 
  | 'QUOTATION' 
  | 'INVOICE' 
  | 'TAX_INVOICE' 
  | 'RECEIPT' 
  | 'PURCHASE_ORDER' 
  | 'PURCHASE_INVOICE'
  | 'PAYMENT_VOUCHER'
  | 'WHT_CERTIFICATE';

export type DocumentStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface DocumentItem {
  id: string;
  code: string;
  name: string;
  description: string;
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
  description: string;
}

export interface AccountingDocument {
  id: string;
  documentNo: string;
  type: DocumentType;
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
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
  description: string;
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
