import React, { useState } from "react";
import { 
  Building2, FileText, Clock, CheckCircle2, AlertCircle, 
  Search, ArrowUpRight, Eye, Plus, Printer, ChevronDown, 
  ChevronUp, Sparkles, Filter, Layers, DollarSign, Wallet,
  Calendar, CheckCircle, ExternalLink, ArrowRight, TrendingUp,
  Receipt, Landmark, ShieldCheck
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
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNBILLED_ONLY" | "COMPLETED">("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
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

  return (
    <div className="space-y-6 pb-16">
      
      {/* ── Page Header & Title ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-indigo-900/40">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              CUSTOMER PO & UNBILLED CONTRACT ANALYTICS
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              เจาะลึกยอดคงเหลือ & สัญญา PO รายลูกค้า
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              ติดตามมูลค่าโครงการตามสัญญา 7 PO ครบถ้วน พร้อมแจกแจงงวดงาน (Milestones) เปิดบิลแล้ว vs รอเปิด INV และลูกหนี้รอเก็บเงิน
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab("milestone-billing")}
              className="px-4 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-xs border border-indigo-400/30 flex items-center gap-2 transition active:scale-95 shadow-lg shadow-indigo-900/40"
            >
              <Calendar className="w-4 h-4 text-indigo-200" />
              <span>ระบบวางบิลตามงวดงานสัญญา</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 flex items-center gap-2 transition active:scale-95"
            >
              <Printer className="w-4 h-4 text-indigo-300" />
              <span>พิมพ์รายงาน</span>
            </button>
          </div>
        </div>

        {/* Highlight Summary Mini-Bar */}
        <div className="mt-6 pt-5 border-t border-indigo-800/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-slate-400 block text-[11px] font-medium">📋 มูลค่า PO รวมตามสัญญา</span>
            <span className="font-extrabold font-mono text-base block mt-0.5 text-white">฿{formatMoney(globalTotalPoValue)}</span>
            <span className="text-[10px] text-indigo-300 font-medium">7 สัญญา PO (ยืนยันแล้ว)</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-slate-400 block text-[11px] font-medium">🧾 เปิด INV ไปแล้ว</span>
            <span className="font-extrabold font-mono text-base block mt-0.5 text-sky-300">฿{formatMoney(globalTotalInvoiced)}</span>
            <span className="text-[10px] text-sky-400 font-medium">{globalTotalPoValue > 0 ? ((globalTotalInvoiced / globalTotalPoValue) * 100).toFixed(1) : 0}% ของมูลค่าสัญญา</span>
          </div>

          <div className="bg-indigo-500/20 backdrop-blur-md rounded-2xl p-3.5 border border-indigo-400/30 text-white shadow-inner">
            <span className="text-indigo-200 block text-[11px] font-bold">⏳ ยังไม่ได้เปิด INV (Backlog)</span>
            <span className="font-black font-mono text-base block mt-0.5 text-indigo-300">฿{formatMoney(globalTotalUninvoiced)}</span>
            <span className="text-[10px] text-indigo-200 font-medium">{globalTotalPoValue > 0 ? ((globalTotalUninvoiced / globalTotalPoValue) * 100).toFixed(1) : 0}% รอส่งมอบ/วางบิล</span>
          </div>

          <div className="bg-amber-500/20 backdrop-blur-md rounded-2xl p-3.5 border border-amber-400/30 text-white shadow-inner">
            <span className="text-amber-200 block text-[11px] font-bold">💰 ลูกหนี้รอเก็บเงิน (AR)</span>
            <span className="font-black font-mono text-base block mt-0.5 text-amber-300">฿{formatMoney(globalTotalPendingAR)}</span>
            <span className="text-[10px] text-amber-200 font-medium">2 ใบแจ้งหนี้รอลูกค้าโอน</span>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ─────────────────────────────────────────── */}
      <div className="glass-panel p-3 sm:p-4 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-sm border border-slate-200 bg-white">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหาเลขที่ PO (เช่น 2505004, PO252155), ชื่องาน, เลขที่ใบแจ้งหนี้..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/20 transition"
          />
        </div>

        {/* Customer & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Customer Selector */}
          <select
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="ALL">ลูกค้าทั้งหมด ({customerAnalytics.length} บริษัท)</option>
            {customerAnalytics.map(c => (
              <option key={c.customer.id} value={c.customer.id}>
                {c.customer.companyName} ({c.poList.length} PO)
              </option>
            ))}
          </select>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                statusFilter === "ALL"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ทั้งหมด (7 PO)
            </button>
            <button
              onClick={() => setStatusFilter("UNBILLED_ONLY")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                statusFilter === "UNBILLED_ONLY"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>มีงวดค้างเปิด INV</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-mono">
                ฿7.36M
              </span>
            </button>
            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                statusFilter === "COMPLETED"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              เปิดครบ 100%
            </button>
          </div>

        </div>

      </div>

      {/* ── Customers Drilldown Section ─────────────────────────────────────── */}
      <div className="space-y-8">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 glass-panel rounded-3xl">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">ไม่พบข้อมูลสัญญา PO ตามเงื่อนไขค้นหา</p>
            <p className="text-xs mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองเป็น "ทั้งหมด"</p>
          </div>
        ) : (
          filteredCustomers.map((custData, cIdx) => {
            const { customer, poList, totalPoValue, totalInvoiced, totalUninvoiced, totalPendingAR, totalPaidCash, invoicedPercent, paidPercent } = custData;

            return (
              <div key={customer.id || cIdx} className="glass-panel rounded-3xl p-6 sm:p-7 space-y-6 border border-slate-200/90 shadow-md bg-white">
                
                {/* 1. Customer Card Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
                      {(customer.companyName || "C").charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          🧑‍💼 ลูกค้าองค์กร
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          Tax ID: {customer.taxId || "-"}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200">
                          {customer.branchCode === "00000" ? "สำนักงานใหญ่" : `สาขา ${customer.branchCode}`}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-slate-900 mt-1">{customer.companyName}</h2>
                      <p className="text-xs text-slate-500 font-medium">{customer.name || "ฝ่ายจัดซื้อและบัญชี"} • {customer.phone || "02-xxx-xxxx"}</p>
                    </div>
                  </div>

                  {/* Customer Quick Stats Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="p-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
                      <span className="text-[10px] font-semibold text-slate-500 block">มูลค่า PO รวม ({poList.length} PO)</span>
                      <span className="text-xs font-bold font-mono text-slate-800">฿{formatMoney(totalPoValue)}</span>
                    </div>

                    <div className="p-2.5 px-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-right">
                      <span className="text-[10px] font-bold text-emerald-700 block">รับเงินแล้ว</span>
                      <span className="text-xs font-extrabold font-mono text-emerald-700">฿{formatMoney(totalPaidCash)}</span>
                    </div>

                    <div className="p-2.5 px-3.5 rounded-xl bg-amber-50 border border-amber-200 text-right">
                      <span className="text-[10px] font-bold text-amber-700 block">รอเก็บเงิน (AR)</span>
                      <span className="text-xs font-extrabold font-mono text-amber-700">฿{formatMoney(totalPendingAR)}</span>
                    </div>

                    <div className="p-2.5 px-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-right shadow-sm">
                      <span className="text-[10px] font-bold text-indigo-700 block">⏳ ยังไม่เปิด INV</span>
                      <span className="text-xs font-black font-mono text-indigo-800">฿{formatMoney(totalUninvoiced)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Customer Overall Progress Bar */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                        ความคืบหน้าการวางบิล & รับเงิน:
                      </span>
                      <span className="text-emerald-700 font-mono">ชำระแล้ว {paidPercent.toFixed(1)}%</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-sky-700 font-mono">เปิด INV แล้ว {invoicedPercent.toFixed(1)}%</span>
                    </div>
                    <span className="text-indigo-700 font-mono font-black">
                      ค้างเปิด INV: ฿{formatMoney(totalUninvoiced)} ({((totalUninvoiced / totalPoValue) * 100).toFixed(1)}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex shadow-inner">
                    {/* Paid portion */}
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, paidPercent)}%` }}
                      title={`ชำระแล้ว: ฿${formatMoney(totalPaidCash)} (${paidPercent.toFixed(1)}%)`}
                    />
                    {/* Pending AR portion */}
                    <div 
                      className="bg-amber-400 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100 - paidPercent, totalPoValue > 0 ? (totalPendingAR / totalPoValue) * 100 : 0)}%` }}
                      title={`เปิดบิลรอรับเงิน: ฿${formatMoney(totalPendingAR)}`}
                    />
                    {/* Unbilled portion */}
                    <div 
                      className="bg-indigo-200 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, totalPoValue > 0 ? (totalUninvoiced / totalPoValue) * 100 : 0)}%` }}
                      title={`ยังไม่ได้เปิด INV: ฿${formatMoney(totalUninvoiced)}`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> รับเงินแล้ว (฿{formatMoney(totalPaidCash)})</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> รอเรียกเก็บ AR (฿{formatMoney(totalPendingAR)})</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-200 inline-block"></span> รอเปิด INV (฿{formatMoney(totalUninvoiced)})</span>
                    </div>
                  </div>
                </div>

                {/* 3. POs List Accordion */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>รายการใบสั่งซื้อและงวดงานที่ผูกกับสัญญา ({poList.length} โครงการ):</span>
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {poList.map(poItem => {
                      const isExpanded = expandedPOs[poItem.poNo] !== false;
                      const hasUninvoiced = poItem.uninvoicedAmount > 1;
                      const plan = poItem.milestonePlan;

                      return (
                        <div 
                          key={poItem.poNo}
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
                            hasUninvoiced 
                              ? "bg-slate-50/60 border-slate-200 hover:border-indigo-300" 
                              : "bg-emerald-50/20 border-emerald-200"
                          }`}
                        >
                          {/* PO Accordion Header */}
                          <div 
                            onClick={() => toggleExpand(poItem.poNo)}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/60 transition"
                          >
                            <div className="flex items-start gap-3">
                              <button className="p-1 rounded-lg bg-white border border-slate-200 text-slate-500 mt-0.5">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    PO: {poItem.poNo}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-mono">
                                    ออกเมื่อ: {formatThaiDate(poItem.issueDate)}
                                  </span>
                                  {poItem.isInvoicedComplete ? (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      เปิดบิลครบ 100%
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      ค้างเปิด INV ({((poItem.uninvoicedAmount / poItem.totalPoAmount) * 100).toFixed(0)}%)
                                    </span>
                                  )}
                                  {poItem.pendingTotal > 0 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                      รอเก็บเงิน ฿{formatMoney(poItem.pendingTotal)}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-extrabold text-slate-900 mt-1">{poItem.title}</h4>
                                {poItem.description && (
                                  <p className="text-xs text-slate-500 line-clamp-1">{poItem.description}</p>
                                )}
                              </div>
                            </div>

                            {/* PO Right Summary Amounts */}
                            <div className="flex items-center gap-4 text-right shrink-0 pl-9 sm:pl-0">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-medium">มูลค่าโครงการ</span>
                                <span className="text-xs font-bold font-mono text-slate-800">฿{formatMoney(poItem.totalPoAmount)}</span>
                              </div>

                              <div className="pl-3 border-l border-slate-200">
                                <span className="text-[10px] font-bold text-sky-600 block">เปิด INV แล้ว</span>
                                <span className="text-xs font-extrabold font-mono text-sky-700">
                                  ฿{formatMoney(poItem.invoicedTotal)} ({poItem.percentInvoiced.toFixed(0)}%)
                                </span>
                              </div>

                              <div className="pl-3 border-l border-slate-200">
                                <span className="text-[10px] font-bold text-indigo-600 block">ค้างเปิด INV</span>
                                <span className={`text-sm font-black font-mono block ${hasUninvoiced ? "text-indigo-700" : "text-emerald-600"}`}>
                                  ฿{formatMoney(poItem.uninvoicedAmount)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* PO Accordion Body */}
                          {isExpanded && (
                            <div className="p-4 sm:p-5 pt-0 border-t border-slate-200/80 bg-white space-y-5">
                              
                              {/* 1. Milestone Billing Schedule (Plan & Breakdown) */}
                              {plan && plan.milestones && plan.milestones.length > 0 && (
                                <div className="space-y-2.5 pt-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>แผนงวดงานตามสัญญา ({plan.milestones.length} งวดงาน):</span>
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-mono">
                                      ยอดสัญญาสุทธิ: ฿{formatMoney(plan.totalContractAmount)}
                                    </span>
                                  </div>

                                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-slate-50/50">
                                    <table className="w-full text-left text-xs min-w-[700px]">
                                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                        <tr>
                                          <th className="py-2.5 px-3 text-center w-16">งวดที่</th>
                                          <th className="py-2.5 px-3">รายละเอียดงวดงาน / เงื่อนไข</th>
                                          <th className="py-2.5 px-3 text-center w-20">สัดส่วน %</th>
                                          <th className="py-2.5 px-3 text-right w-28">จำนวนเงิน (บาท)</th>
                                          <th className="py-2.5 px-3 text-center w-28">กำหนดการ</th>
                                          <th className="py-2.5 px-3 text-center w-36">สถานะการวางบิล</th>
                                          <th className="py-2.5 px-3 text-center w-32">เอกสารอ้างอิง</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 bg-white">
                                        {plan.milestones.map((m: ProjectMilestone) => {
                                          let statusBadge = (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                              <Clock className="w-2.5 h-2.5" /> รอเปิด INV
                                            </span>
                                          );

                                          if (m.status === "PAID") {
                                            statusBadge = (
                                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> ชำระแล้ว
                                              </span>
                                            );
                                          } else if (m.status === "INVOICED") {
                                            statusBadge = (
                                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                <AlertCircle className="w-2.5 h-2.5 text-amber-600" /> เปิดบิลแล้ว (รอโอน)
                                              </span>
                                            );
                                          }

                                          return (
                                            <tr key={m.id} className="hover:bg-slate-50/80 transition">
                                              <td className="py-2.5 px-3 text-center font-bold text-slate-700 font-mono">
                                                {m.milestoneNo}
                                              </td>
                                              <td className="py-2.5 px-3 font-medium text-slate-800">
                                                <div>
                                                  <span>{m.title}</span>
                                                  {m.notes && <span className="block text-[10px] text-slate-400 mt-0.5">{m.notes}</span>}
                                                </div>
                                              </td>
                                              <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">
                                                {m.percentage}%
                                              </td>
                                              <td className="py-2.5 px-3 text-right font-mono font-black text-slate-800">
                                                ฿{formatMoney(m.amount)}
                                              </td>
                                              <td className="py-2.5 px-3 text-center text-[11px] text-slate-500 font-mono">
                                                {m.dueDate ? formatThaiDate(m.dueDate) : "-"}
                                              </td>
                                              <td className="py-2.5 px-3 text-center">
                                                {statusBadge}
                                              </td>
                                              <td className="py-2.5 px-3 text-center font-mono text-[11px]">
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
                                </div>
                              )}

                              {/* 2. Invoices Issued for this PO */}
                              <div className="space-y-2 pt-2">
                                <span className="text-xs font-bold text-slate-700 block">
                                  📄 ใบแจ้งหนี้ที่ออกแล้วสำหรับ PO นี้ ({poItem.invoices.length} ฉบับ):
                                </span>

                                {poItem.invoices.length === 0 ? (
                                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                                    ยังไม่เคยมีการเปิดใบแจ้งหนี้สำหรับ PO นี้
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                                    <table className="w-full text-left text-xs min-w-[650px]">
                                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                        <tr>
                                          <th className="py-2.5 px-3">เลขที่ใบแจ้งหนี้</th>
                                          <th className="py-2.5 px-3">โครงการ / ชื่องาน</th>
                                          <th className="py-2.5 px-3">งวดงาน / รายการ</th>
                                          <th className="py-2.5 px-3">วันที่ออก</th>
                                          <th className="py-2.5 px-3 text-right">ยอดรวม (บาท)</th>
                                          <th className="py-2.5 px-3 text-center">สถานะ</th>
                                          <th className="py-2.5 px-3 text-center">จัดการ</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {poItem.invoices.map(inv => (
                                          <tr key={inv.id} className="hover:bg-slate-50 transition">
                                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{inv.documentNo}</td>
                                            <td className="py-2.5 px-3 font-semibold text-slate-800 text-[11px]">
                                              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate block max-w-[150px]" title={getProjectName(inv)}>
                                                {getProjectName(inv)}
                                              </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600 truncate max-w-[200px]" title={inv.items?.[0]?.name}>
                                              {inv.items?.[0]?.name || inv.notes || "-"}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-500 font-mono">{formatThaiDate(inv.issueDate)}</td>
                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">฿{formatMoney(inv.grandTotal)}</td>
                                            <td className="py-2.5 px-3 text-center">
                                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                                inv.status === "PAID" 
                                                  ? "bg-emerald-100 text-emerald-800" 
                                                  : "bg-amber-100 text-amber-800"
                                              }`}>
                                                {inv.status === "PAID" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {inv.status === "PAID" ? "ชำระแล้ว" : "รอรับชำระ"}
                                              </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                              <button 
                                                onClick={() => openViewDocument(inv)}
                                                className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 transition shadow-sm"
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

                              {/* Linked Delivery Notes */}
                              {poItem.deliveryOrders && poItem.deliveryOrders.length > 0 && (
                                <div className="space-y-2 pt-1">
                                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <span>📦 ใบส่งของชั่วคราว / ใบส่งมอบงาน ({poItem.deliveryOrders.length} ฉบับ):</span>
                                  </span>
                                  <div className="space-y-2">
                                    {poItem.deliveryOrders.map(doDoc => (
                                      <div key={doDoc.id} className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                                        <div className="flex items-center gap-2.5">
                                          <span className="font-mono font-bold text-indigo-900 text-xs px-2.5 py-1 rounded-lg bg-white border border-indigo-200 shadow-sm">
                                            {doDoc.documentNo}
                                          </span>
                                          <div>
                                            <span className="text-xs text-slate-800 font-bold block">
                                              {doDoc.projectNote || "รายการ Part ที่จัดส่ง Line ADC"}
                                            </span>
                                            <span className="text-[11px] text-slate-500 font-mono">
                                              วันที่ส่งมอบ: {formatThaiDate(doDoc.issueDate)}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3 self-end sm:self-auto">
                                          <div className="text-right">
                                            <span className="text-[10px] text-slate-500 block font-medium">มูลค่าสินค้าก่อนภาษี</span>
                                            <span className="font-mono font-bold text-xs text-slate-800">
                                              ฿{formatMoney(doDoc.subtotal || doDoc.grandTotal)}
                                            </span>
                                          </div>
                                          <button
                                            onClick={() => openViewDocument(doDoc)}
                                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>ดู / พิมพ์ใบส่งของ</span>
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 3. Next Action & Unbilled Milestone Card */}
                              {hasUninvoiced ? (
                                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                                  <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold shadow-sm">
                                      <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-indigo-950">ยอดคงเหลือที่ยังไม่ได้เปิดใบแจ้งหนี้:</span>
                                        <span className="text-xs font-black font-mono text-indigo-700">฿{formatMoney(poItem.uninvoicedAmount)}</span>
                                      </div>
                                      <p className="text-[11px] text-indigo-700 mt-0.5">
                                        งวดงานถัดไปตามสัญญา PO พร้อมสำหรับการออกใบแจ้งหนี้เพื่อส่งเรียกเก็บเงินกับลูกค้า
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={() => setActiveTab("milestone-billing")}
                                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs flex items-center gap-1.5 border border-indigo-200 shadow-sm transition active:scale-95"
                                    >
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span>ดูผังงวดงาน</span>
                                    </button>
                                    <button
                                      onClick={() => openCreateModal("INVOICE", poItem.poNo, customer)}
                                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition active:scale-95"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>ออกใบแจ้งหนี้งวดนี้</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>โครงการนี้ได้ทำการเปิดใบแจ้งหนี้ครบตามยอด PO ทั้งหมดเรียบร้อยแล้ว</span>
                                </div>
                              )}

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
