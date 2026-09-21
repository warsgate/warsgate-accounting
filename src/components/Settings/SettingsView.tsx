import React, { useState, useRef } from 'react';
import { 
  Settings, Building2, Phone, MapPin, Hash, ChevronRight, Save, Trash2, 
  AlertTriangle, FileText, CheckCircle2, Sparkles, RefreshCw, Database, 
  Download, Upload, FileSpreadsheet, HardDrive, Check, Copy, AlertCircle, 
  FileCheck, Layers, Terminal, ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  CompanyProfile, DocumentNumberingConfig, DocumentType, 
  AccountingDocument, Contact, ProductService, BankAccount, 
  ChartOfAccount, JournalEntry 
} from '../../types';
import { defaultNumberingConfig, previewDocumentNo } from '../../utils/numbering';
import { 
  initialBankAccounts, initialChartOfAccounts, initialJournalEntries,
  initialDocuments, initialContacts, initialProducts
} from '../../data/initialData';

interface SettingsViewProps {
  company: CompanyProfile;
  onUpdateCompany: (c: CompanyProfile) => void;
  numberingConfig?: DocumentNumberingConfig;
  onUpdateNumberingConfig?: (cfg: DocumentNumberingConfig) => void;
  documents?: AccountingDocument[];
  contacts?: Contact[];
  products?: ProductService[];
}

