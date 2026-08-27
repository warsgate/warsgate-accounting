import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, Pencil, Link2, FileText, ArrowRight } from 'lucide-react';
import { AccountingDocument, Contact, ProductService, DocumentType, DocumentItem, DocumentStatus, DocumentNumberingConfig } from '../types';
import { formatMoney } from '../utils/formatters';
import { defaultNumberingConfig, previewDocumentNo } from '../utils/numbering';

interface CreateDocumentModalProps {
  type: DocumentType;
  initialDocument?: AccountingDocument | null;
  fromDocument?: AccountingDocument | null;
  documents?: AccountingDocument[];
  numberingConfig?: DocumentNumberingConfig;
  contacts: Contact[];
  products: ProductService[];
  onClose: () => void;
  onSubmit: (doc: AccountingDocument) => void;
}

const DOCUMENT_TYPE_NAMES: Record<DocumentType, string> = {
  QUOTATION: 'ใบเสนอราคา (Quotation)',
  INVOICE: 'ใบแจ้งหนี้ (Invoice)',
  TAX_INVOICE: 'ใบกำกับภาษี (Tax Invoice)',
  RECEIPT: 'ใบเสร็จรับเงิน (Receipt)',
  PURCHASE_ORDER: 'ใบสั่งซื้อ (Purchase Order)',
  PURCHASE_INVOICE: 'ใบแจ้งหนี้ค่าใช้จ่าย (Purchase Invoice)',
  PAYMENT_VOUCHER: 'ใบสำคัญจ่าย (Payment Voucher)',
  WHT_CERTIFICATE: 'หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)',
};

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  type: initialType,
  initialDocument,
  fromDocument,
  documents = [],
  numberingConfig: propNumberingConfig,
  contacts,
  products,
  onClose,
  onSubmit
}) => {
  const isEdit = !!initialDocument;
  const [docType, setDocType] = useState<DocumentType>(
    initialDocument?.type || (fromDocument ? 'RECEIPT' : initialType)
  );
  const isPurchase = docType === 'PURCHASE_ORDER' || docType === 'PURCHASE_INVOICE' || docType === 'PAYMENT_VOUCHER';

  const numConfig: DocumentNumberingConfig = propNumberingConfig || (() => {
    const saved = localStorage.getItem('warsgate_doc_numbering');
    return saved ? JSON.parse(saved) : defaultNumberingConfig;
  })();

  const filteredContacts = contacts.filter(c => isPurchase ? c.type === 'SUPPLIER' : c.type === 'CUSTOMER');
  const defaultContactId =
    initialDocument?.contact?.id ||
    fromDocument?.contact?.id ||
    filteredContacts[0]?.id ||
    contacts[0]?.id ||
    '';

  const todayStr = new Date().toISOString().split('T')[0];
  const nextMonthStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [selectedContactId, setSelectedContactId] = useState<string>(defaultContactId);
  const [issueDate, setIssueDate] = useState<string>(initialDocument?.issueDate || todayStr);
  const [dueDate, setDueDate] = useState<string>(initialDocument?.dueDate || nextMonthStr);
  const [status, setStatus] = useState<DocumentStatus>(
    initialDocument?.status || (docType === 'RECEIPT' ? 'PAID' : 'PENDING')
  );

  const initialNotes = initialDocument?.notes !== undefined
    ? initialDocument.notes
    : fromDocument
    ? `รับชำระเงินตามใบแจ้งหนี้เลขที่ ${fromDocument.documentNo} (${fromDocument.contact?.companyName})`
    : 'กำหนดยอดชำระตามวงเงินเครดิต 30 วัน โอนเข้าบัญชี บจก. วอร์สเกต';

  const [notes, setNotes] = useState<string>(initialNotes);
  const [customDocNo, setCustomDocNo] = useState<string>(() => {
    if (initialDocument?.documentNo) return initialDocument.documentNo;
    if (fromDocument?.documentNo) {
      return fromDocument.documentNo
        .replace(/^INV-/, 'REC-')
        .replace(/^TAX-/, 'REC-')
        .replace(/^QT-/, 'INV-');
    }
    const setting = numConfig[docType] || defaultNumberingConfig[docType];
    return previewDocumentNo(setting, todayStr);
  });

  // When docType or issueDate changes and not in edit mode
  useEffect(() => {
    if (!isEdit && !fromDocument) {
      const setting = numConfig[docType] || defaultNumberingConfig[docType];
      setCustomDocNo(previewDocumentNo(setting, issueDate));
    }
  }, [docType, issueDate]);

  const [referencePoNo, setReferencePoNo] = useState<string>(
    initialDocument?.referencePoNo || fromDocument?.referencePoNo || ''
  );
  const [referenceDocNo, setReferenceDocNo] = useState<string>(
    initialDocument?.referenceDocNo || fromDocument?.documentNo || ''
  );

  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'CREDIT_CARD'>(
    initialDocument?.paymentMethod || 'BANK_TRANSFER'
  );
  const [bankAccount, setBankAccount] = useState<string>(
    initialDocument?.bankAccount || 'KBANK 089-2-54321-9 (บจก. วอร์สเกต)'
  );

  const defaultFirstItem: DocumentItem = {
    id: `item-${Date.now()}`,
    code: products[0]?.code || 'HW-001',
    name: products[0]?.name || 'รายการสินค้า / บริการ',
    description: products[0]?.description || '',
    quantity: 1,
    unit: products[0]?.unit || 'เครื่อง',
    pricePerUnit: products[0]?.unitPrice || 10000,
    discount: 0,
    amount: products[0]?.unitPrice || 10000,
    vatInclusive: false,
    withholdingTaxRate: products[0]?.type === 'SERVICE' ? 3 : 0,
  };

  const [items, setItems] = useState<DocumentItem[]>(() => {
    if (initialDocument?.items && initialDocument.items.length > 0) {
      return initialDocument.items;
    }
    if (fromDocument?.items && fromDocument.items.length > 0) {
      return fromDocument.items.map(i => ({
        ...i,
        id: `item-${Date.now()}-${Math.random()}`
      }));
    }
    return [defaultFirstItem];
  });

  // Handle Quick Import from existing invoice / quotation
  const handleImportFromDocument = (sourceDocId: string) => {
    const src = documents.find(d => d.id === sourceDocId);
    if (!src) return;

    if (src.contact?.id) {
      setSelectedContactId(src.contact.id);
    }
    if (src.items && src.items.length > 0) {
      setItems(src.items.map(i => ({
        ...i,
        id: `item-${Date.now()}-${Math.random()}`
      })));
    }
    if (src.referencePoNo) {
      setReferencePoNo(src.referencePoNo);
    }
    if (src.documentNo) {
      setReferenceDocNo(src.documentNo);
    }
    if (docType === 'RECEIPT') {
      setStatus('PAID');
      setNotes(`รับชำระเงินตามใบแจ้งหนี้เลขที่ ${src.documentNo} (${src.contact?.companyName})`);
      setCustomDocNo(src.documentNo.replace(/^INV-/, 'REC-').replace(/^TAX-/, 'REC-'));
    } else if (docType === 'INVOICE') {
      setNotes(`อ้างอิงใบเสนอราคาเลขที่ ${src.documentNo}`);
      setCustomDocNo(src.documentNo.replace(/^QT-/, 'INV-'));
    }
  };

  // ── Item Actions ───────────────────────────────────────────────────────────
  const handleAddItem = () => {
    const firstProd = products[0];
    const newItem: DocumentItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      code: firstProd?.code || 'HW-NEW',
      name: firstProd?.name || 'รายการสินค้าใหม่',
      description: firstProd?.description || '',
      quantity: 1,
      unit: firstProd?.unit || 'ชิ้น',
      pricePerUnit: firstProd?.unitPrice || 1000,
      discount: 0,
      amount: firstProd?.unitPrice || 1000,
      vatInclusive: false,
      withholdingTaxRate: firstProd?.type === 'SERVICE' ? 3 : 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  const handleItemProductSelect = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    const newItems = [...items];
    const qty = newItems[index].quantity || 1;
    const disc = newItems[index].discount || 0;
    newItems[index] = {
      ...newItems[index],
      code: prod.code,
      name: prod.name,
      description: prod.description || '',
      unit: prod.unit || 'ชิ้น',
      pricePerUnit: prod.unitPrice,
      amount: Math.max(0, qty * prod.unitPrice - disc),
      withholdingTaxRate: prod.type === 'SERVICE' ? 3 : 0,
    };
    setItems(newItems);
  };

  const handleItemFieldChange = (index: number, field: keyof DocumentItem, value: any) => {
    const newItems = [...items];
    const current = { ...newItems[index], [field]: value };
    const qty = Number(current.quantity) || 0;
    const price = Number(current.pricePerUnit) || 0;
    const disc = Number(current.discount) || 0;
    current.amount = Math.max(0, qty * price - disc);
    newItems[index] = current;
    setItems(newItems);
  };

  // ── Financial Calculations ────────────────────────────────────────────────
  const subtotal = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const discountTotal = items.reduce((sum, i) => sum + (Number(i.discount) || 0), 0);
  const vatAmount = subtotal * 0.07;
  const grandTotal = subtotal + vatAmount;

  const withholdingTaxTotal = items.reduce((sum, i) => {
    const rate = Number(i.withholdingTaxRate) || 0;
    if (rate > 0) {
      return sum + (Number(i.amount) || 0) * (rate / 100);
    }
    return sum;
  }, 0);

  const netPayment = grandTotal - withholdingTaxTotal;

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const contact = contacts.find(c => c.id === selectedContactId) || contacts[0] || {
      id: 'unknown',
      name: 'ลูกค้าทั่วไป',
      companyName: 'ลูกค้าทั่วไป',
      taxId: '0000000000000',
      isBranch: false,
      branchCode: '00000',
      address: '-',
      phone: '-',
      email: '-',
      type: isPurchase ? 'SUPPLIER' : 'CUSTOMER',
      creditDays: 30,
      totalTransactions: 0,
      balanceDue: 0,
    };

    if (isEdit && initialDocument) {
      const updatedDoc: AccountingDocument = {
        ...initialDocument,
        documentNo: customDocNo || initialDocument.documentNo,
        type: docType,
        issueDate,
        dueDate,
        referencePoNo: referencePoNo.trim() || undefined,
        referenceDocNo: referenceDocNo.trim() || undefined,
        contact,
        items,
        subtotal,
        discountTotal,
        vatRate: 7,
        vatAmount,
        grandTotal,
        withholdingTaxTotal,
        netPayment,
        status,
        notes,
        paymentMethod: docType === 'RECEIPT' ? paymentMethod : initialDocument.paymentMethod,
        bankAccount: docType === 'RECEIPT' ? bankAccount : initialDocument.bankAccount,
      };
      onSubmit(updatedDoc);
    } else {
      const setting = numConfig[docType] || defaultNumberingConfig[docType];
      const autoDocNo = previewDocumentNo(setting, issueDate);
      const docNo = customDocNo.trim() ? customDocNo.trim() : autoDocNo;

      // Auto increment next number in storage
      try {
        const updatedConfig = {
          ...numConfig,
          [docType]: {
            ...setting,
            nextNumber: (setting.nextNumber || 1) + 1
          }
        };
        localStorage.setItem('warsgate_doc_numbering', JSON.stringify(updatedConfig));
      } catch (err) {
        console.error('Error saving numbering config', err);
      }

      const newDoc: AccountingDocument = {
        id: `doc-${Date.now()}`,
        documentNo: docNo,
        type: docType,
        issueDate,
        dueDate,
        referencePoNo: referencePoNo.trim() || undefined,
        referenceDocNo: referenceDocNo.trim() || undefined,
        contact,
        items,
        subtotal,
        discountTotal,
        vatRate: 7,
        vatAmount,
        grandTotal,
        withholdingTaxTotal,
        netPayment,
        status,
        notes,
        paymentMethod: docType === 'RECEIPT' ? paymentMethod : undefined,
        bankAccount: docType === 'RECEIPT' ? bankAccount : undefined,
        createdByName: 'คุณจีระวัฒน์ (MD)',
      };
      onSubmit(newDoc);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">

        {/* ── Modal Header ──────────────────────────────────────────────────── */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isEdit
            ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white'
            : fromDocument
            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
            : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
              isEdit || fromDocument ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}>
              {isEdit ? <Pencil className="w-4 h-4" /> : fromDocument ? <FileText className="w-4 h-4" /> : 'W'}
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isEdit
                  ? `แก้ไข: ${DOCUMENT_TYPE_NAMES[docType]} (${initialDocument.documentNo})`
                  : fromDocument
                  ? `ออกใบเสร็จรับเงิน (ดึงข้อมูลจาก ${fromDocument.documentNo})`
                  : `สร้าง ${DOCUMENT_TYPE_NAMES[docType]} ใหม่`}
              </h2>
              <span className={`text-[11px] ${isEdit || fromDocument ? 'text-white/80' : 'text-slate-400'}`}>
                บริษัท วอร์สเกต จำกัด (WARSGATE CO., LTD.)
              </span>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition ${
            isEdit || fromDocument ? 'text-white/80 hover:text-white hover:bg-white/10' : 'bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200'
          }`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Form Body ─────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">

          {/* ── Quick Import Banner from Invoices (When creating or if not fromDocument) ── */}
          {!isEdit && documents.filter(d => ['INVOICE', 'TAX_INVOICE', 'QUOTATION'].includes(d.type)).length > 0 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-xs">🔗 ดึงข้อมูลอัตโนมัติจากใบแจ้งหนี้ / ใบเสนอราคา</div>
                  <div className="text-[10px] text-slate-500">เลือกเอกสารต้นทางเพื่อคัดลอกลูกค้า รายการสินค้า และยอดเงินทันที</div>
                </div>
              </div>
              <select
                onChange={(e) => handleImportFromDocument(e.target.value)}
                defaultValue={fromDocument?.id || ''}
                className="w-full sm:w-auto bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
              >
                <option value="">-- เลือกใบแจ้งหนี้เพื่อดึงข้อมูล --</option>
                {documents
                  .filter(d => ['INVOICE', 'TAX_INVOICE', 'QUOTATION'].includes(d.type))
                  .map(d => (
                    <option key={d.id} value={d.id}>
                      {d.documentNo} - {d.contact?.companyName} ({formatMoney(d.grandTotal)})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Doc Type, Doc No, Status, Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">ประเภทเอกสาร</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value as DocumentType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-rose-400"
              >
                <option value="QUOTATION">ใบเสนอราคา (QT)</option>
                <option value="INVOICE">ใบแจ้งหนี้ (INV)</option>
                <option value="TAX_INVOICE">ใบกำกับภาษี (TAX)</option>
                <option value="RECEIPT">ใบเสร็จรับเงิน (REC)</option>
                <option value="PURCHASE_ORDER">ใบสั่งซื้อ (PO)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                เลขที่เอกสาร <span className="text-[10px] text-slate-400 font-normal">(เว้นว่างเพื่อ Auto)</span>
              </label>
              <input
                type="text"
                value={customDocNo}
                onChange={e => setCustomDocNo(e.target.value)}
                placeholder="เช่น REC-2505-005/1"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">สถานะเอกสาร</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as DocumentStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-rose-400"
              >
                <option value="PENDING">รอดำเนินการ / รอชำระ (Pending)</option>
                <option value="APPROVED">อนุมัติแล้ว (Approved)</option>
                <option value="PAID">ชำระเงินแล้ว (Paid)</option>
                <option value="OVERDUE">เกินกำหนด (Overdue)</option>
                <option value="CANCELLED">ยกเลิก (Cancelled)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">วันที่ออกเอกสาร *</label>
              <input
                required
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">วันครบกำหนดชำระ</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {/* ── Customer PO Ref & Internal Ref Row ───────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-rose-50/50 via-slate-50 to-sky-50/50 border border-slate-200">
            <div>
              <label className="block text-slate-700 font-bold text-xs mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>เลขที่ใบสั่งซื้อลูกค้า (Customer PO Ref No.)</span>
              </label>
              <input
                type="text"
                value={referencePoNo}
                onChange={e => setReferencePoNo(e.target.value)}
                placeholder="เช่น PO252155, 2505004, 2505005, 2605001"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold text-xs focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 shadow-sm"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                ระบุเลขที่ PO ของลูกค้า เพื่อแสดงและพิมพ์ลงในใบแจ้งหนี้ / ใบเสนอราคา
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-xs mb-1 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-sky-600" />
                <span>เลขที่เอกสารอ้างอิงภายใน (Internal Ref No.)</span>
              </label>
              <input
                type="text"
                value={referenceDocNo}
                onChange={e => setReferenceDocNo(e.target.value)}
                placeholder="เช่น QT-2505-005, CAP250095/"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 shadow-sm"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                เลขอ้างอิงใบเสนอราคา หรือเลขโครงการภายใน
              </span>
            </div>
          </div>

          {/* Contact Box */}
          <div className="glass-panel p-4 rounded-2xl">
            <label className="block text-slate-500 font-semibold mb-1.5">
              เลือก{isPurchase ? 'ซัพพลายเออร์ / ผู้จำหน่าย' : 'ลูกค้า / คู่ค้า'} *
            </label>
            <select
              value={selectedContactId}
              onChange={e => setSelectedContactId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:border-rose-400"
            >
              {contacts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.companyName} — {c.name} {c.taxId ? `(Tax ID: ${c.taxId})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items Table */}
          <div className="glass-panel p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">รายการสินค้า / ค่าบริการ</h3>
                <p className="text-[11px] text-slate-400">เลือกสินค้าสำเร็จรูปหรือพิมพ์กำหนดเองได้</p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มรายการ</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="grid grid-cols-12 gap-2 items-start">

                    {/* Quick Select from Inventory */}
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                        เลือกจากคลังสินค้า / บริการ
                      </label>
                      <select
                        onChange={e => handleItemProductSelect(idx, e.target.value)}
                        value={products.find(p => p.code === item.code)?.id || ''}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 text-xs focus:outline-none focus:border-rose-400"
                      >
                        <option value="">-- เลือกเพื่อกรอกอัตโนมัติ --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name} ({formatMoney(p.unitPrice)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Item Name */}
                    <div className="col-span-12 md:col-span-8">
                      <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                        ชื่อรายการ / รายละเอียดสินค้า *
                      </label>
                      <input
                        required
                        type="text"
                        value={item.name}
                        onChange={e => handleItemFieldChange(idx, 'name', e.target.value)}
                        placeholder="ชื่อสินค้าหรือบริการ..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 font-semibold text-xs focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>

                  {/* Quantity, Unit, Price, Discount, WHT, Total */}
                  <div className="grid grid-cols-12 gap-2 items-center pt-1 border-t border-slate-200/60">
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-[10px] text-slate-500 mb-0.5">จำนวน</label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => handleItemFieldChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-slate-800 font-mono font-bold text-center text-xs focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-[10px] text-slate-500 mb-0.5">หน่วย</label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={e => handleItemFieldChange(idx, 'unit', e.target.value)}
                        placeholder="เครื่อง/ชิ้น"
                        className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-slate-800 text-center text-xs focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-[10px] text-slate-500 mb-0.5">ราคา/หน่วย</label>
                      <input
                        type="number"
                        min={0}
                        value={item.pricePerUnit}
                        onChange={e => handleItemFieldChange(idx, 'pricePerUnit', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-slate-800 font-mono font-bold text-right text-xs focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-[10px] text-slate-500 mb-0.5">ส่วนลด (บาท)</label>
                      <input
                        type="number"
                        min={0}
                        value={item.discount || 0}
                        onChange={e => handleItemFieldChange(idx, 'discount', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-slate-800 font-mono text-right text-xs focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-[10px] text-slate-500 mb-0.5">หัก ณ ที่จ่าย</label>
                      <select
                        value={item.withholdingTaxRate || 0}
                        onChange={e => handleItemFieldChange(idx, 'withholdingTaxRate', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-slate-700 text-xs focus:outline-none focus:border-rose-400"
                      >
                        <option value={0}>ไม่มี (0%)</option>
                        <option value={1}>1% (ขนส่ง)</option>
                        <option value={2}>2% (โฆษณา)</option>
                        <option value={3}>3% (บริการ/ช่าง)</option>
                        <option value={5}>5% (ค่าเช่า)</option>
                      </select>
                    </div>

                    <div className="col-span-3 md:col-span-1 text-right">
                      <label className="block text-[10px] text-slate-500 mb-0.5">รวมเงิน</label>
                      <span className="font-mono font-bold text-emerald-600 text-xs block py-1">
                        {formatMoney(item.amount)}
                      </span>
                    </div>

                    <div className="col-span-1 text-right pt-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={items.length === 1}
                        className={`p-1.5 rounded-lg transition ${
                          items.length === 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title="ลบบรรทัด"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Receipt Payment Info (if RECEIPT) */}
          {docType === 'RECEIPT' && (
            <div className="glass-panel p-4 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-3 bg-amber-50/40 border-amber-200">
              <div>
                <label className="block text-amber-800 font-semibold mb-1">วิธีการชำระเงิน</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-amber-400"
                >
                  <option value="BANK_TRANSFER">โอนเงินผ่านธนาคาร (Bank Transfer)</option>
                  <option value="CASH">เงินสด (Cash)</option>
                  <option value="CHEQUE">เช็ค (Cheque)</option>
                  <option value="CREDIT_CARD">บัตรเครดิต (Credit Card)</option>
                </select>
              </div>
              <div>
                <label className="block text-amber-800 font-semibold mb-1">บัญชีธนาคารที่รับเงิน</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                  className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* Notes & Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-2xl space-y-2">
              <label className="block text-slate-500 font-semibold">หมายเหตุ / เงื่อนไขการชำระเงิน</label>
              <textarea
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="ระบุข้อความหรือเงื่อนไขเพิ่มเติมที่จะแสดงในเอกสาร..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 text-xs focus:outline-none focus:border-rose-400 resize-none"
              />
            </div>

            <div className="glass-panel p-4 rounded-2xl space-y-2 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">มูลค่าสินค้าก่อนภาษี:</span>
                <span className="font-semibold text-slate-800">{formatMoney(subtotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-rose-500">
                  <span>ส่วนลดรวม:</span>
                  <span>-{formatMoney(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">ภาษีมูลค่าเพิ่ม VAT 7%:</span>
                <span className="font-semibold text-slate-800">{formatMoney(vatAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-sm text-rose-600 border-b border-slate-100">
                <span>ยอดรวมทั้งสิ้น (Grand Total):</span>
                <span>{formatMoney(grandTotal)}</span>
              </div>
              {withholdingTaxTotal > 0 && (
                <div className="flex justify-between py-1 text-amber-600">
                  <span>หัก ภาษี ณ ที่จ่าย (WHT):</span>
                  <span>-{formatMoney(withholdingTaxTotal)}</span>
                </div>
              )}
              <div className="flex justify-between py-2.5 bg-emerald-50 border border-emerald-200 px-3.5 rounded-xl font-bold text-sm text-emerald-700">
                <span>ยอดชำระสุทธิ (Net Payment):</span>
                <span>{formatMoney(netPayment)}</span>
              </div>
            </div>
          </div>

          {/* ── Submit Action ─────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-white font-bold flex items-center gap-2 shadow-md transition active:scale-95 ${
                isEdit
                  ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-100'
                  : fromDocument
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-100'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isEdit
                  ? '💾 บันทึกการแก้ไขเอกสาร'
                  : fromDocument
                  ? '✓ ออกใบเสร็จรับเงินจากใบแจ้งหนี้นี้'
                  : '✓ บันทึกและออกเอกสาร'}
              </span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
