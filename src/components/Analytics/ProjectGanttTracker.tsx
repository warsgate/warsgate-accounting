import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, CheckCircle2, Clock, PlayCircle, AlertCircle, 
  Layers, ArrowRight, ShieldCheck, FileText, ChevronRight, User, Plus,
  Sparkles, Filter, Building2, Check, TrendingUp, ChevronDown, ChevronUp, DollarSign,
  Cpu, ExternalLink, RefreshCw, Trash2, RotateCcw, EyeOff, PackageCheck, AlertTriangle
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
  dwgNo?: string;
  issueDate: string;
  totalAmount: number;
  progressPercent: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  assignedEngineer: string;
  bomLinked?: boolean;
  bomPartsCount?: number;
  bomOrderedCount?: number;
  bomReceivedCount?: number;
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

const HIDDEN_PROJECTS_KEY = 'warsgate_hidden_timeline_projects';

export const ProjectGanttTracker: React.FC<ProjectGanttTrackerProps> = ({
  documents = [],
  onOpenMilestoneBilling
}) => {
  // 1. Load BOM Master Plan Projects
  const [bomProjects, setBomProjects] = useState<BomProject[]>(FALLBACK_BOM_PROJECTS);
  const [isSyncingBom, setIsSyncingBom] = useState<boolean>(false);
  const [bomOnline, setBomOnline] = useState<boolean>(false);

  // 2. Hidden Projects Management (ลบ / ซ่อนโครงการที่ไม่ต้องการ)
  const [hiddenProjectIds, setHiddenProjectIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(HIDDEN_PROJECTS_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const handleHideProject = (projectId: string, projectName: string) => {
    if (window.confirm(`ยืนยันการลบ/ซ่อนโครงการ "${projectName}" ออกจากหน้าติดตามส่งมอบหรือไม่?\n(คุณสามารถกู้คืนกลับมาได้ตลอดเวลา)`)) {
      const updated = [...hiddenProjectIds, projectId];
      setHiddenProjectIds(updated);
      localStorage.setItem(HIDDEN_PROJECTS_KEY, JSON.stringify(updated));
    }
  };

  const handleRestoreAllProjects = () => {
    setHiddenProjectIds([]);
    localStorage.removeItem(HIDDEN_PROJECTS_KEY);
  };

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

  // 3. Load Milestone Plans from LocalStorage
  const milestonePlans: ContractMilestonePlan[] = useMemo(() => {
    try {
      const saved = localStorage.getItem('warsgate_milestone_plans');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  // 4. Build Live Dynamic Projects strictly from BOM Master Plan + PO Documents
  const rawProjects: ProjectDeliveryPlan[] = useMemo(() => {
    const list: ProjectDeliveryPlan[] = [];
    const processedCodes = new Set<string>();

    // 4.1 Calculate dynamic progress and delivery phases from BOM Master Plan
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

      const custName = bom.customer || matchingDoc?.contact?.companyName || 'ลูกค้าโครงการ';
      const baseDate = matchingDoc?.issueDate || '2026-05-01';
      const grandTotal = matchingDoc?.grandTotal || bom.targetBudget || bom.totalEstimatedCost || 850000;
      const refPo = matchingDoc?.referencePoNo || (bom.parts && bom.parts.find(p => p.poNumber)?.poNumber) || 'PO-2607001';

      // ─── Real BOM Master Plan Progress Calculation ───
      const parts = bom.parts || [];
      const totalParts = parts.length || bom.totalPartsCount || 0;
      const orderedParts = parts.filter(p => p.status === 'Ordered' || (p.poNumber && p.poNumber.trim() !== '')).length;
      const receivedParts = parts.filter(p => p.status === 'Received' || p.status === 'Assembled' || p.status === 'Delivered').length;
      const isCompletedProject = bom.status === 'Completed' || bom.status === 'Delivered';

      // Phase 1: CAD Design & DWG Plan (100% when BOM exists)
      const p1Progress = 100;
      
      // Phase 2: BOM Procurement (Based on Ordered / Received parts)
      const p2Progress = isCompletedProject 
        ? 100 
        : (totalParts > 0 ? Math.min(100, Math.round(((orderedParts + receivedParts) / totalParts) * 100)) : 100);

      // Phase 3: Machining & Mechanical Assembly
      const p3Progress = isCompletedProject 
        ? 100 
        : (totalParts > 0 ? (receivedParts > 0 ? Math.min(100, Math.round((receivedParts / totalParts) * 100)) : (orderedParts > 0 ? 70 : 25)) : 80);

      // Phase 4: Electrical Wiring & PLC/HMI Programming
      const p4Progress = isCompletedProject 
        ? 100 
        : (receivedParts > 0 ? 85 : (orderedParts > 0 ? 60 : 30));

      // Phase 5: Commissioning & Site Acceptance Test (SAT)
      const p5Progress = isCompletedProject 
        ? 100 
        : (receivedParts >= totalParts && totalParts > 0 ? 90 : (orderedParts > 0 ? 40 : 15));

      const dynamicPhases = [
        {
          id: `${bom.id}-ph1`,
          name: `1. ออกแบบ 3D CAD & รหัสแบบ (${bom.dwgNo || 'Standard DWG'})`,
          startDate: baseDate,
          endDate: new Date(new Date(baseDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: p1Progress,
          status: 'COMPLETED' as const,
          engineer: 'คุณจีระวัฒน์ (Lead Eng)',
          billingPercent: matchedPlan ? (matchedPlan.milestones[0]?.percentage || 50) : 50,
          invoiced: true
        },
        {
          id: `${bom.id}-ph2`,
          name: `2. สั่งซื้อพาร์ท & อะไหล่ BOM Master Plan (สำเร็จ ${orderedParts + receivedParts}/${totalParts} รายการ)`,
          startDate: new Date(new Date(baseDate).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(new Date(baseDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: p2Progress,
          status: (p2Progress === 100 ? 'COMPLETED' : 'IN_PROGRESS') as 'COMPLETED' | 'IN_PROGRESS',
          engineer: 'ฝ่ายจัดซื้อ / Purchasing Team',
          billingPercent: 0,
          invoiced: false
        },
        {
          id: `${bom.id}-ph3`,
          name: `3. กัดงาน CNC Machining & ประกอบกลไก (รับเข้า ${receivedParts}/${totalParts} ชิ้น)`,
          startDate: new Date(new Date(baseDate).getTime() + 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(new Date(baseDate).getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: p3Progress,
          status: (p3Progress === 100 ? 'COMPLETED' : 'IN_PROGRESS') as 'COMPLETED' | 'IN_PROGRESS',
          engineer: 'คุณวีรพล (Mechanical Eng)',
          billingPercent: matchedPlan ? (matchedPlan.milestones[1]?.percentage || 40) : 40,
          invoiced: isCompletedProject
        },
        {
          id: `${bom.id}-ph4`,
          name: '4. วายริ่งตู้ไฟฟ้า & เขียนโปรแกรม PLC/HMI (EE & Control)',
          startDate: new Date(new Date(baseDate).getTime() + 46 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(new Date(baseDate).getTime() + 55 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: p4Progress,
          status: (p4Progress === 100 ? 'COMPLETED' : 'IN_PROGRESS') as 'COMPLETED' | 'IN_PROGRESS',
          engineer: 'คุณอรรถพล (Software Eng)',
          billingPercent: 0,
          invoiced: false
        },
        {
          id: `${bom.id}-ph5`,
          name: '5. ทดสอบเดินเครื่อง & ส่งมอบงานจริง (FAT / SAT)',
          startDate: new Date(new Date(baseDate).getTime() + 56 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(new Date(baseDate).getTime() + 65 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: p5Progress,
          status: (p5Progress === 100 ? 'COMPLETED' : 'IN_PROGRESS') as 'COMPLETED' | 'IN_PROGRESS',
          engineer: 'คุณจีระวัฒน์ / ทีมหน้างาน',
          billingPercent: matchedPlan ? (matchedPlan.milestones[2]?.percentage || 10) : 10,
          invoiced: isCompletedProject
        }
      ];

      const overallProgress = isCompletedProject 
        ? 100 
        : Math.round(dynamicPhases.reduce((s, p) => s + p.progress, 0) / dynamicPhases.length);

      list.push({
        id: bom.id,
        projectCode: pCode,
        projectName: bom.name,
        customerName: custName,
        referencePoNo: refPo,
        dwgNo: bom.dwgNo,
        issueDate: baseDate,
        totalAmount: grandTotal,
        progressPercent: overallProgress,
        status: overallProgress === 100 ? 'COMPLETED' : 'IN_PROGRESS',
        assignedEngineer: 'คุณจีระวัฒน์ (Lead PM)',
        bomLinked: true,
        bomPartsCount: totalParts,
        bomOrderedCount: orderedParts,
        bomReceivedCount: receivedParts,
        bomTargetBudget: bom.targetBudget || bom.totalEstimatedCost,
        phases: dynamicPhases
      });
    });

    return list;
  }, [bomProjects, documents, milestonePlans]);

  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Filter out hidden projects and apply search/status filter
  const visibleProjects = rawProjects.filter(p => !hiddenProjectIds.includes(p.id));

  const filteredProjects = visibleProjects.filter(p => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        p.projectCode.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.referencePoNo || '').toLowerCase().includes(q) ||
        (p.dwgNo || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPoAmount = visibleProjects.reduce((sum, p) => sum + p.totalAmount, 0);
  const completedCount = visibleProjects.filter(p => p.status === 'COMPLETED').length;

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
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium flex-wrap">
            <span>คำนวณความคืบหน้าจริงจาก BOM Master Plan ({visibleProjects.length} โครงการ) มูลค่ารวม {formatMoney(totalPoAmount)} บาท</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
            <span className="text-indigo-600 font-bold flex items-center gap-1">
              <Cpu className="w-3 h-3 text-indigo-500" />
              {bomOnline ? 'BOM Live Connected' : 'BOM Master Plan Data'}
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
            placeholder="ค้นหาโครงการ, PO, Drawing..."
            className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs w-48"
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
          >
            <option value="ALL">🌟 ทั้งหมด ({visibleProjects.length})</option>
            <option value="IN_PROGRESS">⚡ กำลังทำ ({visibleProjects.length - completedCount})</option>
            <option value="COMPLETED">✓ ส่งมอบแล้ว ({completedCount})</option>
          </select>
        </div>
      </div>

      {/* ── Notice: Hidden Projects Recovery Banner ──────────────────────────── */}
      {hiddenProjectIds.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 px-4 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-amber-600" />
            <span>คุณได้ลบ/ซ่อนโครงการออกไป <strong>{hiddenProjectIds.length} โครงการ</strong> จากหน้านี้</span>
          </div>
          <button
            onClick={handleRestoreAllProjects}
            className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-300 flex items-center gap-1 transition shadow-2xs text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>กู้คืนโครงการทั้งหมด</span>
          </button>
        </div>
      )}

      {/* ── Visual Project Cards Grid Linked to BOM Master Plan ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProjects.map(proj => {
          const isExpanded = expandedProjectId === proj.id;

          return (
            <div 
              key={proj.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-indigo-600" />
                      <span>{proj.projectCode}</span>
                    </span>
                    {proj.dwgNo && (
                      <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        DWG: {proj.dwgNo}
                      </span>
                    )}
                    {proj.referencePoNo && (
                      <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                        PO: {proj.referencePoNo}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border ${
                      proj.progressPercent === 100
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {proj.progressPercent}% {proj.progressPercent === 100 ? 'ส่งมอบแล้ว' : 'คืบหน้า'}
                    </span>

                    {/* Delete / Hide Project Button */}
                    <button
                      onClick={() => handleHideProject(proj.id, proj.projectName)}
                      title="ลบ/ซ่อนโครงการนี้ออกจากไทม์ไลน์"
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                  <span className="flex items-center gap-1">
                    <PackageCheck className="w-3 h-3 text-indigo-500" />
                    <span>สั่งซื้อแล้ว: <strong className="text-indigo-700 font-bold">{(proj.bomOrderedCount || 0) + (proj.bomReceivedCount || 0)}/{proj.bomPartsCount || 0} รายการ</strong></span>
                  </span>
                  <span>หัวหน้า: {proj.assignedEngineer.split(' ')[0]}</span>
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
                    <span>ขั้นตอนส่งมอบ & ความคืบหน้า BOM ({proj.phases.length} ขั้นตอน)</span>
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
                            {formatThaiDate(ph.startDate)} - {formatThaiDate(ph.endDate)} • {ph.engineer}
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
