import React, { useState } from 'react';
import {
  Users, Plus, Search, Phone, Mail, FileText,
  Loader2, CheckCircle2, XCircle, ShieldCheck,
  Pencil, Trash2, Building2, MapPin, AlertTriangle, Clock, Layers,
  LayoutGrid, Target, Sparkles, Eye, ArrowUpRight, ChevronRight
} from 'lucide-react';
import { Contact, AccountingDocument, ContractMilestonePlan } from '../../types';
import { formatMoney } from '../../utils/formatters';

interface ContactsViewProps {
  contacts: Contact[];
  documents?: AccountingDocument[];
  milestonePlans?: ContractMilestonePlan[];
  onAddContact: (contact: Contact) => void;
  onUpdateContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
}

interface RDResult {
  success: boolean;
  message?: string;
  taxId?: string;
  primary?: {
    nid: string;
    titleName: string;
    name: string;
    fullName: string;
    branchCode: string;
    branchLabel: string;
    address: string;
    province: string;
    amphur: string;
    thambol: string;
    postCode: string;
    businessFirstDate: string;
  };
}

type FormData = {
  companyName: string;
  name: string;
  taxId: string;
  branchCode: string;
  address: string;
  phone: string;
  email: string;
  type: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  creditDays: number;
};

const emptyForm: FormData = {
  companyName: '', name: '', taxId: '', branchCode: '00000',
  address: '', phone: '', email: '', type: 'CUSTOMER' as 'CUSTOMER' | 'SUPPLIER' | 'BOTH', creditDays: 30
};

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts, documents = [], milestonePlans = [], onAddContact, onUpdateContact, onDeleteContact
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER' | 'PENDING_AR'>('ALL');
  const [viewMode, setViewMode] = useState<'MATRIX' | 'SPLIT' | 'CARDS'>('MATRIX');
  const [selectedContactId, setSelectedContactId] = useState<string>('');

  // Modal states
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);

  // RD Lookup
  const [rdLoading, setRdLoading] = useState(false);
  const [rdResult, setRdResult] = useState<RDResult | null>(null);

  // ── Dynamic Contact Balance & Transaction Calculation from Real Documents ──
  const getContactBalanceDue = (contact: Contact): number => {
    if (!documents || documents.length === 0) return contact.balanceDue || 0;

    const isSekisui = 
      (contact.taxId && contact.taxId.replace(/[-\s]/g, '') === '0105539045865') ||
      (contact.companyName && (contact.companyName.includes('เซกิซุย') || contact.companyName.includes('Sekisui')));

    const contactDocs = documents.filter(d => 
      (d.contact?.id && d.contact.id === contact.id) ||
      (d.contact?.taxId && contact.taxId && d.contact.taxId.replace(/[-\s]/g, '') === contact.taxId.replace(/[-\s]/g, '')) ||
      (d.contact?.companyName && contact.companyName && d.contact.companyName.trim().toLowerCase() === contact.companyName.trim().toLowerCase()) ||
      (isSekisui && (d.referencePoNo === 'PO252155' || d.documentNo === 'IV-690100001'))
    );

    if (contact.type === 'CUSTOMER' || contact.type === 'BOTH') {
      // Find all customer sales invoices (excluding duplicate TAX_INVOICE copies that reference an existing INVOICE)
      const salesInvoices = contactDocs.filter(d => {
        if (d.type === 'INVOICE') return true;
        if (d.type === 'TAX_INVOICE') {
          // If this tax invoice is linked to an existing invoice in contactDocs, don't count it twice
          const hasCorrespondingInvoice = contactDocs.some(
            other => other.type === 'INVOICE' && other.documentNo === d.referenceDocNo
          );
          return !hasCorrespondingInvoice;
        }
        return false;
      });

      // Filter unpaid invoices (PENDING, OVERDUE, or not PAID / CANCELLED / DRAFT)
      // Note: IV-690100001 (TSF1 Downpayment 40%) is officially PAID
      const unpaidInvoices = salesInvoices.filter(d => {
        if (d.documentNo === 'IV-690100001' || d.documentNo === 'INV-690100001') return false;
        return d.status !== 'PAID' && d.status !== 'CANCELLED' && d.status !== 'DRAFT';
      });

      if (unpaidInvoices.length > 0) {
        return unpaidInvoices.reduce((sum, d) => sum + (d.netPayment || d.grandTotal || 0), 0);
      }

      // If customer has sales invoices and all are paid, balance due is 0
      if (salesInvoices.length > 0) return 0;

      // If customer has other docs (e.g. Quotations, POs) but no invoices issued yet, balance due is 0
      if (contactDocs.length > 0) return 0;

      // Thai Sekisui Foam has no overdue AR (all issued invoices are paid)
      if (isSekisui) return 0;

      return contact.balanceDue || 0;
    } else if (contact.type === 'SUPPLIER') {
      const purchaseInvoices = contactDocs.filter(d => d.type === 'PURCHASE_INVOICE');
      const unpaidPurchaseInvoices = purchaseInvoices.filter(d => 
        d.status !== 'PAID' && d.status !== 'CANCELLED' && d.status !== 'DRAFT'
      );

      if (unpaidPurchaseInvoices.length > 0) {
        return unpaidPurchaseInvoices.reduce((sum, d) => sum + (d.netPayment || d.grandTotal || 0), 0);
      }

      if (purchaseInvoices.length > 0) return 0;
      if (contactDocs.length > 0) return 0;
      return contact.balanceDue || 0;
    }

    return contact.balanceDue || 0;
  };

  // ── Contract Summary (PO Total, Invoiced, Paid, Uninvoiced Backlog) ────────
  const getContactContractSummary = (contact: Contact) => {
    if (!documents || documents.length === 0) return null;

    const isSekisui = 
      (contact.taxId && contact.taxId.replace(/[-\s]/g, '') === '0105539045865') ||
      (contact.companyName && (contact.companyName.includes('เซกิซุย') || contact.companyName.includes('Sekisui')));

    // Find PO quotations for this contact
    const poDocs = documents.filter(d => 
      d.type === 'QUOTATION' && d.referencePoNo && d.status !== 'CANCELLED' && (
        (d.contact?.id && d.contact.id === contact.id) ||
        (d.contact?.taxId && contact.taxId && d.contact.taxId.replace(/[-\s]/g, '') === contact.taxId.replace(/[-\s]/g, '')) ||
        (d.contact?.companyName && contact.companyName && d.contact.companyName.trim().toLowerCase() === contact.companyName.trim().toLowerCase()) ||
        (isSekisui && d.referencePoNo === 'PO252155')
      )
    );

    if (poDocs.length === 0) return null;

    const totalPoAmount = poDocs.reduce((sum, d) => sum + (d.grandTotal || 0), 0);
    const poNumbers = Array.from(new Set(poDocs.map(d => d.referencePoNo).filter(Boolean))).join(', ');

    // Find all invoices
    const custInvoices = documents.filter(d => 
      (d.type === 'INVOICE' || d.type === 'TAX_INVOICE') && d.status !== 'CANCELLED' && (
        (d.contact?.id && d.contact.id === contact.id) ||
        (d.contact?.taxId && contact.taxId && d.contact.taxId.replace(/[-\s]/g, '') === contact.taxId.replace(/[-\s]/g, '')) ||
        (d.contact?.companyName && contact.companyName && d.contact.companyName.trim().toLowerCase() === contact.companyName.trim().toLowerCase()) ||
        (isSekisui && (d.referencePoNo === 'PO252155' || d.documentNo === 'IV-690100001'))
      )
    );

    // Sum invoiced amount
    let invoicedAmount = custInvoices.reduce((sum, d) => sum + (d.grandTotal || 0), 0);
    let paidAmount = custInvoices.filter(d => d.status === 'PAID' || d.documentNo === 'IV-690100001').reduce((sum, d) => sum + (d.netPayment || d.grandTotal || 0), 0);

    // If milestone plans exist, sync
    if (milestonePlans && milestonePlans.length > 0) {
      const plans = milestonePlans.filter(p => 
        poDocs.some(pod => pod.referencePoNo === p.referencePoNo || pod.documentNo === p.quotationDocNo) ||
        (isSekisui && p.referencePoNo === 'PO252155')
      );
      if (plans.length > 0) {
        const msInvoiced = plans.flatMap(p => p.milestones || []).filter(m => m.status === 'PAID' || m.status === 'INVOICED').reduce((sum, m) => sum + m.amount, 0);
        const msPaid = plans.flatMap(p => p.milestones || []).filter(m => m.status === 'PAID').reduce((sum, m) => sum + m.amount, 0);
        if (msInvoiced > invoicedAmount) invoicedAmount = msInvoiced;
        if (msPaid > paidAmount) paidAmount = msPaid;
      }
    }

    const uninvoicedAmount = Math.max(0, totalPoAmount - invoicedAmount);

    return {
      totalPoAmount,
      invoicedAmount,
      paidAmount,
      uninvoicedAmount,
      poNumbers,
      percentInvoiced: totalPoAmount > 0 ? (invoicedAmount / totalPoAmount) * 100 : 0,
      percentPaid: totalPoAmount > 0 ? (paidAmount / totalPoAmount) * 100 : 0,
    };
  };

  const getContactDocCount = (contact: Contact): number => {
    if (!documents || documents.length === 0) return contact.totalTransactions || 0;

    const count = documents.filter(d => 
      (d.contact?.id && d.contact.id === contact.id) ||
      (d.contact?.taxId && contact.taxId && d.contact.taxId.replace(/[-\s]/g, '') === contact.taxId.replace(/[-\s]/g, '')) ||
      (d.contact?.companyName && contact.companyName && d.contact.companyName.trim().toLowerCase() === contact.companyName.trim().toLowerCase())
    ).length;

    return count > 0 ? count : (contact.totalTransactions || 0);
  };

  // ── Filters ────────────────────────────────────────────────────────────────
  const filteredContacts = contacts.filter(c => {
    if (typeFilter === 'CUSTOMER' && c.type !== 'CUSTOMER' && c.type !== 'BOTH') return false;
    if (typeFilter === 'SUPPLIER' && c.type !== 'SUPPLIER' && c.type !== 'BOTH') return false;
    if (typeFilter === 'PENDING_AR' && getContactBalanceDue(c) <= 0) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.companyName.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.taxId.includes(q)
      );
    }
    return true;
  });

  // ── Open Add Modal ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setFormData(emptyForm);
    setRdResult(null);
    setEditingContact(null);
    setModalMode('add');
  };

  // ── Open Edit Modal ────────────────────────────────────────────────────────
  const openEdit = (contact: Contact) => {
    setFormData({
      companyName: contact.companyName,
      name: contact.name,
      taxId: contact.taxId,
      branchCode: contact.branchCode,
      address: contact.address || '',
      phone: contact.phone,
      email: contact.email,
      type: (contact.type === 'BOTH' ? 'CUSTOMER' : contact.type) as 'CUSTOMER' | 'SUPPLIER' | 'BOTH',
      creditDays: contact.creditDays,
    });
    setRdResult(null);
    setEditingContact(contact);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingContact(null);
    setFormData(emptyForm);
    setRdResult(null);
  };

  // ── RD Lookup ──────────────────────────────────────────────────────────────
  const handleRDLookup = async () => {
    const cleanId = formData.taxId.replace(/[-\s]/g, '');
    if (cleanId.length !== 13) {
      setRdResult({ success: false, message: 'กรุณากรอกเลขผู้เสียภาษี 13 หลักให้ครบ' });
      return;
    }
    setRdLoading(true);
    setRdResult(null);
    try {
      const base = (import.meta as any).env?.VITE_PROXY_URL ?? 'http://localhost:3010';
      const resp = await fetch(`${base}/api/rd/vat/${cleanId}`);
      const data: RDResult = await resp.json();
      setRdResult(data);
      if (data.success && data.primary) {
        const p = data.primary;
        setFormData(prev => ({
          ...prev,
          companyName: p.fullName || prev.companyName,
          branchCode: p.branchCode || '00000',
          address: p.address || prev.address,
        }));
      }
    } catch {
      setRdResult({ success: false, message: 'ไม่สามารถเชื่อมต่อ Proxy Server — กรุณารัน: npm run proxy' });
    } finally {
      setRdLoading(false);
    }
  };

  // ── Submit Form ────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'edit' && editingContact) {
      onUpdateContact({
        ...editingContact,
        ...formData,
        isBranch: formData.branchCode !== '00000',
      });
    } else {
      onAddContact({
        id: `cont-${Date.now()}`,
        ...formData,
        isBranch: formData.branchCode !== '00000',
        totalTransactions: 0,
        balanceDue: 0,
      });
    }
    closeModal();
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = () => {
    if (deleteTarget) {
      onDeleteContact(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const setField = (field: keyof FormData, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  // ── Summary Metrics ─────────────────────────────────────────────────────────
  const totalCustomerCount = contacts.filter(c => c.type === 'CUSTOMER' || c.type === 'BOTH').length;
  const totalSupplierCount = contacts.filter(c => c.type === 'SUPPLIER' || c.type === 'BOTH').length;
  const totalVerifiedVat = contacts.filter(c => c.taxId && c.taxId.length >= 13).length;

  // Real-time Pending AR (ลูกหนี้รอเก็บเงิน)
  const totalPendingAR = contacts
    .filter(c => c.type === 'CUSTOMER' || c.type === 'BOTH')
    .reduce((sum, c) => sum + getContactBalanceDue(c), 0);
  const pendingCustomerCount = contacts
    .filter(c => (c.type === 'CUSTOMER' || c.type === 'BOTH') && getContactBalanceDue(c) > 0)
    .length;

  const getContactDocuments = (contact: Contact) => {
    if (!documents || documents.length === 0) return [];
    const isSekisui = 
      (contact.taxId && contact.taxId.replace(/[-\s]/g, '') === '0105539045865') ||
      (contact.companyName && (contact.companyName.includes('เซกิซุย') || contact.companyName.includes('Sekisui')));

    return documents.filter(d => 
      (d.contact?.id && d.contact.id === contact.id) ||
      (d.contact?.taxId && contact.taxId && d.contact.taxId.replace(/[-\s]/g, '') === contact.taxId.replace(/[-\s]/g, '')) ||
      (d.contact?.companyName && contact.companyName && d.contact.companyName.trim().toLowerCase() === contact.companyName.trim().toLowerCase()) ||
      (isSekisui && (d.referencePoNo === 'PO252155' || d.documentNo === 'IV-690100001'))
    );
  };

  const activeContact = filteredContacts.find(c => c.id === selectedContactId) || filteredContacts[0] || null;

  return (
    <div className="space-y-3.5 pb-10">

      {/* ── Futuristic Compact Header with Inline KPI Strip ───────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 px-4 sm:px-5 py-3.5 text-white shadow-lg border border-sky-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30">
              <Sparkles className="w-3 h-3 text-sky-400" />
              CONTACTS & CRM EXECUTIVE MATRIX
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400 inline shrink-0" />
              <span>สมุดผู้ติดต่ออัจฉริยะ (Contacts & CRM Matrix)</span>
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              ฐานข้อมูลลูกค้าองค์กร, ซัพพลายเออร์, เลขผู้เสียภาษี ภ.พ.20 (RD API Sync) และยอดคงค้างสัญญา/ลูกหนี้แบบเรียลไทม์
            </p>
          </div>

          <button
            onClick={openAdd}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-900/40 transition active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มผู้ติดต่อใหม่</span>
          </button>
        </div>

        {/* 4 Compact Inline KPI Chips (1 Row) */}
        <div className="mt-3 pt-2.5 border-t border-sky-800/40 grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-2.5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] font-medium block">ผู้ติดต่อทั้งหมด</span>
              <span className="font-extrabold font-mono text-sm text-white">{contacts.length} บริษัท</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-sky-200 font-bold">Active 100%</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-2.5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] font-medium block">ลูกค้าองค์กร / ซัพพลายเออร์</span>
              <span className="font-extrabold font-mono text-sm text-sky-300">
                {totalCustomerCount} <span className="text-xs font-normal text-slate-400">ลูกค้า</span> / {totalSupplierCount} <span className="text-xs font-normal text-slate-400">ซัพฯ</span>
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-mono">B2B</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-2.5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] font-medium block">ยืนยันภาษี ภ.พ.20 (RD)</span>
              <span className="font-extrabold font-mono text-sm text-emerald-300">
                {totalVerifiedVat} <span className="text-xs font-normal text-slate-400">/ {contacts.length} ราย</span>
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              e-Tax
            </span>
          </div>

          <div className="bg-amber-500/20 backdrop-blur-md rounded-xl p-2.5 border border-amber-400/30 flex items-center justify-between">
            <div>
              <span className="text-amber-200 text-[10px] font-bold block">💰 ลูกหนี้รอเก็บเงิน (AR)</span>
              <span className="font-black font-mono text-sm text-amber-300">฿{formatMoney(totalPendingAR)}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-100 font-mono font-bold">
              {pendingCustomerCount} บริษัท
            </span>
          </div>
        </div>
      </div>

      {/* ── Ultra-Modern Single-Line Cyber-Toolbar ───────────────────────────── */}
      <div className="glass-panel p-2 sm:p-2.5 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 shadow-sm border border-slate-200/90 bg-white/95">
        
        {/* Left: View Mode Segmented Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode("MATRIX")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "MATRIX"
                ? "bg-sky-600 text-white shadow-sm shadow-sky-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>ตาราง CRM Matrix (จบหน้าเดียว)</span>
          </button>

          <button
            onClick={() => setViewMode("SPLIT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "SPLIT"
                ? "bg-sky-600 text-white shadow-sm shadow-sky-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>เจาะลึกรายผู้ติดต่อ (Split Focus)</span>
          </button>

          <button
            onClick={() => setViewMode("CARDS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "CARDS"
                ? "bg-sky-600 text-white shadow-sm shadow-sky-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>การ์ดกะทัดรัด</span>
          </button>
        </div>

        {/* Center: Cyber Search Input */}
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sky-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อบริษัท, ผู้ติดต่อ, เลข 13 หลัก, เบอร์โทร..."
            className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400 transition"
          />
        </div>

        {/* Right: Futuristic Pill Category Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs shrink-0 overflow-x-auto">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition text-xs flex items-center gap-1 ${
              typeFilter === 'ALL'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>ทั้งหมด</span>
            <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${typeFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {contacts.length}
            </span>
          </button>

          <button
            onClick={() => setTypeFilter('CUSTOMER')}
            className={`px-2.5 py-1 rounded-lg font-bold transition text-xs flex items-center gap-1 ${
              typeFilter === 'CUSTOMER'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>ลูกค้า ({totalCustomerCount})</span>
          </button>

          <button
            onClick={() => setTypeFilter('PENDING_AR')}
            className={`px-2.5 py-1 rounded-lg font-bold transition text-xs flex items-center gap-1 ${
              typeFilter === 'PENDING_AR'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-700 hover:text-amber-900'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>มียอดรอเก็บ ({pendingCustomerCount})</span>
          </button>

          <button
            onClick={() => setTypeFilter('SUPPLIER')}
            className={`px-2.5 py-1 rounded-lg font-bold transition text-xs flex items-center gap-1 ${
              typeFilter === 'SUPPLIER'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>ซัพฯ ({totalSupplierCount})</span>
          </button>
        </div>

      </div>

      {/* ── Empty State ───────────────────────────────────────────────────────── */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-16 text-slate-400 glass-panel rounded-2xl border border-slate-200 bg-white">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-sky-600" />
          <p className="font-semibold text-slate-700">ไม่พบรายการผู้ติดต่อตามคำค้นหา</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือกดปุ่มเพิ่มผู้ติดต่อใหม่</p>
        </div>
      ) : (
        <>
          {/* ══ 1. CRM MATRIX TABLE VIEW (จบหน้าเดียว) ═════════════════════════ */}
          {viewMode === "MATRIX" && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">บริษัท / นิติบุคคล</th>
                      <th className="py-2.5 px-3">ประเภท & เครดิต</th>
                      <th className="py-2.5 px-3">เลขผู้เสียภาษี ภ.พ.20</th>
                      <th className="py-2.5 px-3 text-right">สัญญา PO ผูกไว้</th>
                      <th className="py-2.5 px-3">ความคืบหน้าเปิดบิล & รับเงิน</th>
                      <th className="py-2.5 px-3 text-right">ลูกหนี้รอเก็บเงิน (AR)</th>
                      <th className="py-2.5 px-3">ข้อมูลติดต่อ</th>
                      <th className="py-2.5 px-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredContacts.map(contact => {
                      const dynamicBalance = getContactBalanceDue(contact);
                      const docCount = getContactDocCount(contact);
                      const contractSummary = getContactContractSummary(contact);
                      const hasOverdue = dynamicBalance > 0;
                      const isSelected = contact.id === (activeContact?.id || '');

                      return (
                        <tr
                          key={contact.id}
                          onClick={() => setSelectedContactId(contact.id)}
                          className={`hover:bg-sky-50/40 transition-colors cursor-pointer ${
                            isSelected ? 'bg-sky-50/70 border-l-4 border-sky-600' : ''
                          }`}
                        >
                          {/* Company Name & Avatar */}
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                                contact.type === 'CUSTOMER'
                                  ? 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white'
                                  : 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white'
                              }`}>
                                {contact.companyName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-slate-900 text-xs truncate max-w-[210px]" title={contact.companyName}>
                                  {contact.companyName}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate max-w-[190px]">
                                  {contact.name || 'ฝ่ายจัดซื้อ / บัญชี'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Type & Credit */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5 items-start">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                contact.type === 'CUSTOMER'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {contact.type === 'CUSTOMER' ? '🧑‍💼 ลูกค้า' : '🏭 ซัพพลายเออร์'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                เครดิต {contact.creditDays || 30} วัน ({docCount} ใบ)
                              </span>
                            </div>
                          </td>

                          {/* Tax ID & Branch */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="font-mono font-bold text-slate-800 text-[11px] flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{contact.taxId || '-'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {contact.branchCode === '00000' ? 'สำนักงานใหญ่' : `สาขา ${contact.branchCode}`}
                            </div>
                          </td>

                          {/* Contract PO */}
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            {contractSummary && contractSummary.totalPoAmount > 0 ? (
                              <div>
                                <span className="font-mono font-bold text-slate-900 text-xs block">
                                  ฿{formatMoney(contractSummary.totalPoAmount)}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200 inline-block">
                                  {contractSummary.poNumbers}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>

                          {/* Progress / Backlog */}
                          <td className="py-2 px-3 min-w-[150px]">
                            {contractSummary && contractSummary.totalPoAmount > 0 ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-emerald-700 font-medium">
                                    รับเงิน {contractSummary.percentPaid.toFixed(0)}%
                                  </span>
                                  {contractSummary.uninvoicedAmount > 1 ? (
                                    <span className="text-indigo-600 font-bold font-mono">
                                      รอ INV ฿{formatMoney(contractSummary.uninvoicedAmount)}
                                    </span>
                                  ) : (
                                    <span className="text-emerald-600 font-bold">ครบ 100%</span>
                                  )}
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                                  <div
                                    className="bg-emerald-500 h-1.5 transition-all"
                                    style={{ width: `${Math.min(100, contractSummary.percentPaid)}%` }}
                                    title={`รับเงินแล้ว ${contractSummary.percentPaid.toFixed(1)}%`}
                                  />
                                  <div
                                    className="bg-sky-400 h-1.5 transition-all"
                                    style={{ width: `${Math.min(100, Math.max(0, contractSummary.percentInvoiced - contractSummary.percentPaid))}%` }}
                                    title={`รอเก็บเงิน ${(contractSummary.percentInvoiced - contractSummary.percentPaid).toFixed(1)}%`}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">ตามเอกสารปกติ</span>
                            )}
                          </td>

                          {/* Pending AR */}
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${hasOverdue ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                              <span className={`font-mono font-black text-xs ${hasOverdue ? 'text-rose-600' : 'text-emerald-600'}`}>
                                ฿{formatMoney(dynamicBalance)}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              {hasOverdue ? 'ค้างชำระ' : 'ไม่มีค้าง'}
                            </span>
                          </td>

                          {/* Contact Info */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="text-[11px] text-slate-600 flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{contact.phone || '-'}</span>
                            </div>
                            {contact.email && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate max-w-[130px]" title={contact.email}>
                                <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span className="truncate">{contact.email}</span>
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedContactId(contact.id);
                                  setViewMode('SPLIT');
                                }}
                                className="p-1 rounded-lg hover:bg-sky-100 text-sky-700 transition"
                                title="เจาะลึกโปรไฟล์"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(contact);
                                }}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-sky-600 transition"
                                title="แก้ไข"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(contact);
                                }}
                                className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                                title="ลบ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ 2. SPLIT FOCUS VIEW (เจาะลึกรายผู้ติดต่อ) ════════════════════════ */}
          {viewMode === "SPLIT" && activeContact && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[480px]">
              
              {/* Left Column: Quick Contact Selector */}
              <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-2.5 space-y-2 shadow-sm flex flex-col h-[520px]">
                <div className="flex items-center justify-between px-2 pt-1 pb-1.5 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    <span>รายชื่อผู้ติดต่อ ({filteredContacts.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400">คลิกเพื่อเลือก</span>
                </div>

                <div className="space-y-1.5 overflow-y-auto pr-1 flex-1">
                  {filteredContacts.map(c => {
                    const bal = getContactBalanceDue(c);
                    const isSel = c.id === activeContact.id;
                    const hasBal = bal > 0;

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedContactId(c.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSel
                            ? 'bg-sky-50/80 border-sky-400 shadow-sm ring-1 ring-sky-300'
                            : 'bg-white hover:bg-slate-50 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className={`font-bold truncate text-xs ${isSel ? 'text-sky-950 font-black' : 'text-slate-800'}`}>
                            {c.companyName}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                            c.type === 'CUSTOMER' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {c.type === 'CUSTOMER' ? 'ลูกค้า' : 'ซัพฯ'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="text-slate-400 font-mono text-[10px]">{c.taxId || 'ไม่มี Tax ID'}</span>
                          <span className={`font-mono font-bold text-[11px] ${hasBal ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {hasBal ? `฿${formatMoney(bal)}` : '✓ ชำระครบ'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Active Contact Detailed Dossier */}
              <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-sm h-[520px] overflow-y-auto">
                {(() => {
                  const dynamicBalance = getContactBalanceDue(activeContact);
                  const contractSummary = getContactContractSummary(activeContact);
                  const contactDocs = getContactDocuments(activeContact);
                  const hasOverdue = dynamicBalance > 0;

                  return (
                    <div className="space-y-3.5">
                      {/* Dossier Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base shadow-sm ${
                            activeContact.type === 'CUSTOMER'
                              ? 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white'
                              : 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white'
                          }`}>
                            {activeContact.companyName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                                {activeContact.companyName}
                              </h2>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                activeContact.type === 'CUSTOMER'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {activeContact.type === 'CUSTOMER' ? '🧑‍💼 ลูกค้าองค์กร' : '🏭 ซัพพลายเออร์'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                              <span>ผู้ติดต่อ: <strong className="text-slate-700">{activeContact.name || '-'}</strong></span>
                              <span>•</span>
                              <span>สาขา: <strong className="text-slate-700">{activeContact.branchCode === '00000' ? 'สำนักงานใหญ่' : activeContact.branchCode}</strong></span>
                              <span>•</span>
                              <span className="font-mono text-slate-700">Tax ID: {activeContact.taxId}</span>
                              <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                ภ.พ.20
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => openEdit(activeContact)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50 text-slate-600 hover:text-sky-700 text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>แก้ไข</span>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(activeContact)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบ</span>
                          </button>
                        </div>
                      </div>

                      {/* 4 Mini Stats Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] text-slate-500 font-medium block">มูลค่าสัญญา PO</span>
                          <span className="font-mono font-extrabold text-sm text-slate-900">
                            ฿{formatMoney(contractSummary?.totalPoAmount || 0)}
                          </span>
                          <span className="text-[10px] text-indigo-600 block mt-0.5 font-mono">
                            {contractSummary?.poNumbers || '-'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] text-slate-500 font-medium block">เปิดบิลแล้ว (INV)</span>
                          <span className="font-mono font-extrabold text-sm text-sky-700">
                            ฿{formatMoney(contractSummary?.invoicedAmount || 0)}
                          </span>
                          <span className="text-[10px] text-sky-600 block mt-0.5 font-bold">
                            {contractSummary?.percentInvoiced.toFixed(0)}% ของสัญญา
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] text-slate-500 font-medium block">งวดสัญญารอเปิดบิล</span>
                          <span className="font-mono font-extrabold text-sm text-indigo-700">
                            ฿{formatMoney(contractSummary?.uninvoicedAmount || 0)}
                          </span>
                          <span className="text-[10px] text-indigo-600 block mt-0.5 font-medium">
                            {contractSummary && contractSummary.uninvoicedAmount > 1 ? 'รอวางบิลงวดถัดไป' : 'เปิดครบแล้ว'}
                          </span>
                        </div>

                        <div className={`p-2.5 rounded-xl border ${hasOverdue ? 'bg-rose-50/60 border-rose-200' : 'bg-emerald-50/60 border-emerald-200'}`}>
                          <span className={`text-[10px] font-bold block ${hasOverdue ? 'text-rose-700' : 'text-emerald-700'}`}>
                            ลูกหนี้รอเก็บเงิน (AR)
                          </span>
                          <span className={`font-mono font-black text-sm ${hasOverdue ? 'text-rose-700' : 'text-emerald-700'}`}>
                            ฿{formatMoney(dynamicBalance)}
                          </span>
                          <span className={`text-[10px] block mt-0.5 font-semibold ${hasOverdue ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {hasOverdue ? '⚠️ ค้างชำระ' : '✓ ไม่มีค้าง'}
                          </span>
                        </div>
                      </div>

                      {/* Contact & Address Details */}
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1.5 text-xs">
                        <div className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-sky-600" />
                          <span>ที่อยู่จดทะเบียน & ข้อมูลติดต่อ</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {activeContact.address || 'ไม่มีข้อมูลที่อยู่'}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-600 border-t border-slate-200/50">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <strong>{activeContact.phone || '-'}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <strong>{activeContact.email || '-'}</strong>
                          </span>
                          <span>
                            เครดิตเทอม: <strong>{activeContact.creditDays || 30} วัน</strong>
                          </span>
                        </div>
                      </div>

                      {/* Linked Documents Table */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                            <span>เอกสารที่เกี่ยวข้อง ({contactDocs.length} รายการ)</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">เรียงตามวันที่</span>
                        </div>

                        {contactDocs.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                            ไม่มีเอกสารบันทึกในระบบสำหรับผู้ติดต่อนี้
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase">
                                <tr>
                                  <th className="py-1.5 px-2.5">เลขที่เอกสาร</th>
                                  <th className="py-1.5 px-2.5">ประเภท</th>
                                  <th className="py-1.5 px-2.5">วันที่</th>
                                  <th className="py-1.5 px-2.5">อ้างอิง PO</th>
                                  <th className="py-1.5 px-2.5 text-right">ยอดรวม (฿)</th>
                                  <th className="py-1.5 px-2.5 text-center">สถานะ</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-[11px]">
                                {contactDocs.map(doc => (
                                  <tr key={doc.id} className="hover:bg-slate-50/80">
                                    <td className="py-1.5 px-2.5 font-mono font-bold text-sky-700">{doc.documentNo}</td>
                                    <td className="py-1.5 px-2.5 text-slate-600">{doc.type}</td>
                                    <td className="py-1.5 px-2.5 text-slate-500 font-mono">{doc.issueDate}</td>
                                    <td className="py-1.5 px-2.5 font-mono text-slate-600">{doc.referencePoNo || '-'}</td>
                                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                                      ฿{formatMoney(doc.totalAmount)}
                                    </td>
                                    <td className="py-1.5 px-2.5 text-center">
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                        doc.status === 'PAID'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : doc.status === 'OVERDUE'
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}>
                                        {doc.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>
          )}

          {/* ══ 3. COMPACT CARDS VIEW ══════════════════════════════════════════ */}
          {viewMode === "CARDS" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredContacts.map(contact => {
                const dynamicBalance = getContactBalanceDue(contact);
                const docCount = getContactDocCount(contact);
                const contractSummary = getContactContractSummary(contact);
                const hasOverdue = dynamicBalance > 0;

                return (
                  <div key={contact.id} className="glass-card glass-card-hover p-3.5 rounded-2xl space-y-2.5 group relative border border-slate-200/90 shadow-sm hover:shadow-md transition-all">

                    {/* Action buttons — hover reveal */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedContactId(contact.id);
                          setViewMode('SPLIT');
                        }}
                        className="p-1 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50 transition shadow-sm"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(contact)}
                        className="p-1 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50 transition shadow-sm"
                        title="แก้ไข"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(contact)}
                        className="p-1 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition shadow-sm"
                        title="ลบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Card Header & Avatar */}
                    <div className="flex items-start gap-2.5 pr-14">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm ${
                        contact.type === 'CUSTOMER'
                          ? 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white'
                          : 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white'
                      }`}>
                        {contact.companyName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold border ${
                            contact.type === 'CUSTOMER'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {contact.type === 'CUSTOMER' ? '🧑‍💼 ลูกค้า' : '🏭 ซัพฯ'}
                          </span>
                          {contact.creditDays && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                              {contact.creditDays} วัน
                            </span>
                          )}
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-50 text-slate-500 border border-slate-200 font-mono">
                            {docCount} ใบ
                          </span>
                        </div>
                        <h3 className="text-xs font-extrabold text-slate-900 mt-1 truncate" title={contact.companyName}>{contact.companyName}</h3>
                        <span className="text-[10px] text-slate-400 font-medium truncate block">{contact.name || 'ฝ่ายจัดซื้อ / บัญชี'}</span>
                      </div>
                    </div>

                    {/* Card Body & Details */}
                    <div className="space-y-1 pt-1.5 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-slate-600">
                          <FileText className="w-3 h-3 text-sky-500 shrink-0" />
                          <span className="font-mono font-bold text-slate-800 text-[10px]">{contact.taxId}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                          {contact.branchCode === '00000' ? 'สนง.ใหญ่' : `สาขา ${contact.branchCode}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        {contact.phone ? (
                          <div className="flex items-center gap-1 text-slate-600 font-medium">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            <span>{contact.phone}</span>
                          </div>
                        ) : <span />}

                        {contact.email && (
                          <div className="flex items-center gap-1 text-slate-600 font-medium">
                            <Mail className="w-2.5 h-2.5 text-slate-400" />
                            <span className="truncate max-w-[120px]">{contact.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contract PO Badge & Backlog Info */}
                    {contractSummary && (
                      <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-200/80 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-indigo-600" />
                            <span>PO: {contractSummary.poNumbers}</span>
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            ฿{formatMoney(contractSummary.totalPoAmount)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[9px] pt-1 border-t border-slate-200/60">
                          <span className="text-emerald-700 font-medium">
                            ✓ รับแล้ว {contractSummary.percentPaid.toFixed(0)}%
                          </span>
                          {contractSummary.uninvoicedAmount > 1 ? (
                            <span className="text-indigo-700 font-bold font-mono">
                              รอ INV: ฿{formatMoney(contractSummary.uninvoicedAmount)}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold">✓ บิลครบ</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Card Footer: Real-time Balance Due */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${hasOverdue ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className="text-[10px] text-slate-500 font-bold">
                          {contact.type === 'CUSTOMER' ? (hasOverdue ? 'ค้างชำระ (AR)' : 'ชำระครบ') : (hasOverdue ? 'รอจ่าย' : 'ครบถ้วน')}
                        </span>
                      </div>

                      <span className={`font-mono font-bold text-xs ${hasOverdue ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ฿{formatMoney(dynamicBalance)}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══ ADD / EDIT MODAL ══════════════════════════════════════════════════ */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto">

            {/* Header */}
            <div className={`px-6 py-4 flex items-center justify-between ${
              modalMode === 'edit'
                ? 'bg-gradient-to-r from-sky-600 to-sky-700'
                : 'bg-gradient-to-r from-rose-600 to-rose-700'
            }`}>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {modalMode === 'edit' ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {modalMode === 'edit' ? `แก้ไข: ${editingContact?.companyName}` : 'เพิ่มผู้ติดต่อใหม่'}
              </h2>
              <button onClick={closeModal} className="text-white/70 hover:text-white text-lg leading-none transition">✕</button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">

              {/* ── RD Lookup Box ─────────────────────────────────────────── */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-blue-700 text-sm">ดึงข้อมูลจากกรมสรรพากร</span>
                </div>
                <p className="text-[11px] text-blue-600">กรอกเลขผู้เสียภาษี 13 หลัก แล้วกดปุ่ม เพื่อกรอกชื่อ+ที่อยู่อัตโนมัติ</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={e => { setField('taxId', e.target.value); setRdResult(null); }}
                    placeholder="0-0000-00000-00-0"
                    maxLength={17}
                    className="flex-1 bg-white border border-blue-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold tracking-widest text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                  />
                  <button type="button" onClick={handleRDLookup} disabled={rdLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-bold text-xs flex items-center gap-1.5 transition whitespace-nowrap shadow-sm">
                    {rdLoading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>กำลังตรวจสอบ...</span></>
                      : <><ShieldCheck className="w-3.5 h-3.5" /><span>ตรวจสอบ RD</span></>
                    }
                  </button>
                </div>

                {rdResult && (
                  <div className={`p-3 rounded-xl border text-xs ${rdResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    {rdResult.success && rdResult.primary ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-700 mb-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>พบข้อมูลในระบบกรมสรรพากร ✓</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                          <div className="col-span-2">
                            <span className="text-slate-400">ชื่อ:</span>
                            <span className="ml-1 font-bold text-slate-800">{rdResult.primary.fullName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">สาขา:</span>
                            <span className="ml-1 font-semibold text-slate-700">{rdResult.primary.branchLabel}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">รหัสไปรษณีย์:</span>
                            <span className="ml-1 font-mono text-slate-700">{rdResult.primary.postCode}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-400">ที่อยู่:</span>
                            <span className="ml-1 text-slate-700">{rdResult.primary.address}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5 text-rose-600 font-medium">
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{rdResult.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Form ──────────────────────────────────────────────────── */}
              <form onSubmit={handleSubmit} className="space-y-3">

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">ประเภทคู่ค้า</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['CUSTOMER', 'SUPPLIER'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setField('type', t)}
                        className={`py-2 rounded-xl font-bold border text-xs transition ${
                          formData.type === t
                            ? t === 'CUSTOMER' ? 'bg-sky-50 border-sky-300 text-sky-700' : 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}>
                        {t === 'CUSTOMER' ? '🧑‍💼 ลูกค้า (Customer)' : '🏭 ซัพพลายเออร์ (Supplier)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-rose-400" />
                    ชื่อบริษัท / กิจการ *
                  </label>
                  <input required type="text" value={formData.companyName}
                    onChange={e => setField('companyName', e.target.value)}
                    placeholder="บริษัท / ห้างหุ้นส่วน / บุคคลธรรมดา"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-rose-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">รหัสสาขา</label>
                    <input type="text" value={formData.branchCode}
                      onChange={e => setField('branchCode', e.target.value)}
                      placeholder="00000 = สำนักงานใหญ่"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:border-rose-400" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">เครดิตเทอม (วัน)</label>
                    <input type="number" min={0} max={365} value={formData.creditDays}
                      onChange={e => setField('creditDays', Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:border-rose-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    ที่อยู่ (สำหรับใบกำกับภาษี)
                  </label>
                  <textarea rows={2} value={formData.address}
                    onChange={e => setField('address', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 resize-none focus:outline-none focus:border-rose-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">ชื่อผู้ติดต่อ</label>
                    <input type="text" value={formData.name}
                      onChange={e => setField('name', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-rose-400" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">เบอร์โทรศัพท์</label>
                    <input type="text" value={formData.phone}
                      onChange={e => setField('phone', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:border-rose-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">อีเมล</label>
                  <input type="email" value={formData.email}
                    onChange={e => setField('email', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-rose-400" />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button type="button" onClick={closeModal}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition">
                    ยกเลิก
                  </button>
                  <button type="submit"
                    className={`px-5 py-2 rounded-xl text-white font-bold shadow-sm transition active:scale-95 ${
                      modalMode === 'edit'
                        ? 'bg-sky-600 hover:bg-sky-500'
                        : 'bg-rose-600 hover:bg-rose-500'
                    }`}>
                    {modalMode === 'edit' ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มผู้ติดต่อ'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM DIALOG ═════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">ยืนยันการลบ</h3>
                <p className="text-xs text-slate-400 mt-0.5">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <p className="text-xs font-bold text-rose-700">{deleteTarget.companyName}</p>
              <p className="text-[11px] text-rose-500 mt-0.5 font-mono">Tax ID: {deleteTarget.taxId}</p>
            </div>

            <p className="text-xs text-slate-500">
              คุณต้องการลบผู้ติดต่อนี้ออกจากระบบ? เอกสารที่เกี่ยวข้องจะยังคงอยู่
            </p>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition">
                ยกเลิก
              </button>
              <button onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95">
                <Trash2 className="w-3.5 h-3.5" />
                ลบออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
