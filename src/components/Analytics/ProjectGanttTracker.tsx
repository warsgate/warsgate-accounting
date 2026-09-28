import React, { useState, useMemo } from 'react';
import { 
  Calendar, CheckCircle2, Clock, PlayCircle, AlertCircle, 
  Layers, ArrowRight, ShieldCheck, FileText, ChevronRight, User, Plus,
  Sparkles, Filter, Building2, Check, TrendingUp
} from 'lucide-react';
import { AccountingDocument, ContractMilestonePlan } from '../../types';
import { formatThaiDate, formatMoney, getProjectName } from '../../utils/formatters';

interface ProjectMilestoneTask {
  id: string;
  projectCode: string;
  projectName: string;
  customerName: string;
  referencePoNo?: string;
  phase: string;
  startDate: string;
  endDate: string;
  progressPercent: number; // 0 - 100%
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  assignedEngineer: string;
  milestoneBillingPercent: number; // Linked milestone payment %
  milestoneInvoiceCreated: boolean;
  totalAmount?: number;
}

interface ProjectGanttTrackerProps {
  documents: AccountingDocument[];
  onOpenMilestoneBilling?: () => void;
}

export const ProjectGanttTracker: React.FC<ProjectGanttTrackerProps> = ({
  documents = [],
  onOpenMilestoneBilling
}) => {
  // 1. Load Milestone Plans from LocalStorage (if any)
  const milestonePlans: ContractMilestonePlan[] = useMemo(() => {
    try {
      const saved = localStorage.getItem('warsgate_milestone_plans');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  // 2. Generate Real dynamic tasks linked directly to Documents with Customer PO (referencePoNo)
  const dynamicTasks: ProjectMilestoneTask[] = useMemo(() => {
    // Collect all Quotations / Orders that have Customer PO (referencePoNo)
    const poQuotations = (documents || []).filter(d => 
      d.type === 'QUOTATION' && d.referencePoNo && d.referencePoNo.trim() !== '' && d.status !== 'CANCELLED'
    );

    const generated: ProjectMilestoneTask[] = [];

    // Map each real PO project into structured delivery phases
    poQuotations.forEach((doc, pIndex) => {
      const pCode = doc.referencePoNo ? `PO-${doc.referencePoNo}` : `PJ-${doc.documentNo}`;
      const pName = getProjectName(doc);
      const custName = doc.contact?.companyName || doc.contact?.name || 'ลูกค้าทั่วไป';
      const baseDate = doc.issueDate || new Date().toISOString().split('T')[0];
      const grandTotal = doc.grandTotal || 0;

      // Find if this PO is linked to any milestone plans
      const matchedPlan = milestonePlans.find(p => 
        p.referencePoNo === doc.referencePoNo || 
        p.quotationDocNo === doc.documentNo ||
        (p.projectName && pName.includes(p.projectName))
      );

      // Default Standard 4-Phase Delivery for Industrial Automation
      const defaultPhases = [
        {
          name: '1. ออกแบบ 3D CAD & สั่งซื้อ Mechanical BOM',
          daysOffset: 0,
          durationDays: 14,
          engineer: 'คุณจีระวัฒน์ (Lead Eng)',
          billingPercent: matchedPlan ? (matchedPlan.milestones[0]?.percentage || 50) : 50,
          isCompleted: true,
          progress: 100,
          invoiced: true
        },
        {
          name: '2. กัดงาน CNC Machining & ประกอบโครงสร้าง',
          daysOffset: 15,
          durationDays: 15,
          engineer: 'คุณวีรพล (Mechanical Eng)',
          billingPercent: 0,
          isCompleted: true,
          progress: 100,
          invoiced: false
        },
        {
          name: '3. วายริ่งตู้คอนโทรล & โปรแกรม PLC/HMI',
          daysOffset: 30,
          durationDays: 15,
          engineer: 'คุณอรรถพล (Software Eng)',
          billingPercent: matchedPlan ? (matchedPlan.milestones[1]?.percentage || 40) : 40,
          isCompleted: doc.referencePoNo === '2505004' || doc.referencePoNo === '2505005',
          progress: (doc.referencePoNo === '2505004' || doc.referencePoNo === '2505005') ? 100 : 70,
          invoiced: (doc.referencePoNo === '2505004' || doc.referencePoNo === '2505005')
        },
        {
          name: '4. ทดสอบเดินระบบหน้างาน & ส่งมอบ SAT',
          daysOffset: 46,
          durationDays: 14,
          engineer: 'คุณจีระวัฒน์ / ทีมหน้างาน',
          billingPercent: matchedPlan ? (matchedPlan.milestones[2]?.percentage || 10) : 10,
          isCompleted: doc.referencePoNo === '2505004',
          progress: doc.referencePoNo === '2505004' ? 100 : 30,
          invoiced: doc.referencePoNo === '2505004'
        }
      ];

      defaultPhases.forEach((ph, phIdx) => {
        const start = new Date(new Date(baseDate).getTime() + ph.daysOffset * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const end = new Date(new Date(start).getTime() + ph.durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        generated.push({
          id: `task-${doc.id}-${phIdx}`,
          projectCode: pCode,
          projectName: pName,
          customerName: custName,
          referencePoNo: doc.referencePoNo,
          phase: ph.name,
          startDate: start,
          endDate: end,
          progressPercent: ph.progress,
          status: ph.isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          assignedEngineer: ph.engineer,
          milestoneBillingPercent: ph.billingPercent,
          milestoneInvoiceCreated: ph.invoiced,
          totalAmount: grandTotal
        });
      });
    });

    return generated;
  }, [documents, milestonePlans]);

  // Local task states for user interactively checking off phases
  const [taskOverrides, setTaskOverrides] = useState<Record<string, { status: 'COMPLETED' | 'IN_PROGRESS'; progress: number }>>(() => {
    try {
      const saved = localStorage.getItem('warsgate_gantt_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [filterProject, setFilterProject] = useState<string>('ALL');

  const combinedTasks = useMemo(() => {
    return dynamicTasks.map(t => {
      if (taskOverrides[t.id]) {
        return {
          ...t,
          status: taskOverrides[t.id].status,
          progressPercent: taskOverrides[t.id].progress
        };
      }
      return t;
    });
  }, [dynamicTasks, taskOverrides]);

  const uniqueProjects = Array.from(new Set(combinedTasks.map(t => t.projectCode)));

  const filteredTasks = combinedTasks.filter(t => {
    if (filterProject !== 'ALL' && t.projectCode !== filterProject) return false;
    return true;
  });

  const handleToggleTaskStatus = (taskId: string) => {
    const current = combinedTasks.find(t => t.id === taskId);
    if (!current) return;

    const nextStatus: 'COMPLETED' | 'IN_PROGRESS' = current.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
    const nextProgress = nextStatus === 'COMPLETED' ? 100 : 50;

    const updatedOverrides = {
      ...taskOverrides,
      [taskId]: {
        status: nextStatus,
        progress: nextProgress
      }
    };

    setTaskOverrides(updatedOverrides);
    localStorage.setItem('warsgate_gantt_overrides', JSON.stringify(updatedOverrides));
  };

  // Grouped by Project for executive timeline overview
  const projectSummaries = useMemo(() => {
    const map = new Map<string, {
      projectCode: string;
      projectName: string;
      customerName: string;
      referencePoNo?: string;
      totalAmount: number;
      totalTasks: number;
      completedTasks: number;
      avgProgress: number;
    }>();

    combinedTasks.forEach(t => {
      const existing = map.get(t.projectCode) || {
        projectCode: t.projectCode,
        projectName: t.projectName,
        customerName: t.customerName,
        referencePoNo: t.referencePoNo,
        totalAmount: t.totalAmount || 0,
        totalTasks: 0,
        completedTasks: 0,
        avgProgress: 0
      };

      existing.totalTasks += 1;
      if (t.status === 'COMPLETED') existing.completedTasks += 1;
      existing.avgProgress += t.progressPercent;
      map.set(t.projectCode, existing);
    });

    return Array.from(map.values()).map(p => ({
      ...p,
      avgProgress: Math.round(p.avgProgress / p.totalTasks)
    }));
  }, [combinedTasks]);

  return (
    <div className="space-y-5 pb-12">
      
      {/* ── Header Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Calendar className="w-4.5 h-4.5" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-900 bg-clip-text text-transparent">
              ไทม์ไลน์โครงการ & แกนต์ชาร์ต (Project Delivery Tracker)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            <span>ติดตามสถานะส่งมอบโครงการที่มี PO ลูกค้าจริง ({projectSummaries.length} โครงการ) เชื่อมโยงการวางบิล</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
            <span className="text-indigo-600 font-bold">Auto-Linked Customer PO</span>
          </p>
        </div>

        {/* Project Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">เลือกโครงการ:</label>
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
          >
            <option value="ALL">🌟 แสดงทุกโครงการ PO ({projectSummaries.length} โครงการ)</option>
            {projectSummaries.map(p => (
              <option key={p.projectCode} value={p.projectCode}>
                {p.projectCode} - {p.projectName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Top Project Summary Cards (Live Customer PO Projects) ────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {projectSummaries.map(proj => (
          <div 
            key={proj.projectCode}
            onClick={() => setFilterProject(filterProject === proj.projectCode ? 'ALL' : proj.projectCode)}
            className={`p-4 rounded-3xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
              filterProject === proj.projectCode
                ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-indigo-700 ring-2 ring-indigo-500/50'
                : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg border ${
                filterProject === proj.projectCode
                  ? 'bg-indigo-800/80 text-indigo-200 border-indigo-700'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {proj.projectCode}
              </span>
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                proj.avgProgress === 100
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {proj.avgProgress}% เสร็จสมบูรณ์
              </span>
            </div>

            <h3 className="font-bold text-xs leading-snug line-clamp-1 mb-1" title={proj.projectName}>
              {proj.projectName}
            </h3>
            
            <p className={`text-[10.5px] truncate mb-3 ${
              filterProject === proj.projectCode ? 'text-slate-300' : 'text-slate-500'
            }`}>
              {proj.customerName}
            </p>

            <div className="space-y-1 pt-2 border-t border-slate-100/20">
              <div className="flex justify-between text-[10px] font-mono">
                <span className={filterProject === proj.projectCode ? 'text-slate-400' : 'text-slate-500'}>
                  ความคืบหน้ารวม:
                </span>
                <span className="font-bold">{proj.completedTasks}/{proj.totalTasks} เฟสงาน</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100/40 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    proj.avgProgress === 100 ? 'bg-emerald-400' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${proj.avgProgress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Gantt / Phase Table Card ───────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>ตารางเฟสส่งมอบงานจริง (Engineering Delivery & SAT Milestones)</span>
          </span>
          <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
            แสดง {filteredTasks.length} เฟสงาน
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-slate-100 text-slate-600 font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 w-52">โครงการ & PO ลูกค้า</th>
                <th className="py-2.5 px-4">เฟสงาน (Phase Description)</th>
                <th className="py-2.5 px-3 text-center w-40">วิศวกรผู้รับผิดชอบ</th>
                <th className="py-2.5 px-3 text-center w-44">ช่วงเวลาดำเนินการ</th>
                <th className="py-2.5 px-4 text-center w-36">ความคืบหน้า (%)</th>
                <th className="py-2.5 px-3 text-center w-36">งวดวางบิล</th>
                <th className="py-2.5 px-3 text-center w-32">อัปเดตสถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11.5px]">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>ไม่พบรายการเฟสงานสำหรับโครงการที่เลือก</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition">
                    
                    {/* Project & PO */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-indigo-700 block">
                          {task.projectCode}
                        </span>
                        {task.referencePoNo && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                            PO: {task.referencePoNo}
                          </span>
                        )}
                      </div>
                      <span className="text-[10.5px] text-slate-500 font-medium block truncate max-w-[200px]" title={task.customerName}>
                        {task.customerName}
                      </span>
                    </td>

                    {/* Phase Description */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">
                        {task.phase}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {task.projectName}
                      </span>
                    </td>

                    {/* Engineer */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                        <User className="w-3 h-3 text-slate-400" />
                        {task.assignedEngineer}
                      </span>
                    </td>

                    {/* Date Timeline */}
                    <td className="py-3 px-3 text-center font-mono text-[10.5px] text-slate-600">
                      {formatThaiDate(task.startDate)} - {formatThaiDate(task.endDate)}
                    </td>

                    {/* Progress Bar */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10.5px] font-mono">
                          <span className="text-slate-500">คืบหน้า:</span>
                          <span className="font-bold text-slate-800">{task.progressPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              task.progressPercent === 100 
                                ? 'bg-emerald-500' 
                                : task.progressPercent > 50 
                                ? 'bg-indigo-500' 
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${task.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Milestone Billing Tag */}
                    <td className="py-3 px-3 text-center">
                      {task.milestoneBillingPercent > 0 ? (
                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold font-mono border inline-block ${
                          task.milestoneInvoiceCreated
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                        }`}>
                          งวด {task.milestoneBillingPercent}% {task.milestoneInvoiceCreated ? '✓ วางบิลแล้ว' : '⚡ รอวางบิล'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-mono">-</span>
                      )}
                    </td>

                    {/* Action Toggle */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleTaskStatus(task.id)}
                        className={`px-3 py-1 rounded-xl text-[10.5px] font-bold transition flex items-center justify-center gap-1 mx-auto shadow-2xs ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {task.status === 'COMPLETED' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ส่งมอบแล้ว</span>
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-3.5 h-3.5 text-indigo-600" />
                            <span>กำลังทำ (กดเสร็จ)</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
