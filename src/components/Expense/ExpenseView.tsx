import React, { useState } from 'react';
import { 
  TrendingDown, Plus, Search, Filter, Printer, Pencil, Trash2, AlertTriangle, 
  FileText, CheckCircle2, RotateCcw, Calendar, ShoppingBag, Receipt, DollarSign, ShieldAlert
} from 'lucide-react';
import { AccountingDocument, DocumentType, DocumentStatus } from '../../types';
import { formatMoney, getStatusBadge, formatThaiDate } from '../../utils/formatters';

interface ExpenseViewProps {
  documents: AccountingDocument[];
  openCreateModal: (type: DocumentType) => void;
  openEditDocument: (doc: AccountingDocument) => void;
  openViewDocument: (doc: AccountingDocument) => void;
  onUpdateStatus: (docId: string, status: DocumentStatus) => void;
  onDeleteDocument: (docId: string) => void;
}

const EXPENSE_DOC_TYPES = ['PURCHASE_ORDER', 'PURCHASE_INVOICE', 'PAYMENT_VOUCHER', 'WHT_CERTIFICATE'];

export const ExpenseView: React.FC<ExpenseViewProps> = ({
  documents,
  openCreateModal,
  openEditDocument,
  openViewDocument,
  onUpdateStatus,
  onDeleteDocument
}) => {
  const [activeTypeTab, setActiveTypeTab] = useState<string>('PURCHASE_ORDER');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<AccountingDocument | null>(null);

  const expenseDocs = documents.filter(d => EXPENSE_DOC_TYPES.includes(d.type));

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    if (preset === 'THIS_MONTH') {
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'LAST_MONTH') {
      const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'THIS_YEAR') {
      const firstDay = `${year}-01-01`;
      const lastDay = `${year}-12-31`;
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    }
  };

  const filteredDocs = expenseDocs.filter(doc => {
    if (activeTypeTab === 'PURCHASE_ORDER' && doc.type !== 'PURCHASE_ORDER') return false;
    if (activeTypeTab === 'PURCHASE_INVOICE' && doc.type !== 'PURCHASE_INVOICE') return false;
    if (activeTypeTab === 'PAYMENT_VOUCHER' && doc.type !== 'PAYMENT_VOUCHER') return false;
    if (activeTypeTab === 'WHT_CERTIFICATE' && doc.type !== 'WHT_CERTIFICATE') return false;
    if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
    if (startDate && doc.issueDate < startDate) return false;
    if (endDate && doc.issueDate > endDate) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        doc.documentNo.toLowerCase().includes(q) ||
        (doc.contact?.companyName || '').toLowerCase().includes(q) ||
        (doc.contact?.taxId || '').includes(q) ||
        (doc.contact?.name || '').toLowerCase().includes(q) ||
        (doc.notes || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate live KPI metrics
  const totalExpenseAmount = filteredDocs.reduce((sum, d) => sum + d.grandTotal, 0);
  const totalInputVat = filteredDocs.reduce((sum, d) => sum + d.vatAmount, 0);
  const totalWht = filteredDocs.reduce((sum, d) => sum + (d.withholdingTaxTotal || 0), 0);
  const totalFilteredNet = filteredDocs.reduce((sum, d) => sum + (d.netPayment || d.grandTotal - (d.withholdingTaxTotal || 0)), 0);

  // Table Tabs Definition for Expense (เฉพาะ 4 ประเภทเอกสารชัดเจน ไม่มีแท็บ "ทั้งหมด")
  const tableTabs = [
    { 
      id: 'PURCHASE_ORDER', 
      label: 'ใบสั่งซื้อ', 
      sublabel: 'Purchase Order (PO)',
      icon: ShoppingBag, 
      count: expenseDocs.filter(d => d.type === 'PURCHASE_ORDER').length,
      activeColor: 'bg-amber-600 text-white shadow-amber-200',
      badgeActive: 'bg-white text-amber-700'
    },
    { 
      id: 'PURCHASE_INVOICE', 
      label: 'ใบแจ้งหนี้ซื้อ', 
      sublabel: 'Purchase Invoice (PINV)',
      icon: Receipt, 
      count: expenseDocs.filter(d => d.type === 'PURCHASE_INVOICE').length,
      activeColor: 'bg-orange-600 text-white shadow-orange-200',
      badgeActive: 'bg-white text-orange-700'
    },
    { 
      id: 'PAYMENT_VOUCHER', 
      label: 'ใบสำคัญจ่าย', 
      sublabel: 'Payment Voucher (PV)',
      icon: DollarSign, 
      count: expenseDocs.filter(d => d.type === 'PAYMENT_VOUCHER').length,
      activeColor: 'bg-rose-600 text-white shadow-rose-200',
      badgeActive: 'bg-white text-rose-700'
    },
    { 
      id: 'WHT_CERTIFICATE', 
      label: 'หัก ณ ที่จ่าย', 
      sublabel: 'WHT Certificate (50 ทวิ)',
      icon: FileText, 
      count: expenseDocs.filter(d => d.type === 'WHT_CERTIFICATE').length,
      activeColor: 'bg-purple-600 text-white shadow-purple-200',
      badgeActive: 'bg-white text-purple-700'
    },
  ];

  // ── High-Tech KPI Computations ──────────────────────────────────────────────
  const poDocs = expenseDocs.filter(d => d.type === 'PURCHASE_ORDER');
  const poTotal = poDocs.reduce((s, d) => s + (d.grandTotal || 0), 0);
  
  const piDocs = expenseDocs.filter(d => d.type === 'PURCHASE_INVOICE');
  const piTotal = piDocs.reduce((s, d) => s + (d.grandTotal || 0), 0);
  
  const pvDocs = expenseDocs.filter(d => d.type === 'PAYMENT_VOUCHER');
  const pvTotal = pvDocs.reduce((s, d) => s + (d.netPayment || d.grandTotal || 0), 0);

  const pendingPay = piDocs.filter(d => d.status !== 'PAID');
  const pendingPayTotal = pendingPay.reduce((s, d) => s + (d.netPayment || d.grandTotal || 0), 0);

  const hasActiveFilters = 
    statusFilter !== 'ALL' || 
    datePreset !== 'ALL' || 
    startDate !== '' || 
    endDate !== '' || 
    searchTerm.trim() !== '';

  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  return (
    <div className="space-y-5 pb-12">

      {/* ── Futuristic Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-200">
              <TrendingDown className="w-4.5 h-4.5" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 via-rose-950 to-red-900 bg-clip-text text-transparent">
              ศูนย์จัดซื้อ & รายจ่ายโครงการ (Expense & Purchasing Center)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            <span>จัดการใบสั่งซื้อ (PO), ใบแจ้งหนี้จัดซื้อ (AP), ใบสำคัญจ่าย (PV) และภาษีหัก ณ ที่จ่าย 50 ทวิ</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
            <span className="text-rose-600 font-bold">Cost Control Matrix</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openCreateModal('PURCHASE_ORDER')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-200/80 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ ใบสั่งซื้อ (PO)</span>
          </button>
          <button
            onClick={() => openCreateModal('PURCHASE_INVOICE')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-sky-600" />
            <span>+ ใบแจ้งหนี้ซื้อ</span>
          </button>
          <button
            onClick={() => openCreateModal('PAYMENT_VOUCHER')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ ใบสำคัญจ่าย</span>
          </button>
          <button
            onClick={() => openCreateModal('WHT_CERTIFICATE')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>+ 50 ทวิ</span>
          </button>
        </div>
      </div>

      {/* ── Futuristic High-Tech 4 KPI Cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Purchase Orders (PO) */}
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-white via-rose-50/30 to-red-50/50 border border-rose-200/80 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">ภาระผูกพันสั่งซื้อ (PO Pipeline)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold shadow-sm">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-extrabold font-mono text-rose-700 tracking-tight">฿{formatMoney(poTotal)}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-rose-100/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>ใบสั่งซื้อทั้งหมด:</span>
            <strong className="text-rose-800">{poDocs.length} ฉบับเปิดแล้ว</strong>
          </div>
        </div>

        {/* Card 2: Invoiced AP */}
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-white via-sky-50/30 to-blue-50/50 border border-sky-200/80 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">หนี้การค้าตั้งเบิก (AP Invoiced)</span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold shadow-sm">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-extrabold font-mono text-sky-700 tracking-tight">฿{formatMoney(piTotal)}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-sky-100/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>รอจ่ายชำระ (Pending):</span>
            <strong className="font-mono text-amber-600">฿{formatMoney(pendingPayTotal)}</strong>
          </div>
        </div>

        {/* Card 3: Paid Expenses & PV */}
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/50 border border-emerald-200/80 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">จ่ายชำระแล้วจริง (Paid Expenses)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-extrabold font-mono text-emerald-700 tracking-tight">฿{formatMoney(pvTotal)}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-100/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>ออกใบสำคัญจ่าย:</span>
            <strong className="text-emerald-800">{pvDocs.length} ฉบับตัดจ่าย</strong>
          </div>
        </div>

        {/* Card 4: AP Health Radar */}
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-white via-amber-50/30 to-orange-50/50 border border-amber-200/80 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">เรดาร์การจ่ายเจ้าหนี้ (AP Radar)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-sm">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-amber-700">
              {piTotal > 0 ? ((pvTotal / piTotal) * 100).toFixed(0) : 100}%
            </span>
            <span className="text-[11px] font-semibold text-slate-400">อัตราจ่ายชำระตรงเวลา</span>
          </div>
          <div className="mt-2 pt-2 border-t border-amber-100/80 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">เครดิตองค์กร:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>ความน่าเชื่อถือระดับ A+</span>
            </span>
          </div>
        </div>

      </div>

      {/* ── Ultra-Modern Single-Line Filter Toolbar ─────────────────────────── */}
      <div className="glass-panel p-2.5 sm:p-3 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 shadow-sm border border-slate-200/90">
        
        {/* Left: Futuristic Search Bar */}
        <div className="relative flex-1 min-w-[240px] max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาเลขที่ PO, ซัพพลายเออร์, Tax ID, รายละเอียด..."
            className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition"
          />
        </div>

        {/* Right: Controls & Badges on Single Line */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          
          {/* Date Filter Group */}
          <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200/90 rounded-xl px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <select
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">📅 ทุกช่วงเวลา</option>
              <option value="THIS_MONTH">เดือนนี้</option>
              <option value="LAST_MONTH">เดือนที่แล้ว</option>
              <option value="THIS_YEAR">ปีนี้ (2569)</option>
              <option value="CUSTOM">กำหนดวันที่เอง</option>
            </select>

            {datePreset === 'CUSTOM' && (
              <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-[11px] text-slate-700 focus:outline-none focus:border-rose-400"
                />
                <span className="text-slate-400 text-[10px]">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-[11px] text-slate-700 focus:outline-none focus:border-rose-400"
                />
              </div>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 font-medium focus:outline-none focus:border-rose-400 cursor-pointer"
          >
            <option value="ALL">🏷️ สถานะทั้งหมด</option>
            <option value="PENDING">⏳ รอดำเนินการ</option>
            <option value="APPROVED">✓ อนุมัติแล้ว</option>
            <option value="PAID">✓ ชำระแล้ว</option>
            <option value="OVERDUE">⚠️ เกินกำหนด</option>
            <option value="CANCELLED">✕ ยกเลิก</option>
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition"
              title="ล้างตัวกรองทั้งหมด"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Total Amount Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-xs flex items-center gap-1.5 shadow-sm">
            <span className="text-emerald-700 font-semibold text-[11px]">ยอดรวมในแท็บนี้:</span>
            <span className="font-bold text-emerald-800 font-mono text-xs sm:text-sm">฿{formatMoney(totalFilteredNet)}</span>
          </div>

        </div>

      </div>

      {/* ── EXPENSE TABLE WITH INTEGRATED TYPE TABS ─────────────────────────── */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-sm border border-slate-200">
        
        {/* Table Type Tabs Header */}
        <div className="bg-slate-50/80 border-b border-slate-200 p-2 sm:p-3">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {tableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTypeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTypeTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                    isActive
                      ? `${tab.activeColor} shadow-md`
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100/80 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isActive ? tab.badgeActive : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Content */}
        <div className="p-3 sm:p-5 space-y-4">
          <div className="table-scroll max-h-[620px] rounded-2xl border border-slate-200 shadow-inner">
            <table className="w-full text-left text-xs min-w-[860px]">
              <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm text-slate-600 font-semibold border-b border-slate-200 shadow-sm">
                <tr>
                  <th className="py-3 px-4">เลขที่เอกสาร</th>
                  <th className="py-3 px-4">ประเภท</th>
                  <th className="py-3 px-4">ซัพพลายเออร์ / ผู้จำหน่าย</th>
                  <th className="py-3 px-4">วันที่สั่ง / กำหนดส่งมอบ</th>
                  <th className="py-3 px-4 text-right">ยอดรวม (VAT 7%)</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-medium">
                        ไม่พบรายการเอกสารในแท็บ &quot;{tableTabs.find(t => t.id === activeTypeTab)?.label}&quot; ตามเงื่อนไขที่เลือก
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs border border-rose-200 hover:bg-rose-100 transition"
                        >
                          ล้างตัวกรองทั้งหมด
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => {
                    const badge = getStatusBadge(doc.status);
                    return (
                      <tr key={doc.id} className="hover:bg-rose-50/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {doc.documentNo}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                              doc.type === 'PURCHASE_ORDER'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : doc.type === 'PURCHASE_INVOICE'
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : doc.type === 'PAYMENT_VOUCHER'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {doc.type === 'PURCHASE_ORDER'
                              ? 'ใบสั่งซื้อ (PO)'
                              : doc.type === 'PURCHASE_INVOICE'
                              ? 'ใบแจ้งหนี้ซื้อ'
                              : doc.type === 'PAYMENT_VOUCHER'
                              ? 'ใบสำคัญจ่าย'
                              : '50 ทวิ'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-slate-800 truncate">
                            {doc.contact?.companyName || '-'}
                          </div>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {doc.contact?.name || ''} {doc.contact?.phone ? `(${doc.contact.phone})` : ''}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{formatThaiDate(doc.issueDate)}</div>
                          <span className="text-[10px] text-slate-400">ครบกำหนด: {formatThaiDate(doc.dueDate)}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                          <div>{formatMoney(doc.grandTotal)}</div>
                          {doc.withholdingTaxTotal > 0 && (
                            <span className="text-[10px] text-rose-500 block font-normal">
                              หัก ณ ที่จ่าย: -{formatMoney(doc.withholdingTaxTotal)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {doc.status === 'PENDING' && (
                              <button
                                onClick={() => onUpdateStatus(doc.id, 'PAID')}
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold transition whitespace-nowrap"
                                title="เปลี่ยนเป็นชำระแล้ว"
                              >
                                ✓ ชำระแล้ว
                              </button>
                            )}
                            <button
                              onClick={() => openViewDocument(doc)}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-500 transition shadow-sm"
                              title="ดูตัวอย่าง / พิมพ์เอกสาร"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditDocument(doc)}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 text-slate-500 transition shadow-sm"
                              title="แก้ไขเอกสาร"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(doc)}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-500 transition shadow-sm"
                              title="ลบเอกสาร"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary Bar */}
          {filteredDocs.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 font-medium">
                แสดงผล <span className="font-bold text-slate-800">{filteredDocs.length}</span> รายการ ในแท็บ <span className="font-bold text-rose-600">{tableTabs.find(t => t.id === activeTypeTab)?.label}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400">VAT 7%: </span>
                  <span className="font-bold text-slate-700">฿{formatMoney(totalInputVat)}</span>
                </div>
                <div>
                  <span className="text-slate-400">ยอดรวมทั้งสิ้น: </span>
                  <span className="font-bold text-slate-800">฿{formatMoney(totalExpenseAmount)}</span>
                </div>
                <div className="px-3 py-1 rounded-xl bg-emerald-100/80 text-emerald-800 font-bold border border-emerald-200">
                  <span>จ่ายสุทธิ: ฿{formatMoney(totalFilteredNet)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Delete Confirmation Modal ───────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยืนยันการลบเอกสารรายจ่าย</h3>
                <p className="text-xs text-rose-600 font-medium mt-0.5">
                  ระบบจะลบข้อมูลออกจากฐานข้อมูลอย่างถาวร (ไม่สามารถย้อนกลับได้)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ประเภทเอกสาร:</span>
                <span className="font-bold text-slate-800">
                  {deleteTarget.type === 'PURCHASE_ORDER'
                    ? 'ใบสั่งซื้อ (PO)'
                    : deleteTarget.type === 'PURCHASE_INVOICE'
                    ? 'ใบแจ้งหนี้ซื้อ (PINV)'
                    : deleteTarget.type === 'PAYMENT_VOUCHER'
                    ? 'ใบสำคัญจ่าย (PV)'
                    : 'หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">เลขที่เอกสาร:</span>
                <span className="font-mono font-bold text-rose-700">{deleteTarget.documentNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ซัพพลายเออร์:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                  {deleteTarget.contact?.companyName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">วันที่ออกเอกสาร:</span>
                <span className="text-slate-700">{formatThaiDate(deleteTarget.issueDate)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-rose-200 pt-2 font-bold text-sm">
                <span className="text-rose-800">มูลค่ารวมทั้งสิ้น:</span>
                <span className="font-mono text-rose-700">{formatMoney(deleteTarget.grandTotal)}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteDocument(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-100 transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบออกจากฐานข้อมูล</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
