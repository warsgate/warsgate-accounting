import React, { useState, useMemo } from 'react';
import { 
  FileText, Plus, CheckCircle2, Clock, AlertCircle, DollarSign,
  TrendingUp, Building2, ChevronRight, ChevronDown, Sparkles,
  ArrowRight, Search, Filter, ShieldCheck, Printer, Download,
  ExternalLink, Edit3, Trash2, Layers, RefreshCw
} from 'lucide-react';
import { 
  ContractMilestonePlan, ProjectMilestone, Contact, 
  AccountingDocument, CompanyProfile, DocumentNumberingConfig 
} from '../../types';
import { MilestonePlanModal } from './MilestonePlanModal';
import { generateNextDocumentNo } from '../../utils/numbering';
import { addAuditLog } from '../../utils/auditLogger';
import { initialMilestonePlans } from '../../data/initialMilestonePlans';

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
          if (!map.has(p.id)) {
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

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-900/50">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                ระบบวางบิลตามงวดงานสัญญา
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-bold uppercase tracking-wider">
                Progressive Billing
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              บริหารสัญญาและตัดงวดวางบิลอัตโนมัติ (50-40-10, 30-50-20) สำหรับงานออกแบบและสร้างเครื่องจักรอัตโนมัติ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedPlanForEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างแผนงวดงานใหม่</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Contract Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">มูลค่าสัญญารวมทั้งหมด</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">
              ฿{analytics.totalContractValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span>จากทั้งหมด {analytics.totalContracts} สัญญาโครงการ</span>
            </div>
          </div>
        </div>

        {/* Total Invoiced (Billed) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700">วางบิลแล้ว (Invoiced)</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-sky-700">
              ฿{analytics.totalInvoicedValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-sky-600 mt-1 flex items-center gap-1 font-semibold">
              <span>{analytics.invoicedPercentage.toFixed(1)}% ของมูลค่าสัญญารวม</span>
            </div>
          </div>
        </div>

        {/* Total Collected Cash */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">รับชำระแล้ว (Paid)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-emerald-700">
              ฿{analytics.totalPaidValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
              <span>{analytics.paidPercentage.toFixed(1)}% เก็บเงินเข้ากระแสเงินสดแล้ว</span>
            </div>
          </div>
        </div>

        {/* Total Remaining Unbilled */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">ยอดรอวางบิลคงเหลือ</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-indigo-700">
              ฿{analytics.totalWaitingValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-indigo-600 mt-1 flex items-center gap-1 font-semibold">
              <span>รอส่งมอบงานเพื่อเปิด Invoice</span>
            </div>
          </div>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อโครงการ, เลขที่ PO, ลูกค้า..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterStatus === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({plans.length})
          </button>
          <button
            onClick={() => setFilterStatus('IN_PROGRESS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterStatus === 'IN_PROGRESS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            อยู่ระหว่างดำเนินการ ({plans.filter(p => !p.milestones.every(m => m.status === 'PAID')).length})
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterStatus === 'COMPLETED'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            เสร็จสมบูรณ์ ({plans.filter(p => p.milestones.every(m => m.status === 'PAID')).length})
          </button>
        </div>
      </div>

      {/* Contract Milestone Cards List */}
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
                      <span className="text-base sm:text-lg font-black text-slate-900">
                        ฿{plan.totalContractAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
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
                        className={`p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1 text-xs font-bold`}
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
                  <div className="flex items-center justify-between text-[11px] mb-1.5 font-semibold text-slate-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-emerald-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        รับชำระแล้ว: ฿{paidSum.toLocaleString()} ({paidPct.toFixed(0)}%)
                      </span>
                      <span className="flex items-center gap-1 text-sky-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                        ออก Invoice แล้ว: ฿{invoicedSum.toLocaleString()} ({invoicedPct.toFixed(0)}%)
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                        รอวางบิล: ฿{waitingSum.toLocaleString()} ({waitingPct.toFixed(0)}%)
                      </span>
                    </div>
                    <span className="font-mono text-slate-700 font-bold">
                      {(paidPct + invoicedPct).toFixed(0)}% วางบิลสะสม
                    </span>
                  </div>

                  {/* Multi-color Bar */}
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
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
                {(isExpanded || true) && (
                  <div className="border-t border-slate-100 bg-slate-50/30 p-4 sm:p-5">
                    <div className="space-y-2.5">
                      {plan.milestones.map((milestone, mIdx) => {
                        const isWaiting = milestone.status === 'WAITING';
                        const isInvoiced = milestone.status === 'INVOICED';
                        const isPaid = milestone.status === 'PAID';

                        // Find matching document if exists
                        const matchingDoc = milestone.invoiceDocNo 
                          ? documents.find(d => d.documentNo === milestone.invoiceDocNo)
                          : null;

                        return (
                          <div
                            key={milestone.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition gap-3 ${
                              isPaid
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : isInvoiced
                                ? 'bg-sky-50/40 border-sky-200'
                                : 'bg-white border-slate-200 shadow-2xs hover:border-indigo-300'
                            }`}
                          >
                            {/* Left: Stage Title & Details */}
                            <div className="flex items-start sm:items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
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
                                  
                                  {/* Status Pill */}
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
                                  ฿{milestone.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
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
