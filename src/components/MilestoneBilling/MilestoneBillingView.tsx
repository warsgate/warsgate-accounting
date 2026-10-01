import React, { useState, useMemo } from 'react';
import { 
  FileText, Plus, CheckCircle2, Clock, AlertCircle, DollarSign,
  TrendingUp, Building2, ChevronRight, ChevronDown, Sparkles,
  ArrowRight, Search, Filter, ShieldCheck, Printer, Download,
  ExternalLink, Edit3, Trash2, Layers, RefreshCw,
  Target, LayoutGrid, Eye
} from 'lucide-react';
import { 
  ContractMilestonePlan, ProjectMilestone, Contact, 
  AccountingDocument, CompanyProfile, DocumentNumberingConfig 
} from '../../types';
import { MilestonePlanModal } from './MilestonePlanModal';
import { generateNextDocumentNo } from '../../utils/numbering';
import { addAuditLog } from '../../utils/auditLogger';
import { initialMilestonePlans } from '../../data/initialMilestonePlans';
import { formatMoney } from '../../utils/formatters';

interface MilestoneBillingViewProps {
  documents: AccountingDocument[];
  contacts: Contact[];
  company: CompanyProfile;
  numberingConfig: DocumentNumberingConfig;
  onSaveDocument: (doc: AccountingDocument) => void;
  openViewDocument: (doc: AccountingDocument) => void;
  setActiveTab: (tab: string) => void;
}

const STORAGE_KEY = 'warsgate_milestone_plans';