const DOCUMENT_LABELS: Record<DocumentType, { name: string; desc: string; category: string; badgeColor: string }> = {
  QUOTATION: { name: 'ใบเสนอราคา (Quotation)', desc: 'เอกสารเสนอราคาสินค้า/บริการให้ลูกค้า', category: 'รายรับ (Sales)', badgeColor: 'bg-sky-50 text-sky-700 border-sky-200' },
  INVOICE: { name: 'ใบแจ้งหนี้ (Invoice)', desc: 'เอกสารแจ้งยอดชำระและวางบิล', category: 'รายรับ (Sales)', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  TAX_INVOICE: { name: 'ใบกำกับภาษี (Tax Invoice)', desc: 'เอกสารใบกำกับภาษีขาย (VAT 7%)', category: 'รายรับ (Sales)', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  RECEIPT: { name: 'ใบเสร็จรับเงิน (Receipt)', desc: 'เอกสารยืนยันการรับชำระเงิน', category: 'รายรับ (Sales)', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DELIVERY_ORDER: { name: 'ใบส่งของชั่วคราว (Delivery Order)', desc: 'เอกสารส่งมอบสินค้า/ทดสอบระบบ', category: 'รายรับ (Sales)', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200' },
  PURCHASE_ORDER: { name: 'ใบสั่งซื้อ (Purchase Order)', desc: 'เอกสารสั่งซื้อสินค้า/บริการจากซัพพลายเออร์', category: 'รายจ่าย (Expenses)', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  PURCHASE_INVOICE: { name: 'ใบแจ้งหนี้ค่าใช้จ่าย (Purchase Invoice)', desc: 'เอกสารบันทึกค่าใช้จ่ายและใบกำกับภาษีซื้อ', category: 'รายจ่าย (Expenses)', badgeColor: 'bg-orange-50 text-orange-700 border-orange-200' },
  PAYMENT_VOUCHER: { name: 'ใบสำคัญจ่าย (Payment Voucher)', desc: 'เอกสารหลักฐานการจ่ายเงิน', category: 'รายจ่าย (Expenses)', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
  WHT_CERTIFICATE: { name: 'หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)', desc: 'เอกสารรับรองภาษีหัก ณ ที่จ่าย', category: 'ภาษี (Tax)', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  company,
  onUpdateCompany,
  numberingConfig: propNumberingConfig,
  onUpdateNumberingConfig,
  documents = initialDocuments,
  contacts = initialContacts,
  products = initialProducts
}) => {
  const [activeTab, setActiveTab] = useState<'company' | 'numbering' | 'backup' | 'danger'>('company');

  // Company Form State
  const [form, setForm] = useState<CompanyProfile>(company);
  const [companySaved, setCompanySaved] = useState(false);

  // Numbering Form State
  const [numbering, setNumbering] = useState<DocumentNumberingConfig>(() => {
    if (propNumberingConfig) return propNumberingConfig;
    const saved = localStorage.getItem('warsgate_doc_numbering');
    return saved ? JSON.parse(saved) : defaultNumberingConfig;
  });
  const [numberingSaved, setNumberingSaved] = useState(false);

  // Backup & Restore State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExcelExporting, setIsExcelExporting] = useState(false);
  const [restoreModalData, setRestoreModalData] = useState<any | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Clear data modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany(form);
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 3000);
  };

  const handleSaveNumbering = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('warsgate_doc_numbering', JSON.stringify(numbering));
    if (onUpdateNumberingConfig) {
      onUpdateNumberingConfig(numbering);
    }
    setNumberingSaved(true);
    setTimeout(() => setNumberingSaved(false), 3000);
  };

  const handleNumberingFieldChange = (
    type: DocumentType,
    field: keyof DocumentNumberingConfig[DocumentType],
    value: any
  ) => {
    setNumbering(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleResetNumberingToDefault = () => {
    setNumbering(defaultNumberingConfig);
    localStorage.setItem('warsgate_doc_numbering', JSON.stringify(defaultNumberingConfig));
    if (onUpdateNumberingConfig) {
      onUpdateNumberingConfig(defaultNumberingConfig);
    }
  };

  const handleClearAllData = () => {
    localStorage.removeItem('warsgate_documents');
    localStorage.removeItem('warsgate_contacts');
    localStorage.removeItem('warsgate_products');
    localStorage.removeItem('warsgate_company');
    localStorage.removeItem('warsgate_doc_numbering');
    localStorage.removeItem('warsgate_deleted_doc_ids');
    localStorage.removeItem('warsgate_deleted_contact_ids');
    localStorage.removeItem('warsgate_deleted_product_ids');
    setShowClearConfirm(false);
    window.location.reload();
  };

  // ─── BACKUP FUNCTIONS ──────────────────────────────────────────────────────

  const getBackupPayload = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const timestampIso = `${dateStr}T${timeStr}+07:00`;

    return {
      version: '1.0.0',
      backupDate: timestampIso,
      appName: 'WARSGATE Accounting System',
      metadata: {
        documentsCount: documents.length,
        contactsCount: contacts.length,
        productsCount: products.length,
        chartOfAccountsCount: initialChartOfAccounts.length,
        journalEntriesCount: initialJournalEntries.length,
        bankAccountsCount: initialBankAccounts.length,
      },
      company: form,
      numberingConfig: numbering,
      bankAccounts: initialBankAccounts,
      contacts: contacts,
      products: products,
      documents: documents,
      chartOfAccounts: initialChartOfAccounts,
      journalEntries: initialJournalEntries,
    };
  };

  const handleDownloadJsonBackup = () => {
    setIsExporting(true);
    try {
      const payload = getBackupPayload();
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      const a = document.createElement('a');
      a.href = url;
      a.download = `warsgate_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadExcelBackup = () => {
    setIsExcelExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet: Company
      const companyData = [
        { 'หัวข้อ': 'ชื่อบริษัท (ไทย)', 'ข้อมูล': form.name },
        { 'หัวข้อ': 'ชื่อบริษัท (English)', 'ข้อมูล': form.nameEn || '' },
        { 'หัวข้อ': 'เลขประจำตัวผู้เสียภาษี', 'ข้อมูล': form.taxId },
        { 'หัวข้อ': 'สาขา', 'ข้อมูล': form.branchCode },
        { 'หัวข้อ': 'ที่อยู่', 'ข้อมูล': form.address },
        { 'หัวข้อ': 'เบอร์โทร', 'ข้อมูล': form.phone },
        { 'หัวข้อ': 'อีเมล', 'ข้อมูล': form.email },
        { 'หัวข้อ': 'เว็บไซต์', 'ข้อมูล': form.website },
        { 'หัวข้อ': 'ผู้มีอำนาจลงนาม', 'ข้อมูล': form.authorizedSignatory },
        { 'หัวข้อ': 'ตำแหน่ง', 'ข้อมูล': form.signatoryPosition || '' },
      ];
      const wsCompany = XLSX.utils.json_to_sheet(companyData);
      XLSX.utils.book_append_sheet(wb, wsCompany, 'Company');

      // Sheet: Contacts
      const contactsData = contacts.map(c => ({
        'ID': c.id,
        'ประเภท': c.type === 'CUSTOMER' ? 'ลูกค้า (Customer)' : 'ซัพพลายเออร์ (Supplier)',
        'ชื่อผู้ติดต่อ': c.name,
        'ชื่อบริษัท/องค์กร': c.companyName,
        'เลขประจำตัวผู้เสียภาษี': c.taxId,
        'สาขา': c.branchCode || 'สำนักงานใหญ่',
        'ที่อยู่': c.address,
        'เบอร์โทรศัพท์': c.phone,
        'อีเมล': c.email,
        'เครดิตเทอม (วัน)': c.creditDays,
        'จำนวนธุรกรรม': c.totalTransactions || 0,
        'ยอดคงค้าง (บาท)': c.balanceDue || 0,
      }));
      const wsContacts = XLSX.utils.json_to_sheet(contactsData);
      XLSX.utils.book_append_sheet(wb, wsContacts, 'Contacts');

      // Sheet: Products
      const productsData = products.map(p => ({
        'ID': p.id,
        'รหัสสินค้า': p.code,
        'ชื่อสินค้า/บริการ': p.name,
        'ประเภท': p.type,
        'หมวดหมู่': p.category,
        'หน่วยนับ': p.unit,
        'ราคาขาย (บาท)': p.unitPrice,
        'ราคาทุน (บาท)': p.costPrice || 0,
        'จำนวนคงเหลือ': p.stockQty,
        'จุดเตือนสั่งซื้อ': p.minStockAlert,
        'รายละเอียด': p.description || '',
      }));
      const wsProducts = XLSX.utils.json_to_sheet(productsData);
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');

      // Sheet: Documents Summary
      const docsData = documents.map(d => ({
        'ID': d.id,
        'ประเภทเอกสาร': d.type,
        'เลขที่เอกสาร': d.documentNo,
        'วันที่ออกเอกสาร': d.issueDate,
        'วันครบกำหนด': d.dueDate || '',
        'ชื่อลูกค้า/ซัพพลายเออร์': d.contactName,
        'เลขประจำตัวผู้เสียภาษี': d.contactTaxId,
        'ที่อยู่คู่ค้า': d.contactAddress,
        'ยอดก่อนภาษี (Subtotal)': d.subtotal,
        'ภาษีมูลค่าเพิ่ม (VAT 7%)': d.vatAmount,
        'ยอดรวมทั้งสิ้น (Grand Total)': d.grandTotal,
        'หัก ณ ที่จ่าย (WHT)': d.whtAmount || 0,
        'ยอดชำระสุทธิ (Net Total)': d.netTotal || d.grandTotal,
        'สถานะ': d.status,
        'เลขอ้างอิง (Ref No)': d.referenceNo || '',
        'หมายเหตุ': d.notes || '',
      }));
      const wsDocs = XLSX.utils.json_to_sheet(docsData);
      XLSX.utils.book_append_sheet(wb, wsDocs, 'Documents');

      // Sheet: Document Items Detail
      const docItemsData: any[] = [];
      documents.forEach(d => {
        (d.items || []).forEach((item, idx) => {
          docItemsData.push({
            'เลขที่เอกสาร': d.documentNo,
            'ประเภทเอกสาร': d.type,
            'วันที่': d.issueDate,
            'ลูกค้า/คู่ค้า': d.contactName,
            'ลำดับที่': idx + 1,
            'รหัสสินค้า': item.productCode || '',
            'ชื่อรายการสินค้า/บริการ': item.description,
            'จำนวน': item.quantity,
            'หน่วย': item.unit || '',
            'ราคาต่อหน่วย': item.unitPrice,
            'ส่วนลด (บาท)': item.discount || 0,
            'จำนวนเงิน (บาท)': item.total,
          });
        });
      });
      const wsDocItems = XLSX.utils.json_to_sheet(docItemsData);
      XLSX.utils.book_append_sheet(wb, wsDocItems, 'Doc_Items');

      // Sheet: Chart of Accounts
      const coaData = initialChartOfAccounts.map(c => ({
        'รหัสบัญชี': c.code,
        'ชื่อบัญชี': c.name,
        'หมวดบัญชี': c.category,
        'ประเภทเดบิต/เครดิตปกติ': c.normalBalance,
        'คำอธิบาย': c.description || '',
      }));
      const wsCoa = XLSX.utils.json_to_sheet(coaData);
      XLSX.utils.book_append_sheet(wb, wsCoa, 'ChartOfAccounts');

      // Sheet: Journal Entries
      const jvData: any[] = [];
      initialJournalEntries.forEach(j => {
        (j.entries || []).forEach((entry, idx) => {
          jvData.push({
            'เลขที่ใบสำคัญ': j.entryNo,
            'วันที่': j.date,
            'คำอธิบายรายการ': j.description,
            'เอกสารอ้างอิง': j.referenceNo || '',
            'ลำดับ': idx + 1,
            'รหัสบัญชี': entry.accountCode,
            'ชื่อบัญชี': entry.accountName,
            'เดบิต (Debit)': entry.debit || 0,
            'เครดิต (Credit)': entry.credit || 0,
          });
        });
      });
      const wsJv = XLSX.utils.json_to_sheet(jvData);
      XLSX.utils.book_append_sheet(wb, wsJv, 'JournalEntries');

      // Sheet: Bank Accounts
      const bankData = initialBankAccounts.map(b => ({
        'ID': b.id,
        'ธนาคาร': b.bankName,
        'ชื่อบัญชี': b.accountName,
        'เลขที่บัญชี': b.accountNo,
        'สาขา': b.branch,
        'ประเภทบัญชี': b.accountType,
        'ยอดเงินคงเหลือ': b.balance,
        'บัญชีหลัก': b.isDefault ? 'ใช่ (Default)' : 'ไม่ใช่',
      }));
      const wsBank = XLSX.utils.json_to_sheet(bankData);
      XLSX.utils.book_append_sheet(wb, wsBank, 'BankAccounts');

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      XLSX.writeFile(wb, `warsgate_accounting_backup_${dateStr}.xlsx`);
    } catch (err) {
      console.error('Excel Export error:', err);
    } finally {
      setIsExcelExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation check
        if (!parsed || (!parsed.documents && !parsed.company && !parsed.contacts)) {
          throw new Error('โครงสร้างไฟล์ไม่ถูกต้อง หรือไม่ใช่ไฟล์สำรองข้อมูลของระบบ WARSGATE');
        }

        setRestoreModalData(parsed);
      } catch (err: any) {
        setRestoreError(err.message || 'ไม่สามารถอ่านไฟล์สำรองได้ กรุณาตรวจสอบว่าเป็นไฟล์ JSON ที่ถูกต้อง');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setRestoreError('เกิดข้อผิดพลาดในการอ่านไฟล์');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!restoreModalData) return;

    try {
      if (restoreModalData.documents) {
        localStorage.setItem('warsgate_documents', JSON.stringify(restoreModalData.documents));
      }
      if (restoreModalData.contacts) {
        localStorage.setItem('warsgate_contacts', JSON.stringify(restoreModalData.contacts));
      }
      if (restoreModalData.products) {
        localStorage.setItem('warsgate_products', JSON.stringify(restoreModalData.products));
      }
      if (restoreModalData.company) {
        localStorage.setItem('warsgate_company', JSON.stringify(restoreModalData.company));
        onUpdateCompany(restoreModalData.company);
      }
      if (restoreModalData.numberingConfig) {
        localStorage.setItem('warsgate_doc_numbering', JSON.stringify(restoreModalData.numberingConfig));
        if (onUpdateNumberingConfig) {
          onUpdateNumberingConfig(restoreModalData.numberingConfig);
        }
      }

      // Reset any deletion tracking keys so restored items appear cleanly
      localStorage.removeItem('warsgate_deleted_doc_ids');
      localStorage.removeItem('warsgate_deleted_contact_ids');
      localStorage.removeItem('warsgate_deleted_product_ids');

      setRestoreSuccess(true);
      setTimeout(() => {
        setRestoreModalData(null);
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setRestoreError('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const navItems = [
    { id: 'company' as const, label: 'ข้อมูลองค์กร & บริษัท', icon: Building2, subtitle: 'Tax ID, ที่อยู่, ผู้มีอำนาจลงนาม' },
    { id: 'numbering' as const, label: 'การตั้งค่าเลขที่เอกสารรัน', icon: Hash, subtitle: 'กำหนด Prefix, รูปแบบวันที่, ลำดับรัน' },
    { id: 'backup' as const, label: 'สำรอง & กู้คืนฐานข้อมูล', icon: Database, subtitle: 'ดาวน์โหลด JSON/Excel ป้องกันเซิร์ฟเวอร์ปิด' },
    { id: 'danger' as const, label: 'จัดการฐานข้อมูล & ล้างระบบ', icon: AlertTriangle, subtitle: 'รีเซ็ตข้อมูลทดสอบทั้งหมด' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-500" />
          <span>การตั้งค่าระบบ (System Settings)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">จัดการข้อมูลบริษัท, เลขประจำตัวผู้เสียภาษี, การสำรองฐานข้อมูล และการตั้งค่าเลขรันเอกสารบัญชี</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Nav */}
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition ${
                  isActive
                    ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition ${
                    isActive ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`block text-xs font-bold ${isActive ? 'text-rose-700' : 'text-slate-700'}`}>
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {item.subtitle}
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-rose-400' : 'text-slate-300'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-3">

          {/* ─── TAB 1: Company Profile ────────────────────────────────────── */}
          {activeTab === 'company' && (
            <div className="glass-panel p-6 rounded-3xl space-y-6">

              {/* Preview Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 flex items-center gap-5 text-white shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30 p-1">
                  <img src="/warsgate-logo-white.png" alt="WARSGATE" className="h-12 w-auto object-contain" />
                </div>
                <div>
                  <h2 className="font-bold text-base">{form.name}</h2>
                  <p className="text-xs text-rose-100 mt-0.5">{form.address}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-rose-100">
                    <span>Tax ID: {form.taxId}</span>
                    <span>|</span>
                    <span>{form.phone}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                    ชื่อบริษัท / กิจการ (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-semibold focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    ชื่อบริษัท (English)
                  </label>
                  <input
                    type="text"
                    value={form.nameEn || ''}
                    onChange={e => setForm({ ...form, nameEn: e.target.value })}
                    placeholder="WARSGATE CO., LTD."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-semibold focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                    ที่อยู่สำนักงานใหญ่ / สำหรับออกใบกำกับภาษี
                  </label>
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 resize-none focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1.5">
                      <Hash className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                      เลขประจำตัวผู้เสียภาษี 13 หลัก
                    </label>
                    <input
                      type="text"
                      value={form.taxId}
                      onChange={e => setForm({ ...form, taxId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono font-bold focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1.5">รหัสสาขา</label>
                    <input
                      type="text"
                      value={form.branchCode}
                      onChange={e => setForm({ ...form, branchCode: e.target.value })}
                      placeholder="00000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1.5">
                      ผู้มีอำนาจลงนาม (MD / Managing Director)
                    </label>
                    <input
                      type="text"
                      value={form.authorizedSignatory}
                      onChange={e => setForm({ ...form, authorizedSignatory: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1.5">
                      <Phone className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    {companySaved && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        บันทึกข้อมูลเรียบร้อยแล้ว ✓
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-100 flex items-center gap-2 transition active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>บันทึกการตั้งค่าองค์กร</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ─── TAB 2: Document Numbering Configuration ────────────────────── */}
          {activeTab === 'numbering' && (
            <div className="glass-panel p-6 rounded-3xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-rose-600" />
                    <span>การตั้งค่าเลขที่เอกสารรันอัตโนมัติ (Document Running Number)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    กำหนดรูปแบบคำนำหน้า, รูปแบบวันที่, จำนวนหลัก, และลำดับเลขที่เริ่มต้นสำหรับเอกสารแต่ละประเภท
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetNumberingToDefault}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition"
                  title="รีเซ็ตเป็นค่าเริ่มต้น"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>คืนค่าเริ่มต้น</span>
                </button>
              </div>

              <form onSubmit={handleSaveNumbering} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Object.keys(DOCUMENT_LABELS) as DocumentType[]).map((type) => {
                    const info = DOCUMENT_LABELS[type];
                    const cfg = numbering[type] || defaultNumberingConfig[type];
                    const preview = previewDocumentNo(cfg);

                    return (
                      <div
                        key={type}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-slate-800 text-xs">{info.name}</div>
                            <span className="text-[10px] text-slate-400 block">{info.desc}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${info.badgeColor}`}>
                            {info.category}
                          </span>
                        </div>

                        {/* Live Preview Display */}
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" /> ตัวอย่างเลขที่:
                          </span>
                          <span className="font-mono font-bold text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {preview}
                          </span>
                        </div>

                        {/* Configuration Inputs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">คำนำหน้า (Prefix)</label>
                            <input
                              type="text"
                              value={cfg.prefix}
                              onChange={e => handleNumberingFieldChange(type, 'prefix', e.target.value)}
                              placeholder="QT"
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-mono font-bold text-slate-800 text-center focus:outline-none focus:border-rose-400"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">รูปแบบวันที่</label>
                            <select
                              value={cfg.dateFormat}
                              onChange={e => handleNumberingFieldChange(type, 'dateFormat', e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 text-center focus:outline-none focus:border-rose-400"
                            >
                              <option value="YYYYMM">202608 (YYYYMM)</option>
                              <option value="YYMM">2608 (YYMM)</option>
                              <option value="YYYY">2026 (YYYY)</option>
                              <option value="NONE">ไม่มีวันที่</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">จำนวนหลัก</label>
                            <select
                              value={cfg.digits}
                              onChange={e => handleNumberingFieldChange(type, 'digits', Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 text-center focus:outline-none focus:border-rose-400"
                            >
                              <option value={3}>3 หลัก (001)</option>
                              <option value={4}>4 หลัก (0001)</option>
                              <option value={5}>5 หลัก (00001)</option>
                              <option value={6}>6 หลัก (000001)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">เลขถัดไป</label>
                            <input
                              type="number"
                              min={1}
                              value={cfg.nextNumber}
                              onChange={e => handleNumberingFieldChange(type, 'nextNumber', Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-mono font-bold text-slate-800 text-center focus:outline-none focus:border-rose-400"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    {numberingSaved && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        บันทึกการตั้งค่าเลขรันเอกสารเรียบร้อยแล้ว ✓
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-100 flex items-center gap-2 transition active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>บันทึกการตั้งค่าเลขรันเอกสาร</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ─── TAB 3: Backup & Restore ───────────────────────────────────── */}
          {activeTab === 'backup' && (
            <div className="glass-panel p-6 rounded-3xl space-y-6">
              
              {/* Header */}
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Database className="w-5 h-5 text-rose-600" />
                  <span>สำรองข้อมูล & กู้คืนระบบ (Database Backup & Disaster Recovery)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  ดาวน์โหลดสำเนาฐานข้อมูลทั้งหมดเก็บไว้บนเครื่องคอมพิวเตอร์ของคุณ เพื่อความปลอดภัยสูงสุดและป้องกันข้อมูลสูญหายกรณีเซิร์ฟเวอร์ขัดข้อง
                </p>
              </div>

              {/* Database Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 block">เอกสารทั้งหมด</span>
                  <div className="text-xl font-black text-slate-800 mt-1">{documents.length} <span className="text-xs font-normal text-slate-400">ฉบับ</span></div>
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
                    <ShieldCheck className="w-3 h-3" /> พร้อมสำรอง
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 block">รายชื่อลูกค้า & ซัพพลายเออร์</span>
                  <div className="text-xl font-black text-slate-800 mt-1">{contacts.length} <span className="text-xs font-normal text-slate-400">ราย</span></div>
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
                    <ShieldCheck className="w-3 h-3" /> ยอดคงเหลือครบถ้วน
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 block">รายการสินค้า & คลัง</span>
                  <div className="text-xl font-black text-slate-800 mt-1">{products.length} <span className="text-xs font-normal text-slate-400">รายการ</span></div>
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
                    <ShieldCheck className="w-3 h-3" /> ราคาทุน/ราคาขาย
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 block">ผังบัญชี & สมุดรายวัน</span>
                  <div className="text-xl font-black text-slate-800 mt-1">{initialChartOfAccounts.length} <span className="text-xs font-normal text-slate-400">หมวด</span></div>
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
                    <ShieldCheck className="w-3 h-3" /> รองรับสรรพากร
                  </span>
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. JSON Backup */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-100 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-3 shadow-md shadow-rose-200">
                      <Download className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">1. ดาวน์โหลดไฟล์สำรองข้อมูล (JSON Snapshot)</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      ส่งออกข้อมูลทั้งหมดในรูปแบบไฟล์ JSON สำหรับใช้กู้คืนระบบ (Restore) หรือย้ายข้อมูลไปยังเครื่องอื่นได้อย่างสมบูรณ์แบบ 100%
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadJsonBackup}
                    disabled={isExporting}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-rose-100 active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExporting ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลดไฟล์สำรอง (.json)'}</span>
                  </button>
                </div>

                {/* 2. Excel Backup */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-md shadow-emerald-200">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">2. ส่งออกฐานข้อมูลเป็น Excel (Multi-Sheet .xlsx)</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      แปลงข้อมูลทั้งหมดเป็นตาราง Excel แยก Sheet ชัดเจน (ลูกค้า, สินค้า, เอกสาร, รายการสินค้าย่อย, ผังบัญชี) เหมาะสำหรับเปิดดูหรือรายงานผู้บริหาร
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadExcelBackup}
                    disabled={isExcelExporting}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-emerald-100 active:scale-95 disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{isExcelExporting ? 'กำลังสร้าง Excel...' : 'ดาวน์โหลดฐานข้อมูล Excel (.xlsx)'}</span>
                  </button>
                </div>

              </div>

              {/* Restore Section */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">กู้คืนระบบจากไฟล์สำรอง (Restore from JSON Backup)</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        เลือกไฟล์ <code className="bg-white px-1.5 py-0.5 rounded border text-slate-700 font-mono text-[11px]">warsgate_backup_*.json</code> เพื่อนำเข้าและกู้คืนข้อมูลเอกสารและตั้งค่าทั้งหมด
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition shrink-0 shadow-md shadow-indigo-100 active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>เลือกไฟล์สำรองเพื่อกู้คืน</span>
                  </button>
                </div>

                {restoreError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{restoreError}</span>
                  </div>
                )}
              </div>

              {/* Local Folder & Terminal Commands Guidance */}
              <div className="p-5 rounded-2xl bg-slate-900 text-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-white">ตำแหน่งไฟล์สำรองในเครื่อง (Local Storage Path)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">backups/</span>
                </div>

                <p className="text-xs text-slate-400">
                  ระบบได้บันทึกไฟล์สำรองข้อมูลไว้ในโฟลเดอร์เครื่องของคุณโดยตรงที่: <br />
                  <span className="font-mono text-rose-300 text-[11px] block mt-1 bg-black/40 p-2 rounded-lg border border-slate-800">
                    โปรแกรม บัญชี/backups/warsgate_backup_latest.json
                  </span>
                </p>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">คำสั่ง Terminal อัตโนมัติ:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">คำสั่งสำรองข้อมูล</span>
                        <code className="text-xs font-mono text-emerald-400 font-bold">npm run backup</code>
                      </div>
                      <button
                        onClick={() => copyToClipboard('npm run backup', 'cmd-backup')}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition"
                        title="Copy command"
                      >
                        {copiedCmd === 'cmd-backup' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">คำสั่งตรวจสอบไฟล์สำรอง</span>
                        <code className="text-xs font-mono text-emerald-400 font-bold">npm run restore</code>
                      </div>
                      <button
                        onClick={() => copyToClipboard('npm run restore', 'cmd-restore')}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition"
                        title="Copy command"
                      >
                        {copiedCmd === 'cmd-restore' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ─── TAB 4: Danger Zone ────────────────────────────────────────── */}
          {activeTab === 'danger' && (
            <div className="glass-panel p-6 rounded-3xl space-y-6">
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-900">ล้างข้อมูลทั้งหมดในระบบ (Reset All Data)</h3>
                    <p className="text-xs text-rose-600 mt-0.5">
                      ลบข้อมูลเอกสาร, ผู้ติดต่อ, และรายการสินค้าทั้งหมดออกจากเบราว์เซอร์ และโหลดข้อมูลตั้งต้นใหม่
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>ล้างข้อมูลในระบบทิ้งทั้งหมด</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {restoreModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ตรวจสอบไฟล์สำรองข้อมูล (Restore Verification)</h3>
                <p className="text-xs text-slate-400 mt-0.5">พบข้อมูลที่พร้อมสำหรับการกู้คืนระบบ</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">วันที่สร้างสำรอง:</span>
                  <span className="font-bold text-slate-800">{restoreModalData.backupDate || 'ไม่ระบุ'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ชื่อบริษัท:</span>
                  <span className="font-bold text-slate-800">{restoreModalData.company?.name || form.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">เลขประจำตัวผู้เสียภาษี:</span>
                  <span className="font-bold font-mono text-slate-800">{restoreModalData.company?.taxId || form.taxId}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <span className="text-[10px] text-indigo-600 block">เอกสาร</span>
                  <span className="text-sm font-bold text-indigo-900">{restoreModalData.documents?.length || 0} ฉบับ</span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <span className="text-[10px] text-indigo-600 block">ผู้ติดต่อ</span>
                  <span className="text-sm font-bold text-indigo-900">{restoreModalData.contacts?.length || 0} ราย</span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <span className="text-[10px] text-indigo-600 block">สินค้าในคลัง</span>
                  <span className="text-sm font-bold text-indigo-900">{restoreModalData.products?.length || 0} รายการ</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                ⚠️ การกู้คืนจะอัปเดตข้อมูลเอกสารและผู้ติดต่อในเบราว์เซอร์ให้ตรงกับไฟล์สำรองนี้ และจะทำการรีเฟรชระบบอัตโนมัติ
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setRestoreModalData(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={restoreSuccess}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-100 transition active:scale-95 disabled:opacity-50"
              >
                {restoreSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>กู้คืนสำเร็จ! กำลังรีโหลด...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>ยืนยันการกู้คืนข้อมูลทันที</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยืนยันการล้างข้อมูลทั้งหมด?</h3>
                <p className="text-xs text-slate-400 mt-0.5">การดำเนินการนี้จะลบข้อมูลเอกสาร ผู้ติดต่อ และสินค้าทั้งหมด</p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              ⚠️ ข้อมูลที่ถูกลบจะไม่สามารถกู้คืนได้ ระบบจะทำการรีโหลดหน้าเว็บและเริ่มใหม่อีกครั้ง
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleClearAllData}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-100 transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันล้างข้อมูลทิ้งทั้งหมด</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
