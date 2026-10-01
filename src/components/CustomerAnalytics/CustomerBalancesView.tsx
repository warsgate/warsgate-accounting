import React, { useState } from "react";
import { 
  Building2, FileText, Clock, CheckCircle2, AlertCircle, 
  Search, ArrowUpRight, Eye, Plus, Printer, ChevronDown, 
  ChevronUp, Sparkles, Filter, Layers, DollarSign, Wallet,
  Calendar, CheckCircle, ExternalLink, ArrowRight, TrendingUp,
  Receipt, Landmark, ShieldCheck, Target, LayoutGrid
} from "lucide-react";
import { AccountingDocument, Contact, CompanyProfile, ContractMilestonePlan, ProjectMilestone } from "../../types";
import { formatMoney, formatThaiDate, getProjectName } from "../../utils/formatters";

interface CustomerBalancesViewProps {
  documents: AccountingDocument[];
  contacts: Contact[];
  company: CompanyProfile;
  milestonePlans?: ContractMilestonePlan[];
  setActiveTab: (tab: string) => void;
  openCreateModal: (type: "QUOTATION" | "INVOICE" | "RECEIPT" | "PURCHASE_ORDER", defaultPoNo?: string, defaultContact?: Contact) => void;
  openViewDocument: (doc: AccountingDocument) => void;
}

