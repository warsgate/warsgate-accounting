import React, { useState } from "react";
import { 
  FileText, Plus, Search, Filter, Printer, Eye, CheckCircle2, 
  Clock, AlertCircle, Calendar, ShieldCheck, DollarSign, 
  Building2, Layers, Check, X, ArrowUpRight, Sparkles,
  ChevronDown, ChevronUp, Download, Receipt, Landmark,
  Send, UserCheck, CreditCard, Award, HelpCircle
} from "lucide-react";
import { 
  AccountingDocument, Contact, CompanyProfile, 
  BillingNote, BillingNoteItem, WarrantyRetentionItem, WarrantyStatus 
} from "../../types";
import { 
  formatMoney, formatThaiDate, arabicToThaiBahtText, getProjectName 
} from "../../utils/formatters";

interface BillingNoteViewProps {
  documents: AccountingDocument[];
  contacts: Contact[];
  company: CompanyProfile;
  billingNotes: BillingNote[];
  setBillingNotes: React.Dispatch<React.SetStateAction<BillingNote[]>>;
  warrantyRetentions: WarrantyRetentionItem[];
  setWarrantyRetentions: React.Dispatch<React.SetStateAction<WarrantyRetentionItem[]>>;
  setActiveTab: (tab: string) => void;
  openCreateModal: (type: "QUOTATION" | "INVOICE" | "RECEIPT" | "PURCHASE_ORDER", defaultPoNo?: string, defaultContact?: Contact) => void;
  openViewDocument: (doc: AccountingDocument) => void;
}

