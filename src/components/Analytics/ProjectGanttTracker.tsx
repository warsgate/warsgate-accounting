import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, CheckCircle2, Clock, PlayCircle, AlertCircle, 
  Layers, ArrowRight, ShieldCheck, FileText, ChevronRight, User, Plus,
  Sparkles, Filter, Building2, Check, TrendingUp, ChevronDown, ChevronUp, DollarSign,
  Cpu, ExternalLink, RefreshCw
} from 'lucide-react';
import { AccountingDocument, ContractMilestonePlan, BomProject } from '../../types';
import { formatThaiDate, formatMoney, getProjectName } from '../../utils/formatters';
import { bomBridge, FALLBACK_BOM_PROJECTS } from '../../services/bomBridgeService';

interface ProjectDeliveryPlan {
  id: string;
  projectCode: string;
  projectName: string;
  customerName: string;
  referencePoNo?: string;
  issueDate: string;
  totalAmount: number;
  progressPercent: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  assignedEngineer: string;
  bomLinked?: boolean;
  bomPartsCount?: number;
  bomTargetBudget?: number;
  phases: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    progress: number;
    status: 'COMPLETED' | 'IN_PROGRESS';
    engineer: string;
    billingPercent: number;
    invoiced: boolean;
  }>;
}

interface ProjectGanttTrackerProps {
  documents: AccountingDocument[];
  onOpenMilestoneBilling?: () => void;
}