export const CustomerBalancesView: React.FC<CustomerBalancesViewProps> = ({
  documents = [],
  contacts = [],
  company,
  milestonePlans = [],
  setActiveTab,
  openCreateModal,
  openViewDocument,
}) => {
  const [viewMode, setViewMode] = useState<"SINGLE" | "MATRIX" | "ALL">("SINGLE");
  const [selectedPoNo, setSelectedPoNo] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNBILLED_ONLY" | "COMPLETED">("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [singleActiveTab, setSingleActiveTab] = useState<"MILESTONES" | "DOCS">("MILESTONES");
  const [expandedPOs, setExpandedPOs] = useState<Record<string, boolean>>({
    "2505004": true,
    "2607001": true,
    "2605001": true,
    "PO252155": true,
    "2605002": true,
    "2609002": true,
    "2505005": false,
  });

  const toggleExpand = (poNo: string) => {
    setExpandedPOs(prev => ({
      ...prev,
      [poNo]: !prev[poNo]
    }));
  };

  // 1. Gather all POs from QUOTATION documents with referencePoNo
  const poDocuments = (documents || []).filter(
    d => d.type === "QUOTATION" && d.referencePoNo && d.status !== "CANCELLED"
  );

  // 2. Gather all Invoices (exclude duplicate TAX_INVOICE copies that reference an existing INVOICE)
  const allInvoices = (documents || []).filter(d => {
    if (d.status === "CANCELLED") return false;
    if (d.type === "INVOICE") return true;
    if (d.type === "TAX_INVOICE") {
      const hasCorrespondingInvoice = (documents || []).some(
        other => other.type === "INVOICE" && other.documentNo === d.referenceDocNo
      );
      return !hasCorrespondingInvoice;
    }
    return false;
  });

  // 3. Customer analysis data aggregation
  const customerList = (contacts || []).filter(c => c && (c.type === "CUSTOMER" || c.type === "BOTH"));

  const customerAnalytics = customerList.map(cust => {
    // Find POs for this customer
    const custPOs = poDocuments.filter(po => 
      (po.contact?.id && po.contact.id === cust.id) ||
      (po.contact?.taxId && cust.taxId && po.contact.taxId.replace(/[-\s]/g, "") === cust.taxId.replace(/[-\s]/g, "")) ||
      (po.contact?.companyName && cust.companyName && po.contact.companyName.trim().toLowerCase() === cust.companyName.trim().toLowerCase())
    );

    // Find all invoices for this customer
    const custInvoices = allInvoices.filter(inv => 
      (inv.contact?.id && inv.contact.id === cust.id) ||
      (inv.contact?.taxId && cust.taxId && inv.contact.taxId.replace(/[-\s]/g, "") === cust.taxId.replace(/[-\s]/g, "")) ||
      (inv.contact?.companyName && cust.companyName && inv.contact.companyName.trim().toLowerCase() === cust.companyName.trim().toLowerCase())
    );

    // PO Detailed breakdown
    const poBreakdowns = custPOs.map(po => {
      const poNo = po.referencePoNo || "";
      
      // Match with Milestone Plan if exists
      const milestonePlan = milestonePlans.find(
        plan => (plan.referencePoNo && plan.referencePoNo === poNo) ||
                (plan.quotationDocNo && plan.quotationDocNo === po.documentNo)
      );

      const linkedInvoices = custInvoices
        .filter(inv => inv.referencePoNo === poNo)
        .sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || ""));
      
      const totalPoAmount = po.grandTotal || 0;
      
      // Calculate invoiced total based on linked invoices OR milestone plan
      let invoicedTotal = linkedInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      let paidTotal = linkedInvoices.filter(inv => inv.status === "PAID").reduce((sum, inv) => sum + (inv.netPayment || inv.grandTotal || 0), 0);
      let pendingTotal = linkedInvoices.filter(inv => inv.status !== "PAID" && inv.status !== "CANCELLED").reduce((sum, inv) => sum + (inv.netPayment || inv.grandTotal || 0), 0);

      // If milestone plan has explicit PAID / INVOICED milestones, sync amounts
      if (milestonePlan && milestonePlan.milestones && milestonePlan.milestones.length > 0) {
        const msInvoiced = milestonePlan.milestones
          .filter(m => m.status === "INVOICED" || m.status === "PAID")
          .reduce((sum, m) => sum + m.amount, 0);
        const msPaid = milestonePlan.milestones
          .filter(m => m.status === "PAID")
          .reduce((sum, m) => sum + m.amount, 0);
        const msPending = milestonePlan.milestones
          .filter(m => m.status === "INVOICED")
          .reduce((sum, m) => sum + m.amount, 0);

        if (msInvoiced > invoicedTotal) {
          invoicedTotal = msInvoiced;
        }
        if (msPaid > paidTotal) {
          paidTotal = msPaid;
        }
        if (msPending > pendingTotal) {
          pendingTotal = msPending;
        }
      }

      const uninvoicedAmount = Math.max(0, totalPoAmount - invoicedTotal);
      const linkedDeliveryOrders = (documents || []).filter(d => d.type === "DELIVERY_ORDER" && d.referencePoNo === poNo);
      const isInvoicedComplete = uninvoicedAmount <= 1;

      return {
        poDoc: po,
        poNo,
        title: po.items?.[0]?.name || po.projectNote || po.notes || "โครงการตามสัญญา PO",
        description: po.items?.[0]?.description || "",
        issueDate: po.issueDate,
        totalPoAmount,
        subtotal: po.subtotal || 0,
        vatAmount: po.vatAmount || 0,
        whtTotal: po.withholdingTaxTotal || 0,
        netPayment: po.netPayment || (totalPoAmount - (po.withholdingTaxTotal || 0)),
        milestonePlan,
        invoices: linkedInvoices,
        deliveryOrders: linkedDeliveryOrders,
        invoicedTotal,
        uninvoicedAmount,
        paidTotal,
        pendingTotal,
        isInvoicedComplete,
        percentInvoiced: totalPoAmount > 0 ? (invoicedTotal / totalPoAmount) * 100 : 0,
        percentPaid: totalPoAmount > 0 ? (paidTotal / totalPoAmount) * 100 : 0,
      };
    });

    // Sort POs by issueDate descending (newest PO at the top)
    poBreakdowns.sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || ""));

    const totalCustPoValue = poBreakdowns.reduce((sum, p) => sum + p.totalPoAmount, 0);
    const totalCustInvoiced = poBreakdowns.reduce((sum, p) => sum + p.invoicedTotal, 0);
    const totalCustUninvoiced = poBreakdowns.reduce((sum, p) => sum + p.uninvoicedAmount, 0);
    const totalCustPendingAR = poBreakdowns.reduce((sum, p) => sum + p.pendingTotal, 0);
    const totalCustPaidCash = poBreakdowns.reduce((sum, p) => sum + p.paidTotal, 0);

    return {
      customer: cust,
      poList: poBreakdowns,
      totalPoValue: totalCustPoValue,
      totalInvoiced: totalCustInvoiced,
      totalUninvoiced: totalCustUninvoiced,
      totalPendingAR: totalCustPendingAR,
      totalPaidCash: totalCustPaidCash,
      invoicedPercent: totalCustPoValue > 0 ? (totalCustInvoiced / totalCustPoValue) * 100 : 0,
      paidPercent: totalCustPoValue > 0 ? (totalCustPaidCash / totalCustPoValue) * 100 : 0,
    };
  }).filter(c => c.totalPoValue > 0 || c.poList.length > 0);

  // Overall Global KPI Summary
  const globalTotalPoValue = customerAnalytics.reduce((sum, c) => sum + c.totalPoValue, 0);
  const globalTotalInvoiced = customerAnalytics.reduce((sum, c) => sum + c.totalInvoiced, 0);
  const globalTotalUninvoiced = customerAnalytics.reduce((sum, c) => sum + c.totalUninvoiced, 0);
  const globalTotalPendingAR = customerAnalytics.reduce((sum, c) => sum + c.totalPendingAR, 0);
  const globalTotalPaidCash = customerAnalytics.reduce((sum, c) => sum + c.totalPaidCash, 0);

  // Filtered customers and POs based on search and filters
  const filteredCustomers = customerAnalytics
    .filter(c => {
      if (selectedCustomerId !== "ALL" && c.customer.id !== selectedCustomerId) return false;
      return true;
    })
    .map(c => {
      let filteredPos = c.poList;

      if (statusFilter === "UNBILLED_ONLY") {
        filteredPos = filteredPos.filter(p => !p.isInvoicedComplete && p.uninvoicedAmount > 1);
      } else if (statusFilter === "COMPLETED") {
        filteredPos = filteredPos.filter(p => p.isInvoicedComplete);
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredPos = filteredPos.filter(p => 
          p.poNo.toLowerCase().includes(term) ||
          p.title.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.invoices.some(inv => inv.documentNo.toLowerCase().includes(term))
        );
      }

      return {
        ...c,
        poList: filteredPos
      };
    })
    .filter(c => c.poList.length > 0 || !searchTerm.trim());

  // Flatten all filtered POs for Single Focus & Matrix views
  const allFilteredPOs = filteredCustomers.flatMap(c => 
    c.poList.map(po => ({
      ...po,
      customer: c.customer,
      customerAnalytics: c
    }))
  );

  const activePO = allFilteredPOs.find(p => p.poNo === selectedPoNo) || allFilteredPOs[0];

  return (
    <div className="space-y-4 pb-12">
      
      {/* ── Page Header & Compact KPI Bar ──────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-4 text-white shadow-lg border border-indigo-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              CUSTOMER PO & UNBILLED CONTRACT ANALYTICS
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mt-1">
              เจาะลึกยอดคงเหลือ & สัญญา PO รายลูกค้า
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              ติดตามมูลค่าโครงการตามสัญญา 7 PO ครบถ้วน พร้อมงวดงาน (Milestones) เปิดบิลแล้ว vs ค้างเปิด INV และลูกหนี้รอเก็บเงิน
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("milestone-billing")}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-xs border border-indigo-400/30 flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-indigo-900/30"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-200" />
              <span>ผังงวดงานสัญญา</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-300" />
              <span>พิมพ์</span>
            </button>
          </div>
        </div>

        {/* Compact Inline KPI Chips */}
        <div className="mt-3.5 pt-3 border-t border-indigo-800/40 grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-2.5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] font-medium block">มูลค่า PO รวม (7 PO)</span>
              <span className="font-extrabold font-mono text-sm text-white">฿{formatMoney(globalTotalPoValue)}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-indigo-200 font-mono">100%</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-2.5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] font-medium block">เปิด INV ไปแล้ว</span>
              <span className="font-extrabold font-mono text-sm text-sky-300">฿{formatMoney(globalTotalInvoiced)}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-mono">
              {globalTotalPoValue > 0 ? ((globalTotalInvoiced / globalTotalPoValue) * 100).toFixed(1) : 0}%
            </span>
          </div>

          <div className="bg-indigo-500/20 backdrop-blur-md rounded-xl p-2.5 border border-indigo-400/30 flex items-center justify-between">
            <div>
              <span className="text-indigo-200 text-[10px] font-bold block">⏳ ยังไม่ได้เปิด INV (Backlog)</span>
              <span className="font-black font-mono text-sm text-indigo-300">฿{formatMoney(globalTotalUninvoiced)}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/40 text-indigo-100 font-mono font-bold">
              {globalTotalPoValue > 0 ? ((globalTotalUninvoiced / globalTotalPoValue) * 100).toFixed(1) : 0}%
            </span>
          </div>

          <div className="bg-amber-500/20 backdrop-blur-md rounded-xl p-2.5 border border-amber-400/30 flex items-center justify-between">
            <div>
              <span className="text-amber-200 text-[10px] font-bold block">💰 ลูกหนี้รอเก็บเงิน (AR)</span>
              <span className="font-black font-mono text-sm text-amber-300">฿{formatMoney(globalTotalPendingAR)}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-100 font-mono">
              2 ใบแจ้งหนี้
            </span>
          </div>
        </div>
      </div>

      {/* ── View Switcher & Filter Toolbar ──────────────────────────────────── */}
      <div className="glass-panel p-2.5 sm:p-3 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shadow-sm border border-slate-200 bg-white">
        
        {/* View Mode Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode("SINGLE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "SINGLE"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>เจาะลึกราย PO (โฟกัส)</span>
          </button>
          <button
            onClick={() => setViewMode("MATRIX")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "MATRIX"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>ตารางสรุป 7 PO (จบหน้าเดียว)</span>
          </button>
          <button
            onClick={() => setViewMode("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "ALL"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>การ์ดทั้งหมด</span>
          </button>
        </div>

        {/* Search & Customer Dropdown */}
        <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ค้นหา PO, ชื่องาน, ใบแจ้งหนี้..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <select
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="ALL">ลูกค้าทั้งหมด ({customerAnalytics.length})</option>
            {customerAnalytics.map(c => (
              <option key={c.customer.id} value={c.customer.id}>
                {c.customer.companyName} ({c.poList.length} PO)
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                statusFilter === "ALL"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ทั้งหมด (7)
            </button>
            <button
              onClick={() => setStatusFilter("UNBILLED_ONLY")}
              className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] flex items-center gap-1 ${
                statusFilter === "UNBILLED_ONLY"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>ค้างเปิด</span>
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-mono">
                ฿7.36M
              </span>
            </button>
            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                statusFilter === "COMPLETED"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ครบ 100%
            </button>
          </div>
        </div>

      </div>

      {/* ── View Mode 1: SINGLE (Focus View on Selected PO - Zero Scroll) ─────── */}
      {viewMode === "SINGLE" && (
        <div className="space-y-3">
          {/* Horizontal PO Tabs Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {allFilteredPOs.map(po => {
              const isSelected = po.poNo === activePO?.poNo;
              const hasUninvoiced = po.uninvoicedAmount > 1;

              return (
                <button
                  key={po.poNo}
                  onClick={() => setSelectedPoNo(po.poNo)}
                  className={`px-3 py-2 rounded-xl text-left transition flex items-center gap-2.5 border shrink-0 ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30 scale-[1.02]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs">PO: {po.poNo}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        isSelected 
                          ? "bg-indigo-700 text-indigo-100" 
                          : po.isInvoicedComplete 
                            ? "bg-emerald-100 text-emerald-800" 
                            : "bg-indigo-100 text-indigo-800"
                      }`}>
                        {po.percentInvoiced.toFixed(0)}%
                      </span>
                    </div>
                    <span className={`text-[10px] block truncate max-w-[140px] ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                      {po.customer.companyName}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active PO Focus Card */}
          {activePO ? (
            <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 bg-white shadow-sm">
              
              {/* Header: Customer & PO Summary */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                    {(activePO.customer.companyName || "C").charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                        PO: {activePO.poNo}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{activePO.customer.companyName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        (ออกเมื่อ: {formatThaiDate(activePO.issueDate)})
                      </span>
                      {activePO.isInvoicedComplete ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> เปิดบิลครบ 100%
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> ค้างเปิด INV {((activePO.uninvoicedAmount / activePO.totalPoAmount) * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 mt-1">{activePO.title}</h3>
                  </div>
                </div>

                {/* Amounts Mini-Grid */}
                <div className="flex items-center gap-2 sm:gap-3 text-right shrink-0">
                  <div className="p-2 px-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-medium text-slate-400 block">มูลค่าโครงการ</span>
                    <span className="text-xs font-bold font-mono text-slate-900">฿{formatMoney(activePO.totalPoAmount)}</span>
                  </div>
                  <div className="p-2 px-3 rounded-xl bg-sky-50 border border-sky-200">
                    <span className="text-[10px] font-bold text-sky-600 block">เปิด INV แล้ว ({activePO.percentInvoiced.toFixed(0)}%)</span>
                    <span className="text-xs font-extrabold font-mono text-sky-700">฿{formatMoney(activePO.invoicedTotal)}</span>
                  </div>
                  <div className="p-2 px-3 rounded-xl bg-indigo-50 border border-indigo-200">
                    <span className="text-[10px] font-bold text-indigo-600 block">⏳ ค้างเปิด INV</span>
                    <span className="text-xs font-black font-mono text-indigo-700">฿{formatMoney(activePO.uninvoicedAmount)}</span>
                  </div>
                  {activePO.pendingTotal > 0 && (
                    <div className="p-2 px-3 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-600 block">💰 รอเก็บเงิน AR</span>
                      <span className="text-xs font-black font-mono text-amber-700">฿{formatMoney(activePO.pendingTotal)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                    ความคืบหน้าการวางบิล & รับเงิน:
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-700 font-mono">ชำระแล้ว ฿{formatMoney(activePO.paidTotal)}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-amber-700 font-mono">รอเก็บเงิน AR ฿{formatMoney(activePO.pendingTotal)}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-indigo-700 font-mono">ค้างเปิด INV ฿{formatMoney(activePO.uninvoicedAmount)}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, activePO.totalPoAmount > 0 ? (activePO.paidTotal / activePO.totalPoAmount) * 100 : 0)}%` }}
                    title={`ชำระแล้ว: ฿${formatMoney(activePO.paidTotal)}`}
                  />
                  <div 
                    className="bg-amber-400 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, activePO.totalPoAmount > 0 ? (activePO.pendingTotal / activePO.totalPoAmount) * 100 : 0)}%` }}
                    title={`เปิดบิลรอเก็บเงิน AR: ฿${formatMoney(activePO.pendingTotal)}`}
                  />
                  <div 
                    className="bg-indigo-200 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, activePO.totalPoAmount > 0 ? (activePO.uninvoicedAmount / activePO.totalPoAmount) * 100 : 0)}%` }}
                    title={`ค้างเปิด INV: ฿${formatMoney(activePO.uninvoicedAmount)}`}
                  />
                </div>
              </div>

              {/* Sub-Tabs: Milestones vs Documents */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSingleActiveTab("MILESTONES")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      singleActiveTab === "MILESTONES"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>แผนงวดงานตามสัญญา ({activePO.milestonePlan?.milestones?.length || 0} งวด)</span>
                  </button>
                  <button
                    onClick={() => setSingleActiveTab("DOCS")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      singleActiveTab === "DOCS"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>ใบแจ้งหนี้ ({activePO.invoices.length}) & ใบส่งของ ({activePO.deliveryOrders?.length || 0})</span>
                  </button>
                </div>

                {activePO.uninvoicedAmount > 1 ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("milestone-billing")}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition"
                    >
                      ดูผังงวดงาน
                    </button>
                    <button
                      onClick={() => openCreateModal("INVOICE", activePO.poNo, activePO.customer)}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                      <span>ออกใบแจ้งหนี้งวดนี้</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> เปิดบิลครบ 100%
                  </span>
                )}
              </div>

              {/* Sub-Tab 1: Milestones Content */}
              {singleActiveTab === "MILESTONES" && (
                <div>
                  {activePO.milestonePlan && activePO.milestonePlan.milestones?.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-slate-50/50">
                      <table className="w-full text-left text-xs min-w-[650px]">
                        <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3 text-center w-14">งวด</th>
                            <th className="py-2 px-3">รายละเอียดงวดงาน / เงื่อนไข</th>
                            <th className="py-2 px-3 text-center w-16">% สัดส่วน</th>
                            <th className="py-2 px-3 text-right w-24">จำนวนเงิน (฿)</th>
                            <th className="py-2 px-3 text-center w-24">กำหนดการ</th>
                            <th className="py-2 px-3 text-center w-32">สถานะ</th>
                            <th className="py-2 px-3 text-center w-28">INV อ้างอิง</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {activePO.milestonePlan.milestones.map((m: ProjectMilestone) => {
                            let badge = (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <Clock className="w-2.5 h-2.5" /> รอเปิด INV
                              </span>
                            );
                            if (m.status === "PAID") {
                              badge = (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> ชำระแล้ว
                                </span>
                              );
                            } else if (m.status === "INVOICED") {
                              badge = (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <AlertCircle className="w-2.5 h-2.5 text-amber-600" /> รอโอนชำระ
                                </span>
                              );
                            }

                            return (
                              <tr key={m.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">
                                  {m.milestoneNo}
                                </td>
                                <td className="py-2 px-3">
                                  <span className="font-semibold text-slate-800">{m.title}</span>
                                  {m.notes && <span className="block text-[10px] text-slate-400">{m.notes}</span>}
                                </td>
                                <td className="py-2 px-3 text-center font-mono font-bold text-indigo-700">
                                  {m.percentage}%
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                                  ฿{formatMoney(m.amount)}
                                </td>
                                <td className="py-2 px-3 text-center text-[10px] text-slate-500 font-mono">
                                  {m.dueDate ? formatThaiDate(m.dueDate) : "-"}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {badge}
                                </td>
                                <td className="py-2 px-3 text-center font-mono text-[10px]">
                                  {m.invoiceDocNo ? (
                                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                                      {m.invoiceDocNo}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                      ไม่พบผังงวดงานที่กำหนดสำหรับ PO นี้
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 2: Invoices & DOs Content */}
              {singleActiveTab === "DOCS" && (
                <div className="space-y-3">
                  {/* Invoices */}
                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-1.5">
                      📄 ใบแจ้งหนี้ที่ออกแล้ว ({activePO.invoices.length} ฉบับ):
                    </span>
                    {activePO.invoices.length === 0 ? (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                        ยังไม่มีการเปิดใบแจ้งหนี้สำหรับ PO นี้
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                        <table className="w-full text-left text-xs min-w-[550px]">
                          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">เลขที่ใบแจ้งหนี้</th>
                              <th className="py-2 px-3">งวดงาน / รายการ</th>
                              <th className="py-2 px-3">วันที่ออก</th>
                              <th className="py-2 px-3 text-right">ยอดรวม (฿)</th>
                              <th className="py-2 px-3 text-center">สถานะ</th>
                              <th className="py-2 px-3 text-center">จัดการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {activePO.invoices.map(inv => (
                              <tr key={inv.id} className="hover:bg-slate-50 transition">
                                <td className="py-2 px-3 font-mono font-bold text-slate-800">{inv.documentNo}</td>
                                <td className="py-2 px-3 text-slate-700 truncate max-w-[180px]" title={inv.items?.[0]?.name}>
                                  {inv.items?.[0]?.name || inv.notes || "-"}
                                </td>
                                <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{formatThaiDate(inv.issueDate)}</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">฿{formatMoney(inv.grandTotal)}</td>
                                <td className="py-2 px-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                    inv.status === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {inv.status === "PAID" ? "ชำระแล้ว" : "รอรับชำระ"}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <button
                                    onClick={() => openViewDocument(inv)}
                                    className="p-1 rounded-lg bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 transition shadow-sm"
                                    title="ดูเอกสาร"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Delivery Orders */}
                  {activePO.deliveryOrders && activePO.deliveryOrders.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-1.5">
                        📦 ใบส่งของชั่วคราว / ใบส่งมอบงาน ({activePO.deliveryOrders.length} ฉบับ):
                      </span>
                      <div className="space-y-1.5">
                        {activePO.deliveryOrders.map(doDoc => (
                          <div key={doDoc.id} className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between gap-2 shadow-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-indigo-900 text-xs px-2 py-0.5 rounded-md bg-white border border-indigo-200">
                                {doDoc.documentNo}
                              </span>
                              <span className="text-xs text-slate-800 font-bold">
                                {doDoc.projectNote || "รายการ Part ที่จัดส่ง Line ADC"}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({formatThaiDate(doDoc.issueDate)})
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-xs text-slate-800">
                                ฿{formatMoney(doDoc.subtotal || doDoc.grandTotal)}
                              </span>
                              <button
                                onClick={() => openViewDocument(doDoc)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-sm"
                              >
                                <Eye className="w-3 h-3" />
                                <span>ดูใบส่งของ</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 glass-panel rounded-2xl bg-white">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold">ไม่พบข้อมูล PO ที่เลือก</p>
            </div>
          )}
        </div>
      )}

      {/* ── View Mode 2: MATRIX (Master 7-PO Matrix Table - Zero Scroll) ─────── */}
      {viewMode === "MATRIX" && (
        <div className="glass-panel rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
              <span>ตารางสรุป 7 สัญญา PO ครบถ้วน (Master Matrix)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              รวมมูลค่าสัญญา: ฿{formatMoney(globalTotalPoValue)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[780px]">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">เลขที่ PO & โครงการ</th>
                  <th className="py-2.5 px-3">ลูกค้า</th>
                  <th className="py-2.5 px-3 text-right">มูลค่า PO (฿)</th>
                  <th className="py-2.5 px-3 text-center">งวดงาน</th>
                  <th className="py-2.5 px-3 text-center w-28">ความคืบหน้าเปิดบิล</th>
                  <th className="py-2.5 px-3 text-right">เปิด INV แล้ว (฿)</th>
                  <th className="py-2.5 px-3 text-right">ค้างเปิด INV (฿)</th>
                  <th className="py-2.5 px-3 text-right">รอเก็บ AR (฿)</th>
                  <th className="py-2.5 px-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allFilteredPOs.map(po => {
                  const hasUninvoiced = po.uninvoicedAmount > 1;

                  return (
                    <tr key={po.poNo} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {po.poNo}
                          </span>
                          <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={po.title}>
                            {po.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[140px]" title={po.customer.companyName}>
                        {po.customer.companyName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        ฿{formatMoney(po.totalPoAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {po.invoices.length} / {po.milestonePlan?.milestones?.length || "-"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden shrink-0">
                            <div 
                              className={`h-full ${po.isInvoicedComplete ? "bg-emerald-500" : "bg-indigo-600"}`}
                              style={{ width: `${Math.min(100, po.percentInvoiced)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold text-slate-700">
                            {po.percentInvoiced.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sky-700 font-bold">
                        ฿{formatMoney(po.invoicedTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className={hasUninvoiced ? "text-indigo-700 font-black" : "text-slate-400"}>
                          ฿{formatMoney(po.uninvoicedAmount)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                        {po.pendingTotal > 0 ? `฿${formatMoney(po.pendingTotal)}` : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedPoNo(po.poNo);
                              setViewMode("SINGLE");
                            }}
                            className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200 transition"
                            title="เจาะลึกรายละเอียด PO นี้"
                          >
                            เจาะลึก
                          </button>
                          {hasUninvoiced && (
                            <button
                              onClick={() => openCreateModal("INVOICE", po.poNo, po.customer)}
                              className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                              title="เปิดใบแจ้งหนี้งวดนี้"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 text-slate-600">รวมทั้งหมด 7 สัญญา PO</td>
                  <td className="py-2.5 px-3 text-right font-mono font-black">฿{formatMoney(globalTotalPoValue)}</td>
                  <td className="py-2.5 px-3 text-center font-mono">-</td>
                  <td className="py-2.5 px-3 text-center font-mono text-sky-700">
                    {globalTotalPoValue > 0 ? ((globalTotalInvoiced / globalTotalPoValue) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sky-700 font-black">฿{formatMoney(globalTotalInvoiced)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-black">฿{formatMoney(globalTotalUninvoiced)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-black">฿{formatMoney(globalTotalPendingAR)}</td>
                  <td className="py-2.5 px-3 text-center">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── View Mode 3: ALL (Customer Cards with Collapsible PO Accordions) ─── */}
      {viewMode === "ALL" && (
        <div className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 glass-panel rounded-2xl bg-white">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-bold text-xs">ไม่พบข้อมูลสัญญา PO ตามเงื่อนไขค้นหา</p>
            </div>
          ) : (
            filteredCustomers.map((custData, cIdx) => {
              const { customer, poList, totalPoValue, totalInvoiced, totalUninvoiced, totalPendingAR, totalPaidCash, invoicedPercent, paidPercent } = custData;

              return (
                <div key={customer.id || cIdx} className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 shadow-sm bg-white">
                  
                  {/* Customer Card Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                        {(customer.companyName || "C").charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                            ลูกค้าองค์กร
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Tax ID: {customer.taxId || "-"}
                          </span>
                        </div>
                        <h2 className="text-sm font-extrabold text-slate-900 mt-0.5">{customer.companyName}</h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <div className="p-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[9px] text-slate-400 block">มูลค่า PO รวม ({poList.length} PO)</span>
                        <span className="text-xs font-bold font-mono text-slate-800">฿{formatMoney(totalPoValue)}</span>
                      </div>
                      <div className="p-1.5 px-2.5 rounded-lg bg-sky-50 border border-sky-200">
                        <span className="text-[9px] font-bold text-sky-700 block">เปิด INV แล้ว</span>
                        <span className="text-xs font-extrabold font-mono text-sky-700">฿{formatMoney(totalInvoiced)}</span>
                      </div>
                      <div className="p-1.5 px-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                        <span className="text-[9px] font-bold text-indigo-700 block">ค้างเปิด INV</span>
                        <span className="text-xs font-black font-mono text-indigo-800">฿{formatMoney(totalUninvoiced)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer POs List Accordion */}
                  <div className="space-y-2">
                    {poList.map(poItem => {
                      const isExpanded = expandedPOs[poItem.poNo] || false;
                      const hasUninvoiced = poItem.uninvoicedAmount > 1;

                      return (
                        <div 
                          key={poItem.poNo}
                          className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50"
                        >
                          <div 
                            onClick={() => toggleExpand(poItem.poNo)}
                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition"
                          >
                            <div className="flex items-center gap-2.5">
                              <button className="p-1 rounded bg-white border border-slate-200 text-slate-500">
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                              <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                PO: {poItem.poNo}
                              </span>
                              <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                                {poItem.title}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({formatThaiDate(poItem.issueDate)})
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-right">
                              <span className="text-xs font-mono font-bold text-slate-800">฿{formatMoney(poItem.totalPoAmount)}</span>
                              <span className="text-xs font-mono text-sky-700 font-bold">฿{formatMoney(poItem.invoicedTotal)}</span>
                              <span className={`text-xs font-mono font-bold ${hasUninvoiced ? "text-indigo-700" : "text-emerald-600"}`}>
                                ฿{formatMoney(poItem.uninvoicedAmount)}
                              </span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-3 bg-white border-t border-slate-200 space-y-3">
                              {/* Milestones */}
                              {poItem.milestonePlan?.milestones?.length > 0 && (
                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                  <table className="w-full text-left text-xs min-w-[550px]">
                                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                      <tr>
                                        <th className="py-1.5 px-2.5 text-center w-12">งวด</th>
                                        <th className="py-1.5 px-2.5">รายละเอียดงวดงาน</th>
                                        <th className="py-1.5 px-2.5 text-center w-16">%</th>
                                        <th className="py-1.5 px-2.5 text-right w-24">จำนวนเงิน</th>
                                        <th className="py-1.5 px-2.5 text-center w-28">สถานะ</th>
                                        <th className="py-1.5 px-2.5 text-center w-24">INV</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {poItem.milestonePlan.milestones.map((m: ProjectMilestone) => (
                                        <tr key={m.id} className="hover:bg-slate-50">
                                          <td className="py-1.5 px-2.5 text-center font-mono font-bold text-slate-600">{m.milestoneNo}</td>
                                          <td className="py-1.5 px-2.5 font-medium text-slate-800">{m.title}</td>
                                          <td className="py-1.5 px-2.5 text-center font-mono font-bold text-indigo-700">{m.percentage}%</td>
                                          <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-800">฿{formatMoney(m.amount)}</td>
                                          <td className="py-1.5 px-2.5 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                              m.status === "PAID" ? "bg-emerald-50 text-emerald-700" : m.status === "INVOICED" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                                            }`}>
                                              {m.status === "PAID" ? "ชำระแล้ว" : m.status === "INVOICED" ? "เปิดบิลแล้ว" : "รอเปิดบิล"}
                                            </span>
                                          </td>
                                          <td className="py-1.5 px-2.5 text-center font-mono text-[10px]">
                                            {m.invoiceDocNo || "-"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* Actions */}
                              {hasUninvoiced && (
                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => openCreateModal("INVOICE", poItem.poNo, customer)}
                                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>ออกใบแจ้งหนี้งวดนี้</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
};