export const BillingNoteView: React.FC<BillingNoteViewProps> = ({
  documents = [],
  contacts = [],
  company,
  billingNotes = [],
  setBillingNotes,
  warrantyRetentions = [],
  setWarrantyRetentions,
  setActiveTab,
  openCreateModal,
  openViewDocument,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<"BILLING_NOTES" | "RETENTIONS">("BILLING_NOTES");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedNoteForPrint, setSelectedNoteForPrint] = useState<BillingNote | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({
    "bn-2608-001": true
  });

  // Create Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(contacts[0]?.id || "");
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [chequeDate, setChequeDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  const toggleExpand = (noteId: string) => {
    setExpandedNotes(prev => ({
      ...prev,
      [noteId]: !prev[noteId]
    }));
  };

  // Filter available invoices for customer in create modal
  const customerInvoices = documents.filter(doc => 
    (doc.type === "INVOICE" || doc.type === "TAX_INVOICE") &&
    doc.status !== "CANCELLED" &&
    doc.contact?.id === selectedCustomerId
  );

  // Calculate totals for create modal
  const selectedInvoicesList = customerInvoices.filter(inv => selectedInvoiceIds.includes(inv.id));
  const modalSubtotal = selectedInvoicesList.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
  const modalVatAmount = selectedInvoicesList.reduce((sum, inv) => sum + (inv.vatAmount || 0), 0);
  const modalWhtAmount = selectedInvoicesList.reduce((sum, inv) => sum + (inv.withholdingTaxTotal || 0), 0);
  const modalGrandTotal = selectedInvoicesList.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const modalNetPayment = selectedInvoicesList.reduce((sum, inv) => sum + (inv.netPayment || (inv.grandTotal - (inv.withholdingTaxTotal || 0))), 0);

  const handleToggleSelectInvoice = (invId: string) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(invId) ? prev.filter(id => id !== invId) : [...prev, invId]
    );
  };

  const handleSelectAllInvoices = () => {
    if (selectedInvoiceIds.length === customerInvoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(customerInvoices.map(inv => inv.id));
    }
  };

  const handleCreateBillingNote = () => {
    if (selectedInvoicesList.length === 0) {
      alert("กรุณาเลือกใบแจ้งหนี้อย่างน้อย 1 รายการเพื่อออกใบวางบิล");
      return;
    }

    const customer = contacts.find(c => c.id === selectedCustomerId);
    if (!customer) {
      alert("ไม่พบข้อมูลลูกค้า");
      return;
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    const count = billingNotes.length + 1;
    const documentNo = `BN-${String(currentYear + 543).slice(-2)}${currentMonth}-${String(count).padStart(3, "0")}`;

    const items: BillingNoteItem[] = selectedInvoicesList.map(inv => ({
      invoiceId: inv.id,
      invoiceDocNo: inv.documentNo,
      referencePoNo: inv.referencePoNo,
      projectName: getProjectName(inv),
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      subtotal: inv.subtotal || (inv.grandTotal / 1.07),
      vatAmount: inv.vatAmount || 0,
      whtAmount: inv.withholdingTaxTotal || 0,
      grandTotal: inv.grandTotal,
      netPayment: inv.netPayment || (inv.grandTotal - (inv.withholdingTaxTotal || 0)),
    }));

    const newNote: BillingNote = {
      id: `bn-${Date.now()}`,
      documentNo,
      issueDate,
      dueDate,
      contact: customer,
      items,
      subtotal: modalSubtotal,
      vatAmount: modalVatAmount,
      whtAmount: modalWhtAmount,
      grandTotal: modalGrandTotal,
      netPayment: modalNetPayment,
      notes: notes || `ใบวางบิลรวม ${items.length} รายการ โครงการ ${customer.companyName}`,
      status: "PENDING",
      chequeDate: chequeDate || undefined,
      createdAt: new Date().toISOString()
    };

    const updated = [newNote, ...billingNotes];
    setBillingNotes(updated);
    localStorage.setItem("warsgate_billing_notes", JSON.stringify(updated));
    setIsCreateModalOpen(false);
    setSelectedInvoiceIds([]);
    setNotes("");
    setExpandedNotes(prev => ({ ...prev, [newNote.id]: true }));
  };

  const handleUpdateStatus = (noteId: string, newStatus: "PENDING" | "ACCEPTED" | "PAID" | "CANCELLED") => {
    const updated = billingNotes.map(n => n.id === noteId ? { ...n, status: newStatus } : n);
    setBillingNotes(updated);
    localStorage.setItem("warsgate_billing_notes", JSON.stringify(updated));
  };

  const handleUpdateRetentionStatus = (retId: string, newStatus: WarrantyStatus) => {
    const updated = warrantyRetentions.map(r => r.id === retId ? { ...r, status: newStatus } : r);
    setWarrantyRetentions(updated);
    localStorage.setItem("warsgate_warranty_retentions", JSON.stringify(updated));
  };

  // KPIs
  const totalBillingNotesCount = billingNotes.length;
  const totalPendingBilling = billingNotes
    .filter(n => n.status === "PENDING" || n.status === "ACCEPTED")
    .reduce((sum, n) => sum + n.netPayment, 0);
  const totalPaidBilling = billingNotes
    .filter(n => n.status === "PAID")
    .reduce((sum, n) => sum + n.netPayment, 0);

  const totalRetentionMonitored = warrantyRetentions.reduce((sum, r) => sum + r.retentionAmount, 0);
  const totalRetentionDue = warrantyRetentions
    .filter(r => r.status === "DUE_FOR_RELEASE")
    .reduce((sum, r) => sum + r.retentionAmount, 0);

  // Filtered Notes
  const filteredBillingNotes = billingNotes.filter(note => {
    if (statusFilter !== "ALL" && note.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchDocNo = note.documentNo.toLowerCase().includes(term);
      const matchCustomer = note.contact?.companyName?.toLowerCase().includes(term);
      const matchInv = note.items.some(i => i.invoiceDocNo.toLowerCase().includes(term) || (i.projectName || "").toLowerCase().includes(term));
      if (!matchDocNo && !matchCustomer && !matchInv) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-indigo-900/40">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              BILLING NOTE & RETENTION MANAGEMENT
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              ระบบใบวางบิลรวม & เงินประกันผลงาน
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              สร้างใบวางบิลรวม (Statement of Account) สำหรับส่งลูกค้าองค์กร และติดตามเงินประกันผลงาน (Retention 5%) พร้อมสัญญาประกันเครื่องจักร 1 ปี
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างใบวางบิลรวมใหม่</span>
            </button>
            <button
              onClick={() => setActiveTab("customer-balances")}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 flex items-center gap-2 transition active:scale-95"
            >
              <Building2 className="w-4 h-4 text-indigo-300" />
              <span>เจาะลึก 7 PO</span>
            </button>
          </div>
        </div>

        {/* Highlight Summary Mini-Bar */}
        <div className="mt-6 pt-5 border-t border-indigo-800/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-slate-400 block text-[11px] font-medium">📋 ใบวางบิลทั้งหมด</span>
            <span className="font-extrabold font-mono text-base block mt-0.5 text-white">{totalBillingNotesCount} ฉบับ</span>
            <span className="text-[10px] text-indigo-300 font-medium">ออกรวมหลายใบแจ้งหนี้</span>
          </div>

          <div className="bg-amber-500/20 backdrop-blur-md rounded-2xl p-3.5 border border-amber-400/30 text-white shadow-inner">
            <span className="text-amber-200 block text-[11px] font-bold">⏳ ยอดวางบิลรอนัดชำระ</span>
            <span className="font-black font-mono text-base block mt-0.5 text-amber-300">฿{formatMoney(totalPendingBilling)}</span>
            <span className="text-[10px] text-amber-200 font-medium">รอโอน / รอจ่ายเช็ค</span>
          </div>

          <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-3.5 border border-emerald-400/30 text-white shadow-inner">
            <span className="text-emerald-200 block text-[11px] font-bold">💵 วางบิลและรับเงินแล้ว</span>
            <span className="font-black font-mono text-base block mt-0.5 text-emerald-300">฿{formatMoney(totalPaidBilling)}</span>
            <span className="text-[10px] text-emerald-200 font-medium">ชำระเงินครบถ้วน</span>
          </div>

          <div className="bg-indigo-500/20 backdrop-blur-md rounded-2xl p-3.5 border border-indigo-400/30 text-white shadow-inner">
            <span className="text-indigo-200 block text-[11px] font-bold">🛡️ เงินประกันผลงาน (Retention)</span>
            <span className="font-black font-mono text-base block mt-0.5 text-indigo-300">฿{formatMoney(totalRetentionMonitored)}</span>
            <span className="text-[10px] text-indigo-200 font-medium">7 สัญญาประกัน 1 ปี</span>
          </div>
        </div>
      </div>

      {/* ── Main Tab Navigation Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMainTab("BILLING_NOTES")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeMainTab === "BILLING_NOTES"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>ใบวางบิลรวม (Billing Notes)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeMainTab === "BILLING_NOTES" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              {billingNotes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab("RETENTIONS")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeMainTab === "RETENTIONS"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>เงินประกันผลงาน & สัญญาประกัน (Retention 5%)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeMainTab === "RETENTIONS" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              7 โครงการ
            </span>
          </button>
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>พิมพ์รายงาน</span>
        </button>
      </div>

      {/* ── TAB 1: BILLING NOTES VIEW ────────────────────────────────────────── */}
      {activeMainTab === "BILLING_NOTES" && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="glass-panel p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm border border-slate-200 bg-white">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ค้นหาเลขที่ใบวางบิล, ชื่อลูกค้า, เลขที่ใบแจ้งหนี้..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  statusFilter === "ALL" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setStatusFilter("PENDING")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  statusFilter === "PENDING" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                รอนัดชำระ (Pending)
              </button>
              <button
                onClick={() => setStatusFilter("ACCEPTED")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  statusFilter === "ACCEPTED" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                รับวางบิลแล้ว (Accepted)
              </button>
              <button
                onClick={() => setStatusFilter("PAID")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  statusFilter === "PAID" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ชำระแล้ว (Paid)
              </button>
            </div>
          </div>

          {/* List of Billing Notes */}
          <div className="space-y-4">
            {filteredBillingNotes.length === 0 ? (
              <div className="text-center py-16 text-slate-400 glass-panel rounded-3xl bg-white border border-slate-200">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">ยังไม่มีรายการใบวางบิลในเงื่อนไขนี้</p>
                <p className="text-xs mt-1">คลิกปุ่ม "สร้างใบวางบิลรวมใหม่" เพื่อรวบรวมใบแจ้งหนี้ส่งลูกค้า</p>
              </div>
            ) : (
              filteredBillingNotes.map(note => {
                const isExpanded = expandedNotes[note.id] !== false;

                let statusBadge = (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> รอนัดชำระเงิน
                  </span>
                );
                if (note.status === "ACCEPTED") {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> ลูกค้ารับวางบิลแล้ว
                    </span>
                  );
                } else if (note.status === "PAID") {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> รับชำระเงินเรียบร้อย
                    </span>
                  );
                }

                return (
                  <div 
                    key={note.id}
                    className="glass-panel rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
                  >
                    {/* Note Card Header */}
                    <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50 border-b border-slate-100">
                      <div className="flex items-start gap-3.5">
                        <button 
                          onClick={() => toggleExpand(note.id)}
                          className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-500 mt-0.5 hover:bg-slate-100 transition"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {note.documentNo}
                            </span>
                            {statusBadge}
                            <span className="text-xs text-slate-500 font-mono">
                              วันที่ออก: {formatThaiDate(note.issueDate)}
                            </span>
                            <span className="text-xs text-indigo-700 font-semibold font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              กำหนดชำระ: {formatThaiDate(note.dueDate)}
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-slate-900 mt-1.5 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>{note.contact.companyName}</span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            รวมใบแจ้งหนี้ {note.items.length} ฉบับ • {note.notes || "วางบิลตามรอบสัญญา"}
                          </p>
                        </div>
                      </div>

                      {/* Amounts & Actions */}
                      <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 pl-11 lg:pl-0">
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 block font-medium">ยอดเรียกเก็บสุทธิ (หัก 3%)</span>
                          <span className="font-mono font-black text-lg text-slate-900">
                            ฿{formatMoney(note.netPayment)}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            (ยอดรวม VAT: ฿{formatMoney(note.grandTotal)})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedNoteForPrint(note)}
                            className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 border border-indigo-200 transition active:scale-95 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ดู / พิมพ์ใบวางบิล</span>
                          </button>

                          {note.status === "PENDING" && (
                            <button
                              onClick={() => handleUpdateStatus(note.id, "ACCEPTED")}
                              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
                              title="เปลี่ยนสถานะเป็นรับวางบิลแล้ว"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>ลูกค้ารับวางบิล</span>
                            </button>
                          )}

                          {note.status !== "PAID" && (
                            <button
                              onClick={() => handleUpdateStatus(note.id, "PAID")}
                              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
                              title="บันทึกว่าได้รับชำระเงินเรียบร้อย"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>รับเงินแล้ว</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Items Table */}
                    {isExpanded && (
                      <div className="p-5 pt-3 space-y-3 bg-white">
                        <span className="text-xs font-bold text-slate-700 block">
                          📄 รายการใบแจ้งหนี้ในใบวางบิลนี้ ({note.items.length} ฉบับ):
                        </span>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                          <table className="w-full text-left text-xs min-w-[700px]">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-3 w-12 text-center">#</th>
                                <th className="py-2.5 px-3">เลขที่ใบแจ้งหนี้</th>
                                <th className="py-2.5 px-3">โครงการ / สัญญา PO</th>
                                <th className="py-2.5 px-3 text-center">วันที่ออก</th>
                                <th className="py-2.5 px-3 text-center">วันครบกำหนด</th>
                                <th className="py-2.5 px-3 text-right">ยอดก่อนภาษี</th>
                                <th className="py-2.5 px-3 text-right">VAT 7%</th>
                                <th className="py-2.5 px-3 text-right">หัก ณ ที่จ่าย 3%</th>
                                <th className="py-2.5 px-3 text-right">ยอดสุทธิ (บาท)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {note.items.map((item, idx) => (
                                <tr key={item.invoiceId || idx} className="hover:bg-slate-50 transition">
                                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{item.invoiceDocNo}</td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                                    <div>
                                      <span>{item.projectName}</span>
                                      {item.referencePoNo && (
                                        <span className="block text-[10px] text-slate-400 font-mono">PO: {item.referencePoNo}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{formatThaiDate(item.issueDate)}</td>
                                  <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{formatThaiDate(item.dueDate)}</td>
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">฿{formatMoney(item.subtotal)}</td>
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">฿{formatMoney(item.vatAmount)}</td>
                                  <td className="py-2.5 px-3 text-right font-mono text-rose-600">-฿{formatMoney(item.whtAmount)}</td>
                                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">฿{formatMoney(item.netPayment)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                              <tr>
                                <td colSpan={5} className="py-2.5 px-3 text-right text-slate-600">รวมยอดทั้งสิ้น (Total):</td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-800">฿{formatMoney(note.subtotal)}</td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-800">฿{formatMoney(note.vatAmount)}</td>
                                <td className="py-2.5 px-3 text-right font-mono text-rose-600">-฿{formatMoney(note.whtAmount)}</td>
                                <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-700 text-sm">฿{formatMoney(note.netPayment)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* ── TAB 2: WARRANTY & RETENTION TRACKING ───────────────────────────────── */}
      {activeMainTab === "RETENTIONS" && (
        <div className="space-y-6">
          
          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-indigo-950">
                  ระบบติดตามเงินประกันผลงาน (Retention 5%) & การรับประกัน 1 ปี
                </h3>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  สัญญาโครงการประกอบเครื่องจักรและซอฟต์แวร์ของ WARSGATE มีการกันเงินประกันผลงาน 5% เป็นระยะเวลา 1 ปี นับจากวันตรวจรับงาน SAT
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] text-indigo-800 font-semibold block">มูลค่าเงินประกันรวม 7 โครงการ</span>
              <span className="text-lg font-black font-mono text-indigo-950">฿{formatMoney(totalRetentionMonitored)}</span>
            </div>
          </div>

          {/* Retention Cards Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">โครงการ / สัญญา PO</th>
                  <th className="py-3.5 px-4">ลูกค้าองค์กร</th>
                  <th className="py-3.5 px-4 text-right">มูลค่าสัญญาสุทธิ</th>
                  <th className="py-3.5 px-4 text-center">สัดส่วน Retention</th>
                  <th className="py-3.5 px-4 text-right">ยอดเงินประกันผลงาน</th>
                  <th className="py-3.5 px-4 text-center">ระยะเวลารับประกัน</th>
                  <th className="py-3.5 px-4 text-center">สถานะประกัน</th>
                  <th className="py-3.5 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {warrantyRetentions.map(ret => {
                  let badge = (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-sky-600" /> อยู่ในระยะประกัน 1 ปี
                    </span>
                  );

                  if (ret.status === "DUE_FOR_RELEASE") {
                    badge = (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center gap-1 animate-pulse">
                        <AlertCircle className="w-3 h-3 text-amber-600" /> ครบกำหนดปลดประกัน
                      </span>
                    );
                  } else if (ret.status === "RELEASED") {
                    badge = (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ได้รับเงินประกันคืนแล้ว
                      </span>
                    );
                  }

                  return (
                    <tr key={ret.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{ret.projectName}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            PO: {ret.referencePoNo}
                          </span>
                          {ret.projectCode && (
                            <span className="text-[10px] text-slate-400 font-mono">{ret.projectCode}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {ret.customerContact.companyName}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                        ฿{formatMoney(ret.contractAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-600">
                        {ret.retentionPercent}%
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-black text-indigo-700 text-sm">
                        ฿{formatMoney(ret.retentionAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-600">
                        <div>{formatThaiDate(ret.warrantyStartDate)}</div>
                        <div className="text-[10px] text-slate-400">ถึง {formatThaiDate(ret.warrantyEndDate)}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {badge}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {ret.status === "UNDER_WARRANTY" ? (
                          <button
                            onClick={() => handleUpdateRetentionStatus(ret.id, "DUE_FOR_RELEASE")}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold transition active:scale-95 shadow-xs"
                          >
                            จำลองครบกำหนด
                          </button>
                        ) : ret.status === "DUE_FOR_RELEASE" ? (
                          <button
                            onClick={() => {
                              openCreateModal("INVOICE", ret.referencePoNo, ret.customerContact);
                              handleUpdateRetentionStatus(ret.id, "RELEASED");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition active:scale-95 mx-auto"
                          >
                            <Plus className="w-3 h-3" />
                            <span>ออก INV เงินประกัน</span>
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold text-[11px]">เสร็จสิ้น 100%</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ── MODAL 1: CREATE BILLING NOTE MODAL ───────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">สร้างใบวางบิลรวมใหม่ (Billing Note)</h3>
                  <p className="text-xs text-slate-500">รวบรวมใบแจ้งหนี้ค้างชำระเพื่อส่งวางบิลให้ลูกค้าองค์กร</p>
                </div>
              </div>

              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Customer Selection & Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5 sm:col-span-3">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>เลือกลูกค้าองค์กร:</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={e => {
                    setSelectedCustomerId(e.target.value);
                    setSelectedInvoiceIds([]);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 focus:outline-none focus:border-indigo-500 transition"
                >
                  {contacts.filter(c => c.type === "CUSTOMER" || c.type === "BOTH").map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} (Tax ID: {c.taxId || "-"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>วันที่ออกใบวางบิล:</span>
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>วันครบกำหนดชำระ:</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>วันนัดจ่ายเช็ค (ถ้ามี):</span>
                </label>
                <input
                  type="date"
                  value={chequeDate}
                  onChange={e => setChequeDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Step 2: Invoice Picker Table */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>เลือกใบแจ้งหนี้ที่ต้องการวางบิล ({selectedInvoiceIds.length}/{customerInvoices.length} ฉบับ):</span>
                </label>

                {customerInvoices.length > 0 && (
                  <button
                    onClick={handleSelectAllInvoices}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    {selectedInvoiceIds.length === customerInvoices.length ? "ยกเลิกเลือกทั้งหมด" : "เลือกทั้งหมด"}
                  </button>
                )}
              </div>

              {customerInvoices.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  ไม่พบใบแจ้งหนี้ที่ยังไม่ได้ชำระของลูกค้ารายนี้
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-56">
                  <table className="w-full text-left text-xs min-w-[550px]">
                    <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">เลือก</th>
                        <th className="py-2.5 px-3">เลขที่ INV</th>
                        <th className="py-2.5 px-3">โครงการ / PO</th>
                        <th className="py-2.5 px-3 text-center">วันที่ออก</th>
                        <th className="py-2.5 px-3 text-right">ยอดรวม (บาท)</th>
                        <th className="py-2.5 px-3 text-right">ยอดสุทธิ (หัก 3%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerInvoices.map(inv => {
                        const isSelected = selectedInvoiceIds.includes(inv.id);
                        return (
                          <tr 
                            key={inv.id} 
                            onClick={() => handleToggleSelectInvoice(inv.id)}
                            className={`cursor-pointer transition ${
                              isSelected ? "bg-indigo-50/70 font-semibold" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{inv.documentNo}</td>
                            <td className="py-2.5 px-3 text-slate-800">{getProjectName(inv)}</td>
                            <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{formatThaiDate(inv.issueDate)}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">฿{formatMoney(inv.grandTotal)}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-900">
                              ฿{formatMoney(inv.netPayment || (inv.grandTotal - (inv.withholdingTaxTotal || 0)))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Step 3: Summary Totals Card */}
            {selectedInvoicesList.length > 0 && (
              <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-inner">
                <div>
                  <span className="font-bold text-indigo-950 block">สรุปยอดรวมใบวางบิล ({selectedInvoicesList.length} ใบแจ้งหนี้):</span>
                  <span className="text-[11px] text-indigo-700">
                    ยอดก่อนภาษี: ฿{formatMoney(modalSubtotal)} | VAT 7%: ฿{formatMoney(modalVatAmount)} | หัก 3%: ฿{formatMoney(modalWhtAmount)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-indigo-800 block font-bold">ยอดเรียกเก็บสุทธิ</span>
                  <span className="text-lg font-black font-mono text-indigo-950">฿{formatMoney(modalNetPayment)}</span>
                </div>
              </div>
            )}

            {/* Note Textarea */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700">หมายเหตุ / เงื่อนไขวางบิล:</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="ระบุข้อความเพิ่มเติมหรือเงื่อนไขการโอนเงิน..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreateBillingNote}
                disabled={selectedInvoicesList.length === 0}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition ${
                  selectedInvoicesList.length > 0
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95 cursor-pointer"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
              >
                <Check className="w-4 h-4" />
                <span>ยืนยันสร้างใบวางบิล</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL 2: PRINTABLE BILLING NOTE (OFFICIAL THAI FORM) ──────────────── */}
      {selectedNoteForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-10 shadow-2xl border border-slate-200 space-y-6 my-8 print:p-0 print:border-none print:shadow-none">
            
            {/* Modal Action Header (Hidden in Print) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  ตัวอย่างเอกสารใบวางบิล (Billing Note Preview)
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/30 transition active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์ใบวางบิล (Print)</span>
                </button>
                <button
                  onClick={() => setSelectedNoteForPrint(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Thai Billing Note Paper Layout */}
            <div className="space-y-6 text-slate-900">
              
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 pb-5 border-b-2 border-slate-900">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xl tracking-tight text-indigo-900">บริษัท วอร์สเกต จำกัด</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border">
                      สำนักงานใหญ่
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                    {company.address}
                  </p>
                  <p className="text-xs text-slate-600 font-mono">
                    โทร: {company.phone} • เลขประจำตัวผู้เสียภาษี: <span className="font-bold text-slate-900">{company.taxId}</span>
                  </p>
                </div>

                <div className="text-right sm:min-w-[220px]">
                  <h2 className="text-2xl font-black text-indigo-950 tracking-tight">ใบวางบิล</h2>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">BILLING NOTE / STATEMENT</div>
                  
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-left font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">เลขที่:</span>
                      <span className="font-extrabold text-indigo-900">{selectedNoteForPrint.documentNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">วันที่:</span>
                      <span>{formatThaiDate(selectedNoteForPrint.issueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">กำหนดชำระ:</span>
                      <span className="font-bold text-rose-700">{formatThaiDate(selectedNoteForPrint.dueDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">ชื่อลูกค้า / ผู้วางบิลถึง:</span>
                  <span className="font-extrabold text-sm text-slate-900 block mt-0.5">
                    {selectedNoteForPrint.contact.companyName}
                  </span>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    {selectedNoteForPrint.contact.address}
                  </p>
                </div>
                <div className="space-y-1 font-mono sm:text-right">
                  <div>
                    <span className="text-slate-500 font-sans">เลขประจำตัวผู้เสียภาษี: </span>
                    <span className="font-bold text-slate-900">{selectedNoteForPrint.contact.taxId || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans">สาขา: </span>
                    <span>{selectedNoteForPrint.contact.branchCode === "00000" ? "สำนักงานใหญ่" : selectedNoteForPrint.contact.branchCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans">โทร: </span>
                    <span>{selectedNoteForPrint.contact.phone || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3 text-center border-r border-slate-300 w-12">ลำดับ</th>
                      <th className="py-2 px-3 border-r border-slate-300">เลขที่ใบแจ้งหนี้</th>
                      <th className="py-2 px-3 border-r border-slate-300">โครงการ / เลขที่ PO</th>
                      <th className="py-2 px-3 text-center border-r border-slate-300 w-24">วันที่เอกสาร</th>
                      <th className="py-2 px-3 text-center border-r border-slate-300 w-24">วันครบกำหนด</th>
                      <th className="py-2 px-3 text-right border-r border-slate-300 w-28">ยอดก่อนภาษี</th>
                      <th className="py-2 px-3 text-right border-r border-slate-300 w-24">ภาษี 7%</th>
                      <th className="py-2 px-3 text-right border-r border-slate-300 w-24">หัก 3%</th>
                      <th className="py-2 px-3 text-right w-32">จำนวนเงินสุทธิ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedNoteForPrint.items.map((item, idx) => (
                      <tr key={item.invoiceId || idx}>
                        <td className="py-2.5 px-3 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 border-r border-slate-200">{item.invoiceDocNo}</td>
                        <td className="py-2.5 px-3 border-r border-slate-200">
                          <span className="font-semibold text-slate-800 block">{item.projectName}</span>
                          {item.referencePoNo && <span className="text-[10px] text-slate-500 font-mono">PO: {item.referencePoNo}</span>}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600 border-r border-slate-200">{formatThaiDate(item.issueDate)}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600 border-r border-slate-200">{formatThaiDate(item.dueDate)}</td>
                        <td className="py-2.5 px-3 text-right font-mono border-r border-slate-200">฿{formatMoney(item.subtotal)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 border-r border-slate-200">฿{formatMoney(item.vatAmount)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600 border-r border-slate-200">-฿{formatMoney(item.whtAmount)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">฿{formatMoney(item.netPayment)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-400">
                    <tr>
                      <td colSpan={5} className="py-2.5 px-3 text-right text-slate-700 border-r border-slate-300">
                        รวมยอดทั้งสิ้น (Grand Total):
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-slate-300">฿{formatMoney(selectedNoteForPrint.subtotal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-slate-300">฿{formatMoney(selectedNoteForPrint.vatAmount)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 border-r border-slate-300">-฿{formatMoney(selectedNoteForPrint.whtAmount)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-900 text-sm">
                        ฿{formatMoney(selectedNoteForPrint.netPayment)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Thai Baht Text Box */}
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600">จำนวนเงินตัวอักษร:</span>
                <span className="text-indigo-900 font-extrabold font-mono">
                  ({arabicToThaiBahtText(selectedNoteForPrint.netPayment)})
                </span>
              </div>

              {/* Bank Transfer Instructions */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs space-y-1">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ช่องทางการชำระเงิน (โอนเข้าบัญชี บจก.วอร์สเกต):</span>
                </span>
                <p className="text-[11px] text-indigo-900 font-mono">
                  • ธนาคารกสิกรไทย (KBANK) สาขาบิ๊กซี ประชาอุทิศ 90 เลขที่บัญชี: <span className="font-bold">144-8-72670-3</span>
                </p>
                <p className="text-[11px] text-indigo-900 font-mono">
                  • ธนาคารไทยพาณิชย์ (SCB) สาขาเทสโก้ โลตัส ประชาอุทิศ เลขที่บัญชี: <span className="font-bold">429-195973-7</span>
                </p>
              </div>

              {/* Signatures & Check Date Section */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs">
                
                {/* Receiver Box */}
                <div className="p-4 rounded-2xl border border-slate-300 text-center space-y-3">
                  <span className="font-bold text-slate-800 block">สำหรับลูกค้า (ผู้รับวางบิล)</span>
                  <div className="pt-8 border-b border-slate-400 max-w-[180px] mx-auto" />
                  <div className="text-[11px] text-slate-600 font-medium">
                    (......................................................)
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    วันที่นัดชำระเงิน / จ่ายเช็ค: ....../……/……
                  </div>
                </div>

                {/* Issuer Box */}
                <div className="p-4 rounded-2xl border border-slate-300 text-center space-y-3">
                  <span className="font-bold text-slate-800 block">ในนาม บริษัท วอร์สเกต จำกัด (ผู้วางบิล)</span>
                  <div className="pt-8 border-b border-slate-400 max-w-[180px] mx-auto" />
                  <div className="text-[11px] text-slate-600 font-medium">
                    (......................................................)
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    ผู้วางบิล / วันที่: ....../……/……
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