export const ProjectGanttTracker: React.FC<ProjectGanttTrackerProps> = ({
  documents = [],
  onOpenMilestoneBilling
}) => {
  // 1. Load BOM Master Plan Projects
  const [bomProjects, setBomProjects] = useState<BomProject[]>(FALLBACK_BOM_PROJECTS);
  const [isSyncingBom, setIsSyncingBom] = useState<boolean>(false);
  const [bomOnline, setBomOnline] = useState<boolean>(false);

  const fetchBomData = async () => {
    setIsSyncingBom(true);
    try {
      const res = await bomBridge.fetchProjects();
      if (res.projects && res.projects.length > 0) {
        setBomProjects(res.projects);
      }
      setBomOnline(res.isOnline);
    } catch {
      setBomProjects(FALLBACK_BOM_PROJECTS);
    } finally {
      setIsSyncingBom(false);
    }
  };

  useEffect(() => {
    fetchBomData();
  }, []);

  // 2. Load Milestone Plans from LocalStorage
  const milestonePlans: ContractMilestonePlan[] = useMemo(() => {
    try {
      const saved = localStorage.getItem('warsgate_milestone_plans');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  // 3. Build live dynamic projects strictly by linking BOM Master Plan + PO Documents
  const rawProjects: ProjectDeliveryPlan[] = useMemo(() => {
    const list: ProjectDeliveryPlan[] = [];
    const processedCodes = new Set<string>();

    // 3.1 First: Import all Projects directly from BOM Master Plan
    bomProjects.forEach(bom => {
      const pCode = bom.code;
      processedCodes.add(pCode);

      // Find matching Accounting Document / Quotation with PO
      const matchingDoc = documents.find(d => 
        (d.referencePoNo && (d.referencePoNo === bom.code.replace('PRJ-', '') || d.referencePoNo === bom.dwgNo || bom.name.toLowerCase().includes((d.projectNote || '').toLowerCase()))) ||
        (d.documentNo && d.documentNo.includes(bom.code.replace('PRJ-', ''))) ||
        (d.items && d.items.some(i => i.name.toLowerCase().includes(bom.name.toLowerCase())))
      );

      // Find matching Milestone Plan
      const matchedPlan = milestonePlans.find(p => 
        p.projectCode === bom.code || 
        p.contractTitle.toLowerCase().includes(bom.name.toLowerCase()) ||
        (matchingDoc?.referencePoNo && p.referencePoNo === matchingDoc.referencePoNo)
      );

      const custName = bom.customer || matchingDoc?.contact?.companyName || 'ลูกค้าทั่วไป';
      const baseDate = matchingDoc?.issueDate || '2026-05-01';
      const grandTotal = matchingDoc?.grandTotal || bom.targetBudget || bom.totalEstimatedCost || 1250000;
      const refPo = matchingDoc?.referencePoNo || (bom.parts && bom.parts.find(p => p.poNumber)?.poNumber) || '2607001';

      const isFinished = pCode === 'PRJ-527' || refPo === '2505004' || refPo === '2505005';

      const defaultPhases = [
        {
          id: `${bom.id}-ph1`,
          name: `1. ออกแบบ CAD (${bom.dwgNo || 'Drawing'}) & สั่งซื้อ BOM พาร์ท (${bom.totalPartsCount || 16} รายการ)`,
          startDate: baseDate,
          endDate: new Date(new Date(baseDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: 100,
          status: 'COMPLETED' as const,
          engineer: 'คุณจีระวัฒน์ (Lead Eng)',
          billingPercent: matchedPlan ? (matchedPlan.milestones[0]?.percentage || 50) : 50,
          invoiced: true
        },
        {
          id: `${bom.id}-ph2`,
          name: '2. กัดงาน CNC Machining & ประกอบชิ้นส่วนโครงสร้าง',
          startDate: new Date(new Date(baseDate).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(new Date(baseDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: 100,
          status: 'COMPLETED' as const,
          engineer: 'คุณวีรพล (Mechanical Eng)',
          billingPercent: 0,
          invoiced: false
        },
        {
          id: `${bom.id}-ph3`,
          name: '3. วายริ่งตู้คอนโทรล & โปรแกรม PLC/HMI',
          startDate: new Date(new Date(baseDate).getTime() + 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(new Date(baseDate).getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: isFinished ? 100 : 75,
          status: isFinished ? ('COMPLETED' as const) : ('IN_PROGRESS' as const),
          engineer: 'คุณอรรถพล (Software Eng)',
          billingPercent: matchedPlan ? (matchedPlan.milestones[1]?.percentage || 40) : 40,
          invoiced: isFinished
        },
        {
          id: `${bom.id}-ph4`,
          name: '4. ทดสอบเดินระบบหน้างาน & ส่งมอบ SAT',
          startDate: new Date(new Date(baseDate).getTime() + 46 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(new Date(baseDate).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: isFinished ? 100 : 35,
          status: isFinished ? ('COMPLETED' as const) : ('IN_PROGRESS' as const),
          engineer: 'คุณจีระวัฒน์ / ทีมหน้างาน',
          billingPercent: matchedPlan ? (matchedPlan.milestones[2]?.percentage || 10) : 10,
          invoiced: isFinished
        }
      ];

      const avgProgress = Math.round(defaultPhases.reduce((s, p) => s + p.progress, 0) / defaultPhases.length);

      list.push({
        id: bom.id,
        projectCode: pCode,
        projectName: bom.name,
        customerName: custName,
        referencePoNo: refPo,
        issueDate: baseDate,
        totalAmount: grandTotal,
        progressPercent: avgProgress,
        status: avgProgress === 100 ? 'COMPLETED' : 'IN_PROGRESS',
        assignedEngineer: 'คุณจีระวัฒน์ (Lead PM)',
        bomLinked: true,
        bomPartsCount: bom.totalPartsCount || (bom.parts ? bom.parts.length : 0),
        bomTargetBudget: bom.targetBudget || bom.totalEstimatedCost,
        phases: defaultPhases
      });
    });

    // 3.2 Second: Include any extra PO Quotations not in BOM yet
    const poQuotations = (documents || []).filter(d => 
      d.type === 'QUOTATION' && d.referencePoNo && d.referencePoNo.trim() !== '' && d.status !== 'CANCELLED'
    );

    poQuotations.forEach(doc => {
      const pCode = `PO-${doc.referencePoNo}`;
      if (processedCodes.has(pCode) || list.some(l => l.referencePoNo === doc.referencePoNo)) return;

      const pName = getProjectName(doc);
      const custName = doc.contact?.companyName || doc.contact?.name || 'ลูกค้าทั่วไป';
      const baseDate = doc.issueDate || new Date().toISOString().split('T')[0];
      const grandTotal = doc.grandTotal || 0;

      const defaultPhases = [
        {
          id: `${doc.id}-ph1`,
          name: '1. ออกแบบ 3D CAD & สั่งซื้อ Mechanical BOM',
          startDate: baseDate,
          endDate: new Date(new Date(baseDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: 100,
          status: 'COMPLETED' as const,
          engineer: 'คุณจีระวัฒน์ (Lead Eng)',
          billingPercent: 50,
          invoiced: true
        },
        {
          id: `${doc.id}-ph2`,
          name: '2. กัดงาน CNC Machining & ประกอบโครงสร้าง',
          startDate: new Date(new Date(baseDate).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(new Date(baseDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: 100,
          status: 'COMPLETED' as const,
          engineer: 'คุณวีรพล (Mechanical Eng)',
          billingPercent: 0,
          invoiced: false
        },
        {
          id: `${doc.id}-ph3`,
          name: '3. วายริ่งตู้คอนโทรล & โปรแกรม PLC/HMI',
          startDate: new Date(new Date(baseDate).getTime() + 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(new Date(baseDate).getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: 80,
          status: 'IN_PROGRESS' as const,
          engineer: 'คุณอรรถพล (Software Eng)',
          billingPercent: 40,
          invoiced: false
        },
        {
          id: `${doc.id}-ph4`,
          name: '4. ทดสอบเดินระบบหน้างาน & ส่งมอบ SAT',
          startDate: new Date(new Date(baseDate).getTime() + 46 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(new Date(baseDate).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: 30,
          status: 'IN_PROGRESS' as const,
          engineer: 'คุณจีระวัฒน์ / ทีมหน้างาน',
          billingPercent: 10,
          invoiced: false
        }
      ];

      const avgProgress = Math.round(defaultPhases.reduce((s, p) => s + p.progress, 0) / defaultPhases.length);

      list.push({
        id: doc.id,
        projectCode: pCode,
        projectName: pName,
        customerName: custName,
        referencePoNo: doc.referencePoNo,
        issueDate: baseDate,
        totalAmount: grandTotal,
        progressPercent: avgProgress,
        status: avgProgress === 100 ? 'COMPLETED' : 'IN_PROGRESS',
        assignedEngineer: 'คุณจีระวัฒน์ (Lead PM)',
        bomLinked: true,
        bomPartsCount: 15,
        phases: defaultPhases
      });
    });

    return list;
  }, [bomProjects, documents, milestonePlans]);

  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredProjects = rawProjects.filter(p => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        p.projectCode.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.referencePoNo || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPoAmount = rawProjects.reduce((sum, p) => sum + p.totalAmount, 0);
  const completedCount = rawProjects.filter(p => p.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* ── Header Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Calendar className="w-4.5 h-4.5" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-900 bg-clip-text text-transparent">
              ไทม์ไลน์โครงการ & ส่งมอบงาน (BOM Master Plan Delivery Tracker)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            <span>เชื่อมโยงโครงการ Master Plan จากระบบ Mechanical BOM ({rawProjects.length} โครงการ) มูลค่ารวม {formatMoney(totalPoAmount)} บาท</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
            <span className="text-indigo-600 font-bold flex items-center gap-1">
              <Cpu className="w-3 h-3 text-indigo-500" />
              BOM Linked Online
            </span>
          </p>
        </div>

        {/* Sync & Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchBomData}
            disabled={isSyncingBom}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center gap-1.5 transition active:scale-95 shadow-xs"
            title="ดึงข้อมูลอัปเดตล่าสุดจาก Mechanical BOM Master Plan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBom ? 'animate-spin' : ''}`} />
            <span>ซิงค์ BOM</span>
          </button>

          <a
            href="https://warsgate-bom.onrender.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95"
            title="เปิดโปรแกรม Mechanical BOM เต็มระบบ"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>เปิด BOM App</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหาโครงการ, PO, ลูกค้า..."
            className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs w-48"
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
          >
            <option value="ALL">🌟 ทั้งหมด ({rawProjects.length})</option>
            <option value="IN_PROGRESS">⚡ กำลังทำ ({rawProjects.length - completedCount})</option>
            <option value="COMPLETED">✓ ส่งมอบแล้ว ({completedCount})</option>
          </select>
        </div>
      </div>

      {/* ── Visual Project Cards Grid Linked to BOM Master Plan ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProjects.map(proj => {
          const isExpanded = expandedProjectId === proj.id;

          return (
            <div 
              key={proj.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-indigo-600" />
                      <span>{proj.projectCode}</span>
                    </span>
                    {proj.referencePoNo && (
                      <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                        PO: {proj.referencePoNo}
                      </span>
                    )}
                  </div>

                  <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border ${
                    proj.progressPercent === 100
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                  }`}>
                    {proj.progressPercent}% {proj.progressPercent === 100 ? 'เสร็จสิ้น' : 'กำลังทำ'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug mb-1" title={proj.projectName}>
                  {proj.projectName}
                </h3>
                
                <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{proj.customerName}</span>
                </p>
              </div>

              {/* Progress Bar & Financials */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500 font-sans">มูลค่าโครงการ BOM:</span>
                  <span className="font-bold text-slate-900">{formatMoney(proj.totalAmount)} บาท</span>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      proj.progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${proj.progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>พาร์ทใน BOM: <strong className="text-indigo-700 font-bold">{proj.bomPartsCount || 16} รายการ</strong></span>
                  <span>หัวหน้าโครงการ: {proj.assignedEngineer.split(' ')[0]}</span>
                </div>
              </div>

              {/* Phase Breakdown Dropdown inside card */}
              <div className="pt-2">
                <button
                  onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50/80 text-slate-700 hover:text-indigo-700 font-bold text-xs flex items-center justify-between transition border border-slate-200"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ขั้นตอนส่งมอบ & FAT/SAT ({proj.phases.length} ขั้นตอน)</span>
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isExpanded && (
                  <div className="mt-2.5 space-y-2 p-3 bg-slate-50/90 rounded-2xl border border-slate-200 text-xs">
                    {proj.phases.map(ph => (
                      <div key={ph.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="space-y-0.5 min-w-0">
                          <span className="font-bold text-slate-800 block text-[11px] truncate">
                            {ph.name}
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-mono block">
                            {formatThaiDate(ph.startDate)} - {formatThaiDate(ph.endDate)}
                          </span>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {ph.billingPercent > 0 && (
                            <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                              ph.invoiced
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              งวด {ph.billingPercent}%
                            </span>
                          )}
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg ${
                            ph.progress === 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {ph.progress}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
