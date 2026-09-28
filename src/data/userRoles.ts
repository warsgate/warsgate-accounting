import { UserProfile, UserRole } from '../types';

export const AVAILABLE_USER_PROFILES: UserProfile[] = [
  {
    id: 'user-md',
    name: 'จีระวัฒน์ ปรีชานุรักษ์',
    role: 'MD_ADMIN',
    roleTitle: 'Managing Director / Super Admin',
    email: 'warsgate.at@gmail.com',
    avatarColor: 'from-rose-500 to-rose-700',
    avatarInitials: 'จว',
    department: 'ผู้บริหารสูงสุด (Executive)',
    permissions: {
      canApprove: true,
      canViewPnL: true,
      canManageSettings: true,
      canEditBOM: true,
      canIssueInvoices: true,
      canIssuePO: true,
      canManageTax: true,
      canDeleteDocs: true,
    }
  },
  {
    id: 'user-pm',
    name: 'ธนกฤต ช่างกลออโตเมชั่น',
    role: 'ENGINEER_PM',
    roleTitle: 'Lead Automation Engineer / PM',
    email: 'engineer@warsgate.co.th',
    avatarColor: 'from-indigo-500 to-blue-700',
    avatarInitials: 'ธก',
    department: 'ฝ่ายวิศวกรรม & โครงการ (Engineering & PM)',
    permissions: {
      canApprove: false,
      canViewPnL: true,
      canManageSettings: false,
      canEditBOM: true,
      canIssueInvoices: false,
      canIssuePO: true,
      canManageTax: false,
      canDeleteDocs: false,
    }
  },
  {
    id: 'user-sales',
    name: 'ปิยะดา การค้า',
    role: 'SALES',
    roleTitle: 'Sales & Project Account Executive',
    email: 'sales@warsgate.co.th',
    avatarColor: 'from-sky-500 to-cyan-700',
    avatarInitials: 'ปด',
    department: 'ฝ่ายขาย & สัญญา (Sales & Contracts)',
    permissions: {
      canApprove: false,
      canViewPnL: false,
      canManageSettings: false,
      canEditBOM: false,
      canIssueInvoices: true,
      canIssuePO: false,
      canManageTax: false,
      canDeleteDocs: false,
    }
  },
  {
    id: 'user-procurement',
    name: 'สมชาย จัดหา',
    role: 'PURCHASING',
    roleTitle: 'Procurement Specialist',
    email: 'purchase@warsgate.co.th',
    avatarColor: 'from-amber-500 to-orange-700',
    avatarInitials: 'สช',
    department: 'ฝ่ายจัดซื้อ & สต็อก (Procurement & Inventory)',
    permissions: {
      canApprove: false,
      canViewPnL: false,
      canManageSettings: false,
      canEditBOM: true,
      canIssueInvoices: false,
      canIssuePO: true,
      canManageTax: false,
      canDeleteDocs: false,
    }
  },
  {
    id: 'user-acc',
    name: 'วราภรณ์ การเงิน',
    role: 'ACCOUNTANT',
    roleTitle: 'Senior Accountant & Tax Officer',
    email: 'finance@warsgate.co.th',
    avatarColor: 'from-emerald-500 to-teal-700',
    avatarInitials: 'วภ',
    department: 'ฝ่ายการเงิน & บัญชีภาษี (Finance & Accounting)',
    permissions: {
      canApprove: true,
      canViewPnL: true,
      canManageSettings: false,
      canEditBOM: false,
      canIssueInvoices: true,
      canIssuePO: true,
      canManageTax: true,
      canDeleteDocs: true,
    }
  }
];

export const ROLE_LABELS: Record<UserRole, { label: string; badgeColor: string; description: string }> = {
  MD_ADMIN: {
    label: 'กรรมการผู้จัดการ (MD / Admin)',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    description: 'สิทธิ์สูงสุด เข้าถึงทุกฟังก์ชัน อนุมัติเอกสาร ดูงบกำไรขาดทุน P&L จัดการสิทธิ์ระบบ'
  },
  ENGINEER_PM: {
    label: 'วิศวกร / PM (Engineering)',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    description: 'จัดการ Mechanical BOM, เช็คต้นทุน Cost Matrix, ติดตามงวดงานสัญญา, ออกใบสั่งซื้ออะไหล่'
  },
  SALES: {
    label: 'ฝ่ายขาย (Sales & Billing)',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    description: 'ออกใบเสนอราคา (Quotation), วางบิลตามงวดสัญญา (Milestone Invoice), ดูประวัติลูกค้า'
  },
  PURCHASING: {
    label: 'ฝ่ายจัดซื้อ (Purchasing)',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'ออกใบสั่งซื้อ (PO), จัดการซัพพลายเออร์, เช็คสต็อกสินค้า, นำเข้าพาร์ทจาก BOM'
  },
  ACCOUNTANT: {
    label: 'ฝ่ายบัญชี & การเงิน (Accountant)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'ออกใบกำกับภาษี/ใบเสร็จรับเงิน, ภาษี ภ.พ.30, 50 ทวิ, ติดตามอายุหนี้ AR/AP Aging'
  }
};