export const MilestoneBillingView: React.FC<MilestoneBillingViewProps> = ({
  documents,
  contacts,
  company,
  numberingConfig,
  onSaveDocument,
  openViewDocument,
  setActiveTab
}) => {
  const [plans, setPlans] = useState<ContractMilestonePlan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: ContractMilestonePlan[] = JSON.parse(saved);
        const map = new Map<string, ContractMilestonePlan>();
        initialMilestonePlans.forEach(p => map.set(p.id, p));
        parsed.forEach(p => {
          if (p.id !== 'plan-kuroda-vision' && !map.has(p.id)) {
            map.set(p.id, p);
          }
        });
        const merged = Array.from(map.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      } catch (e) {
        console.error('Failed to parse saved milestone plans', e);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMilestonePlans));
    return initialMilestonePlans;
  });

  const [viewMode, setViewMode] = useState<'SINGLE' | 'MATRIX' | 'ALL'>('SINGLE');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<ContractMilestonePlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(new Set());

  // Save to LocalStorage
  const savePlans = (updatedPlans: ContractMilestonePlan[]) => {
    setPlans(updatedPlans);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlans));
  };

  const handleToggleExpand = (id: string) => {
    setExpandedPlanIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSavePlan = (plan: ContractMilestonePlan) => {
    const exists = plans.some(p => p.id === plan.id);
    const updated = exists ? plans.map(p => p.id === plan.id ? plan : p) : [plan, ...plans];
    savePlans(updated);

    addAuditLog({
      userName: 'จีระวัฒน์ ปรีชานุรักษ์',
      userRole: 'MD_ADMIN',
      action: exists ? 'UPDATE_DOC' : 'CREATE_DOC',
      targetDocNo: plan.referencePoNo || plan.quotationDocNo || plan.contractTitle,
      details: `${exists ? 'แก้ไข' : 'สร้าง'}แผนวางบิลตามงวดงาน "${plan.contractTitle}" มูลค่า ฿${plan.totalContractAmount.toLocaleString()}`
    });
  };

  const handleDeletePlan = (id: string) => {
    const target = plans.find(p => p.id === id);
    if (window.confirm(`ต้องการลบแผนงวดงาน "${target?.contractTitle || ''}" ใช่หรือไม่?`)) {
      const updated = plans.filter(p => p.id !== id);
      savePlans(updated);
      
      addAuditLog({
        userName: 'จีระวัฒน์ ปรีชานุรักษ์',
        userRole: 'MD_ADMIN',
        action: 'DELETE_DOC',
        targetDocNo: target?.referencePoNo || 'PLAN',
        details: `ลบแผนวางบิลตามงวดงาน "${target?.contractTitle || ''}"`
      });
    }
  };

  // 1-Click Generate Invoice for a specific Milestone
  const handleGenerateInvoiceForMilestone = (plan: ContractMilestonePlan, milestone: ProjectMilestone) => {
    if (!window.confirm(`ยืนยันการออกใบแจ้งหนี้สำหรับ "${milestone.title}" ยอดเงิน ฿${milestone.amount.toLocaleString()}?`)) {
      return;
    }

    const nextDocNo = generateNextDocumentNo('INVOICE', numberingConfig);
    const issueDate = new Date().toISOString().split('T')[0];
    const dueDays = plan.customerContact.creditDays || 30;
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + dueDays);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    // Pre-calculate subtotal, vat, grandTotal
    // If milestone.amount is already gross VAT inclusive:
    const vatRate = 7;
    const subtotal = Math.round((milestone.amount / (1 + vatRate / 100)) * 100) / 100;
    const vatAmount = Math.round((milestone.amount - subtotal) * 100) / 100;
    const grandTotal = milestone.amount;

    const newInvoice: AccountingDocument = {
      id: `doc-inv-ms-${Date.now()}`,
      documentNo: nextDocNo,
      type: 'INVOICE',
      issueDate: issueDate,
      dueDate: dueDate,
      referencePoNo: plan.referencePoNo || '',
      referenceDocNo: plan.quotationDocNo || '',
      projectNote: `${plan.projectName} (${milestone.title})`,
      contact: plan.customerContact,
      items: [
        {
          id: `item-ms-${Date.now()}`,
          code: `MS-${milestone.milestoneNo}`,
          name: `${plan.projectName} - ${milestone.title}`,
          description: `เบิกเงินตามงวดงานสัญญา ${milestone.percentage}% ของมูลค่าสัญญารวม ฿${plan.totalContractAmount.toLocaleString()}${plan.referencePoNo ? ` (อ้างอิง PO: ${plan.referencePoNo})` : ''}`,
          quantity: 1,
          unit: 'งวด',
          pricePerUnit: subtotal,
          discount: 0,
          amount: subtotal,
          vatInclusive: false,
          withholdingTaxRate: 0
        }
      ],
      subtotal: subtotal,
      discountTotal: 0,
      vatRate: vatRate,
      vatAmount: vatAmount,
      grandTotal: grandTotal,
      withholdingTaxTotal: 0,
      netPayment: grandTotal,
      status: 'PENDING',
      notes: `วางบิลตามงวดงานสัญญา งวดที่ ${milestone.milestoneNo} (${milestone.percentage}%)\nกำหนดชำระเงินภายใน ${dueDays} วัน (${dueDate})`,
      createdByName: 'ระบบวางบิลอัตโนมัติ (Milestone Engine)'
    };

    // 1. Save new Invoice to global state
    onSaveDocument(newInvoice);

    // 2. Update Milestone status to INVOICED and link docNo
    const updatedMilestones = plan.milestones.map(m => {
      if (m.id === milestone.id) {
        return {
          ...m,
          status: 'INVOICED' as const,
          invoiceDocNo: nextDocNo,
          invoiceDocId: newInvoice.id
        };
      }
      return m;
    });

    const updatedPlan: ContractMilestonePlan = {
      ...plan,
      milestones: updatedMilestones,
      updatedAt: issueDate
    };

    savePlans(plans.map(p => p.id === plan.id ? updatedPlan : p));

    // 3. Log Audit
    addAuditLog({
      userName: 'ปิยะดา การค้า',
      userRole: 'SALES',
      action: 'MILESTONE_INVOICE',
      targetDocNo: nextDocNo,
      details: `ออกใบแจ้งหนี้อัตโนมัติ ${nextDocNo} สำหรับ ${plan.contractTitle} (${milestone.title}) ยอด ฿${grandTotal.toLocaleString()}`
    });

    // 4. Open document viewer
    openViewDocument(newInvoice);
  };

  // Calculate Overall Analytics
  const analytics = useMemo(() => {
    let totalContractValue = 0;
    let totalInvoicedValue = 0;
    let totalPaidValue = 0;
    let totalWaitingValue = 0;

    plans.forEach(plan => {
      totalContractValue += plan.totalContractAmount;
      plan.milestones.forEach(m => {
        if (m.status === 'PAID') {
          totalPaidValue += m.amount;
          totalInvoicedValue += m.amount;
        } else if (m.status === 'INVOICED') {
          totalInvoicedValue += m.amount;
        } else {
          totalWaitingValue += m.amount;
        }
      });
    });

    const invoicedPercentage = totalContractValue > 0 ? (totalInvoicedValue / totalContractValue) * 100 : 0;
    const paidPercentage = totalContractValue > 0 ? (totalPaidValue / totalContractValue) * 100 : 0;

    return {
      totalContracts: plans.length,
      totalContractValue,
      totalInvoicedValue,
      totalPaidValue,
      totalWaitingValue,
      invoicedPercentage,
      paidPercentage
    };
  }, [plans]);

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchQuery = 
        p.contractTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.customerContact.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.referencePoNo && p.referencePoNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.quotationDocNo && p.quotationDocNo.toLowerCase().includes(searchQuery.toLowerCase()));

      const isCompleted = p.milestones.every(m => m.status === 'PAID');
      
      if (filterStatus === 'COMPLETED') return matchQuery && isCompleted;
      if (filterStatus === 'IN_PROGRESS') return matchQuery && !isCompleted;
      return matchQuery;
    });
  }, [plans, searchQuery, filterStatus]);

  // Active plan for SINGLE view
  const currentPlan = filteredPlans.find(p => p.id === selectedPlanId) || filteredPlans[0];

  return (
    <div className="space-y-3.5 pb-12">
      
      {/* ── Compact Header ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white shadow-xl border border-indigo-900/50">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10.5px] font-bold border border-indigo-500/30">
                <Layers className="w-3 h-3" />
                PROGRESSIVE BILLING
              </span>
              <span className="text-[10.5px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                {analytics.totalContracts} สัญญาโครงการ
              </span>
              <span className="text-[10.5px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                🛡️ รับชำระ ฿{formatMoney(analytics.totalPaidValue)} ({analytics.paidPercentage.toFixed(0)}%)
              </span>
              <span className="text-[10.5px] font-mono text-sky-200 bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-500/30">
                📄 วางบิล ฿{formatMoney(analytics.totalInvoicedValue)} ({analytics.invoicedPercentage.toFixed(0)}%)
              </span>
              <span className="text-[10.5px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                ⏳ รอวางบิล ฿{formatMoney(analytics.totalWaitingValue)}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
              ระบบวางบิลตามงวดงานสัญญา
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              บริหารสัญญาและตัดงวดวางบิลอัตโนมัติ (50-40-10, 30-50-20) สำหรับงานออกแบบและสร้างเครื่องจักรอัตโนมัติ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedPlanForEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างแผนงวดงานใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Views & Filters ─────────────────────────────────────────── */}
      <div className="glass-panel p-2.5 sm:p-3 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 shadow-sm border border-slate-200 bg-white">
        
        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs overflow-x-auto">
          <button
            onClick={() => setViewMode('SINGLE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              viewMode === 'SINGLE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>🎯 รายสัญญา (Single Focus)</span>
          </button>

          <button
            onClick={() => setViewMode('MATRIX')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              viewMode === 'MATRIX' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>📊 ตารางสรุปภาพรวม (Master Matrix)</span>
          </button>

          <button
            onClick={() => setViewMode('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              viewMode === 'ALL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>📜 การ์ดทั้งหมด</span>
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาโครงการ, PO, ลูกค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                filterStatus === 'ALL' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({plans.length})
            </button>
            <button
              onClick={() => setFilterStatus('IN_PROGRESS')}
              className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                filterStatus === 'IN_PROGRESS' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              กำลังทำ ({plans.filter(p => !p.milestones.every(m => m.status === 'PAID')).length})
            </button>
            <button
              onClick={() => setFilterStatus('COMPLETED')}
              className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                filterStatus === 'COMPLETED' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เสร็จสิ้น ({plans.filter(p => p.milestones.every(m => m.status === 'PAID')).length})
            </button>
          </div>
        </div>

      </div>

      {/* ── VIEW 1: SINGLE CONTRACT FOCUS (ZERO-SCROLL VIEW) ───────────────────── */}
      {viewMode === 'SINGLE' && (
        <div className="space-y-3">
          
          {/* Contract Tabs Strip */}
          <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1.5 px-2">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Target className="w-3 h-3 text-indigo-600" />
                คลิกเลือกสัญญาเพื่อดูงวดงาน (ดูจบในหน้าเดียว ไม่ต้องเลื่อน):
              </span>
              <span className="text-[10.5px] font-mono text-slate-400">
                {filteredPlans.length} สัญญา
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {filteredPlans.map(plan => {
                const isSelected = (currentPlan?.id === plan.id);
                const paidCount = plan.milestones.filter(m => m.status === 'PAID').length;
                const totalCount = plan.milestones.length;
                const isAllPaid = paidCount === totalCount;

                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`px-3 py-2 rounded-xl text-left transition shrink-0 flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300/40'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className={`font-mono font-extrabold text-[11px] px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {plan.referencePoNo || plan.projectCode || plan.customerContact.companyName.slice(0, 3)}
                    </span>
                    <div className="min-w-0 max-w-[150px] sm:max-w-[200px]">
                      <span className="block text-xs font-bold truncate">
                        {plan.contractTitle}
                      </span>
                      <span className={`block text-[9.5px] truncate font-mono ${
                        isSelected ? 'text-indigo-100' : 'text-slate-400'
                      }`}>
                        ฿{formatMoney(plan.totalContractAmount)}
                      </span>
                    </div>
                    <span className={`font-mono font-extrabold text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected 
                        ? (isAllPaid ? 'bg-emerald-400 text-slate-900' : 'bg-white/20 text-white')
                        : (isAllPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-50 text-indigo-700')
                    }`}>
                      {isAllPaid ? 'ครบ 100%' : `งวด ${paidCount}/${totalCount}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Contract Detail Box */}
          {currentPlan ? (
            (() => {
              const paidSum = currentPlan.milestones.filter(m => m.status === 'PAID').reduce((s, m) => s + m.amount, 0);
              const invoicedSum = currentPlan.milestones.filter(m => m.status === 'INVOICED').reduce((s, m) => s + m.amount, 0);
              const waitingSum = currentPlan.milestones.filter(m => m.status === 'WAITING').reduce((s, m) => s + m.amount, 0);

              const paidPct = currentPlan.totalContractAmount > 0 ? (paidSum / currentPlan.totalContractAmount) * 100 : 0;
              const invoicedPct = currentPlan.totalContractAmount > 0 ? (invoicedSum / currentPlan.totalContractAmount) * 100 : 0;
              const waitingPct = currentPlan.totalContractAmount > 0 ? (waitingSum / currentPlan.totalContractAmount) * 100 : 0;

              const paidCount = currentPlan.milestones.filter(m => m.status === 'PAID').length;
              const totalCount = currentPlan.milestones.length;
              const isAllPaid = paidCount === totalCount;

              return (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  
                  {/* Contract Header */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/70 border-b border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {currentPlan.customerContact.companyName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-extrabold text-slate-900">
                            {currentPlan.contractTitle}
                          </h3>
                          {isAllPaid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ชำระครบถ้วน 100%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                              <Clock className="w-3 h-3 text-indigo-600" />
                              งวดงาน {paidCount}/{totalCount}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                          <span className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {currentPlan.customerContact.companyName}
                          </span>
                          {currentPlan.referencePoNo && (
                            <span className="text-[11px] px-2 py-0.2 bg-slate-200/70 text-slate-700 rounded font-mono font-bold">
                              PO: {currentPlan.referencePoNo}
                            </span>
                          )}
                          {currentPlan.quotationDocNo && (
                            <span className="text-[11px] px-2 py-0.2 bg-sky-50 text-sky-700 border border-sky-200 rounded font-mono">
                              QT: {currentPlan.quotationDocNo}
                            </span>
                          )}
                          {currentPlan.projectCode && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              Code: {currentPlan.projectCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Total Amount & Action Buttons */}
                    <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">มูลค่าสัญญารวม</span>
                        <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                          ฿{formatMoney(currentPlan.totalContractAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedPlanForEdit(currentPlan);
                            setIsModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition border border-transparent hover:border-indigo-100"
                          title="แก้ไขแผนงวดงาน"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(currentPlan.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100"
                          title="ลบแผนงวดงาน"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Color Progress Bar */}
                  <div className="px-5 py-3 bg-white border-b border-slate-100">
                    <div className="flex items-center justify-between text-[11px] mb-1.5 font-semibold text-slate-600 flex-wrap gap-2">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1 text-emerald-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                          รับชำระแล้ว: ฿{formatMoney(paidSum)} ({paidPct.toFixed(0)}%)
                        </span>
                        <span className="flex items-center gap-1 text-sky-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                          ออก Invoice แล้ว: ฿{formatMoney(invoicedSum)} ({invoicedPct.toFixed(0)}%)
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                          รอวางบิล: ฿{formatMoney(waitingSum)} ({waitingPct.toFixed(0)}%)
                        </span>
                      </div>
                      <span className="font-mono text-slate-700 font-bold">
                        {(paidPct + invoicedPct).toFixed(0)}% วางบิลสะสม
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${paidPct}%` }} 
                        className="bg-emerald-500 h-full transition-all duration-500" 
                        title={`รับชำระแล้ว ${paidPct.toFixed(1)}%`}
                      />
                      <div 
                        style={{ width: `${invoicedPct}%` }} 
                        className="bg-sky-500 h-full transition-all duration-500" 
                        title={`ออก Invoice แล้ว ${invoicedPct.toFixed(1)}%`}
                      />
                      <div 
                        style={{ width: `${waitingPct}%` }} 
                        className="bg-slate-200 h-full transition-all duration-500" 
                        title={`รอวางบิล ${waitingPct.toFixed(1)}%`}
                      />
                    </div>
                  </div>

                  {/* Milestones List (Compact Format) */}
                  <div className="p-4 sm:p-5 bg-slate-50/30">
                    <div className="space-y-2">
                      {currentPlan.milestones.map((milestone) => {
                        const isWaiting = milestone.status === 'WAITING';
                        const isInvoiced = milestone.status === 'INVOICED';
                        const isPaid = milestone.status === 'PAID';

                        const matchingDoc = milestone.invoiceDocNo 
                          ? documents.find(d => d.documentNo === milestone.invoiceDocNo)
                          : null;

                        return (
                          <div
                            key={milestone.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition gap-2.5 ${
                              isPaid
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : isInvoiced
                                ? 'bg-sky-50/40 border-sky-200'
                                : 'bg-white border-slate-200 shadow-2xs hover:border-indigo-300'
                            }`}
                          >
                            {/* Left: Stage Title & Details */}
                            <div className="flex items-start sm:items-center gap-3">
                              <div className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                                isPaid
                                  ? 'bg-emerald-600 text-white'
                                  : isInvoiced
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {milestone.milestoneNo}
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900">
                                    {milestone.title}
                                  </span>
                                  
                                  {isPaid && (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full border border-emerald-300">
                                      ✓ รับชำระแล้ว
                                    </span>
                                  )}
                                  {isInvoiced && (
                                    <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.2 rounded-full border border-sky-300">
                                      📄 วางบิลแล้ว ({milestone.invoiceDocNo})
                                    </span>
                                  )}
                                  {isWaiting && (
                                    <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.2 rounded-full border border-amber-200">
                                      ⏳ รอวางบิล
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                                  <span className="font-semibold text-slate-700">
                                    สัดส่วน: {milestone.percentage}%
                                  </span>
                                  {milestone.dueDate && (
                                    <span>กำหนดการ: {milestone.dueDate}</span>
                                  )}
                                  {milestone.notes && (
                                    <span className="text-slate-400 italic">({milestone.notes})</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Amount & 1-Click Action */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                              <div className="text-left sm:text-right">
                                <span className="text-xs sm:text-sm font-black text-slate-900 block font-mono">
                                  ฿{formatMoney(milestone.amount)}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ({milestone.percentage}% ของยอดสัญญา)
                                </span>
                              </div>

                              <div>
                                {isWaiting && (
                                  <button
                                    onClick={() => handleGenerateInvoiceForMilestone(currentPlan, milestone)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs transition active:scale-95 whitespace-nowrap"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                                    <span>ออก Invoice งวดนี้</span>
                                  </button>
                                )}

                                {(isInvoiced || isPaid) && matchingDoc && (
                                  <button
                                    onClick={() => openViewDocument(matchingDoc)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition whitespace-nowrap"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                                    <span>ดู {milestone.invoiceDocNo}</span>
                                  </button>
                                )}

                                {(isInvoiced || isPaid) && !matchingDoc && milestone.invoiceDocNo && (
                                  <span className="text-xs font-mono font-bold text-sky-700 px-2.5 py-1 bg-sky-50 rounded-lg border border-sky-200">
                                    {milestone.invoiceDocNo}
                                  </span>
                                )}
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })()
          ) : (
            <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              ไม่พบแผนงวดงานตามตัวกรองที่เลือก
            </div>
          )}

        </div>
      )}

      {/* ── VIEW 2: MASTER MILESTONE MATRIX (ALL CONTRACTS IN ONE SCREEN) ───────── */}
      {viewMode === 'MATRIX' && (
        <div className="glass-panel rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                ตารางสรุปสถานะการวางบิลตามงวดงานทุกสัญญา (Master Milestone Matrix)
              </h3>
              <p className="text-[11px] text-slate-500">
                ดูแผนงวดงานของทุกสัญญาในหน้าจอเดียว คลิกที่แถวสัญญาเพื่อดูรายละเอียดเจาะลึก
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> ชำระแล้ว
              </span>
              <span className="inline-flex items-center gap-1 text-sky-700">
                <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> วางบิลแล้ว
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> รอวางบิล
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[920px]">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-44">สัญญา / โครงการ</th>
                  <th className="py-2.5 px-3 w-40">ลูกค้า & PO</th>
                  <th className="py-2.5 px-3 text-right w-28">มูลค่าสัญญารวม</th>
                  <th className="py-2.5 px-3 text-center">แผนงวดงาน (Milestones Progress)</th>
                  <th className="py-2.5 px-3 text-center w-28">PROGRESS</th>
                  <th className="py-2.5 px-3 text-right w-28">ยอดรอวางบิล</th>
                  <th className="py-2.5 px-3 text-center w-24">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.map(plan => {
                  const paidSum = plan.milestones.filter(m => m.status === 'PAID').reduce((s, m) => s + m.amount, 0);
                  const invoicedSum = plan.milestones.filter(m => m.status === 'INVOICED').reduce((s, m) => s + m.amount, 0);
                  const waitingSum = plan.milestones.filter(m => m.status === 'WAITING').reduce((s, m) => s + m.amount, 0);

                  const paidPct = plan.totalContractAmount > 0 ? (paidSum / plan.totalContractAmount) * 100 : 0;
                  const invoicedPct = plan.totalContractAmount > 0 ? (invoicedSum / plan.totalContractAmount) * 100 : 0;
                  const progressPct = Math.round(paidPct + invoicedPct);

                  return (
                    <tr 
                      key={plan.id} 
                      className="hover:bg-indigo-50/50 transition cursor-pointer group"
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setViewMode('SINGLE');
                      }}
                    >
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block truncate max-w-[170px]" title={plan.contractTitle}>
                          {plan.contractTitle}
                        </span>
                        {plan.projectCode && (
                          <span className="font-mono text-[10px] text-indigo-700 block">
                            Code: {plan.projectCode}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="text-slate-800 font-medium block truncate max-w-[160px]" title={plan.customerContact.companyName}>
                          {plan.customerContact.companyName}
                        </span>
                        {plan.referencePoNo && (
                          <span className="font-mono text-[10px] text-slate-500 block">
                            PO: <strong className="text-slate-700">{plan.referencePoNo}</strong>
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ฿{formatMoney(plan.totalContractAmount)}
                      </td>

                      {/* Milestones Mini Pills */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {plan.milestones.map((m) => {
                            const isPaid = m.status === 'PAID';
                            const isInvoiced = m.status === 'INVOICED';

                            return (
                              <div
                                key={m.id}
                                className={`px-2 py-1 rounded-lg border text-[9.5px] font-mono font-bold flex items-center gap-1 transition ${
                                  isPaid
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : isInvoiced
                                    ? 'bg-sky-50 text-sky-800 border-sky-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                                title={`${m.title} (${m.percentage}%): ฿${formatMoney(m.amount)} - ${
                                  isPaid ? 'รับชำระแล้ว' : isInvoiced ? `วางบิลแล้ว (${m.invoiceDocNo})` : 'รอวางบิล'
                                }`}
                              >
                                <span>งวด {m.milestoneNo}</span>
                                <span className="opacity-75">({m.percentage}%)</span>
                                <span>{isPaid ? '✓' : isInvoiced ? '📄' : '⏳'}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Progress Bar */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div 
                              className={`h-full transition-all ${
                                progressPct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[10.5px] w-8 text-right text-slate-700">
                            {progressPct}%
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                        ฿{formatMoney(waitingSum)}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlanId(plan.id);
                            setViewMode('SINGLE');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 text-[10.5px] font-bold transition flex items-center justify-center gap-1 mx-auto"
                        >
                          <Eye className="w-3 h-3" />
                          <span>ดูงวดงาน</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VIEW 3: ALL CARDS (WITH ACCORDION TOGGLE) ─────────────────────────── */}
      {viewMode === 'ALL' && (
        <div className="space-y-4">
          {filteredPlans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">ยังไม่มีแผนวางบิลตามงวดงาน</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                เริ่มต้นสร้างแผนงวดงานแรกของคุณเพื่อแบ่งสัดส่วนการชำระเงินตามสัญญา 50-40-10 หรือตามตกลงกับลูกค้า
              </p>
              <button
                onClick={() => {
                  setSelectedPlanForEdit(null);
                  setIsModalOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition"
              >
                <Plus className="w-4 h-4" />
                <span>สร้างแผนงวดงานแรก</span>
              </button>
            </div>
          ) : (
            filteredPlans.map(plan => {
              const isExpanded = expandedPlanIds.has(plan.id);
              const paidSum = plan.milestones.filter(m => m.status === 'PAID').reduce((s, m) => s + m.amount, 0);
              const invoicedSum = plan.milestones.filter(m => m.status === 'INVOICED').reduce((s, m) => s + m.amount, 0);
              const waitingSum = plan.milestones.filter(m => m.status === 'WAITING').reduce((s, m) => s + m.amount, 0);

              const paidPct = plan.totalContractAmount > 0 ? (paidSum / plan.totalContractAmount) * 100 : 0;
              const invoicedPct = plan.totalContractAmount > 0 ? (invoicedSum / plan.totalContractAmount) * 100 : 0;
              const waitingPct = plan.totalContractAmount > 0 ? (waitingSum / plan.totalContractAmount) * 100 : 0;

              const paidCount = plan.milestones.filter(m => m.status === 'PAID').length;
              const totalCount = plan.milestones.length;
              const isAllPaid = paidCount === totalCount;

              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition overflow-hidden"
                >
                  {/* Plan Header */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {plan.customerContact.companyName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                            {plan.contractTitle}
                          </h3>
                          {isAllPaid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ชำระครบถ้วน 100%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                              <Clock className="w-3 h-3 text-indigo-600" />
                              งวดงาน {paidCount}/{totalCount}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                          <span className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {plan.customerContact.companyName}
                          </span>
                          {plan.referencePoNo && (
                            <span className="text-[11px] px-2 py-0.2 bg-slate-200/70 text-slate-700 rounded font-mono font-bold">
                              PO: {plan.referencePoNo}
                            </span>
                          )}
                          {plan.quotationDocNo && (
                            <span className="text-[11px] px-2 py-0.2 bg-sky-50 text-sky-700 border border-sky-200 rounded font-mono">
                              QT: {plan.quotationDocNo}
                            </span>
                          )}
                          {plan.projectCode && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              Code: {plan.projectCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Amount & Actions */}
                    <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">มูลค่าสัญญารวม</span>
                        <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                          ฿{formatMoney(plan.totalContractAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedPlanForEdit(plan);
                            setIsModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="แก้ไขแผนงวดงาน"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="ลบแผนงวดงาน"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleExpand(plan.id)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1 text-xs font-bold"
                        >
                          {isExpanded ? (
                            <>
                              <span>ซ่อน</span>
                              <ChevronDown className="w-4 h-4 rotate-180 transition-transform" />
                            </>
                          ) : (
                            <>
                              <span>ดูงวดงาน ({plan.milestones.length})</span>
                              <ChevronDown className="w-4 h-4 transition-transform" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar Row */}
                  <div className="px-5 py-3 bg-white">
                    <div className="flex items-center justify-between text-[11px] mb-1.5 font-semibold text-slate-600 flex-wrap gap-2">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1 text-emerald-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                          รับชำระแล้ว: ฿{formatMoney(paidSum)} ({paidPct.toFixed(0)}%)
                        </span>
                        <span className="flex items-center gap-1 text-sky-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                          ออก Invoice แล้ว: ฿{formatMoney(invoicedSum)} ({invoicedPct.toFixed(0)}%)
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                          รอวางบิล: ฿{formatMoney(waitingSum)} ({waitingPct.toFixed(0)}%)
                        </span>
                      </div>
                      <span className="font-mono text-slate-700 font-bold">
                        {(paidPct + invoicedPct).toFixed(0)}% วางบิลสะสม
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${paidPct}%` }} 
                        className="bg-emerald-500 h-full transition-all duration-500" 
                        title={`รับชำระแล้ว ${paidPct.toFixed(1)}%`}
                      />
                      <div 
                        style={{ width: `${invoicedPct}%` }} 
                        className="bg-sky-500 h-full transition-all duration-500" 
                        title={`ออก Invoice แล้ว ${invoicedPct.toFixed(1)}%`}
                      />
                      <div 
                        style={{ width: `${waitingPct}%` }} 
                        className="bg-slate-200 h-full transition-all duration-500" 
                        title={`รอวางบิล ${waitingPct.toFixed(1)}%`}
                      />
                    </div>
                  </div>

                  {/* Expanded Milestones Breakdown Table */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/30 p-4 sm:p-5">
                      <div className="space-y-2">
                        {plan.milestones.map((milestone) => {
                          const isWaiting = milestone.status === 'WAITING';
                          const isInvoiced = milestone.status === 'INVOICED';
                          const isPaid = milestone.status === 'PAID';

                          const matchingDoc = milestone.invoiceDocNo 
                            ? documents.find(d => d.documentNo === milestone.invoiceDocNo)
                            : null;

                          return (
                            <div
                              key={milestone.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition gap-2.5 ${
                                isPaid
                                  ? 'bg-emerald-50/40 border-emerald-200'
                                  : isInvoiced
                                  ? 'bg-sky-50/40 border-sky-200'
                                  : 'bg-white border-slate-200 shadow-2xs hover:border-indigo-300'
                              }`}
                            >
                              {/* Left: Stage Title & Details */}
                              <div className="flex items-start sm:items-center gap-3">
                                <div className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                                  isPaid
                                    ? 'bg-emerald-600 text-white'
                                    : isInvoiced
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {milestone.milestoneNo}
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-slate-900">
                                      {milestone.title}
                                    </span>
                                    
                                    {isPaid && (
                                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full border border-emerald-300">
                                        ✓ รับชำระแล้ว
                                      </span>
                                    )}
                                    {isInvoiced && (
                                      <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.2 rounded-full border border-sky-300">
                                        📄 วางบิลแล้ว ({milestone.invoiceDocNo})
                                      </span>
                                    )}
                                    {isWaiting && (
                                      <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.2 rounded-full border border-amber-200">
                                        ⏳ รอวางบิล
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                                    <span className="font-semibold text-slate-700">
                                      สัดส่วน: {milestone.percentage}%
                                    </span>
                                    {milestone.dueDate && (
                                      <span>กำหนดการ: {milestone.dueDate}</span>
                                    )}
                                    {milestone.notes && (
                                      <span className="text-slate-400 italic">({milestone.notes})</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Amount & Action Button */}
                              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                <div className="text-left sm:text-right">
                                  <span className="text-xs sm:text-sm font-black text-slate-900 block font-mono">
                                    ฿{formatMoney(milestone.amount)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    ({milestone.percentage}% ของยอดสัญญา)
                                  </span>
                                </div>

                                <div>
                                  {isWaiting && (
                                    <button
                                      onClick={() => handleGenerateInvoiceForMilestone(plan, milestone)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs transition active:scale-95 whitespace-nowrap"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                                      <span>ออก Invoice งวดนี้</span>
                                    </button>
                                  )}

                                  {(isInvoiced || isPaid) && matchingDoc && (
                                    <button
                                      onClick={() => openViewDocument(matchingDoc)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition whitespace-nowrap"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-sky-600" />
                                      <span>ดู {milestone.invoiceDocNo}</span>
                                    </button>
                                  )}

                                  {(isInvoiced || isPaid) && !matchingDoc && milestone.invoiceDocNo && (
                                    <span className="text-xs font-mono font-bold text-sky-700 px-2.5 py-1 bg-sky-50 rounded-lg border border-sky-200">
                                      {milestone.invoiceDocNo}
                                    </span>
                                  )}
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      )}

      {/* Plan Modal */}
      {isModalOpen && (
        <MilestonePlanModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePlan}
          existingPlan={selectedPlanForEdit}
          contacts={contacts}
          documents={documents}
        />
      )}

    </div>
  );
};
