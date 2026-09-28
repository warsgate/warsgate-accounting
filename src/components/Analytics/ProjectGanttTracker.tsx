import React, { useState } from 'react';
import { 
  Calendar, CheckCircle2, Clock, PlayCircle, AlertCircle, 
  Layers, ArrowRight, ShieldCheck, FileText, ChevronRight, User, Plus
} from 'lucide-react';
import { AccountingDocument } from '../../types';
import { formatThaiDate } from '../../utils/formatters';

interface ProjectMilestoneTask {
  id: string;
  projectCode: string;
  projectName: string;
  customerName: string;
  phase: string;
  startDate: string;
  endDate: string;
  progressPercent: number; // 0 - 100%
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  assignedEngineer: string;
  milestoneBillingPercent: number; // Linked milestone payment %
  milestoneInvoiceCreated: boolean;
}

const INITIAL_PROJECT_TASKS: ProjectMilestoneTask[] = [
  {
    id: 'g-1',
    projectCode: 'PJ-2605-001',
    projectName: 'PNP Assembly & Inspection Station',
    customerName: 'บริษัท พีเอ็นพี คอนสตรัคชั่น จำกัด',
    phase: '1. ออกแบบ 3D CAD & สั่งซื้อ BOM พาร์ท',
    startDate: '2026-05-01',
    endDate: '2026-05-15',
    progressPercent: 100,
    status: 'COMPLETED',
    assignedEngineer: 'คุณจีระวัฒน์ (Lead Eng)',
    milestoneBillingPercent: 50,
    milestoneInvoiceCreated: true
  },
  {
    id: 'g-2',
    projectCode: 'PJ-2605-001',
    projectName: 'PNP Assembly & Inspection Station',
    customerName: 'บริษัท พีเอ็นพี คอนสตรัคชั่น จำกัด',
    phase: '2. กัดงาน CNC & ประกอบโครงสร้าง Mechanical',
    startDate: '2026-05-16',
    endDate: '2026-05-30',
    progressPercent: 100,
    status: 'COMPLETED',
    assignedEngineer: 'คุณวีรพล (Mechanical Eng)',
    milestoneBillingPercent: 0,
    milestoneInvoiceCreated: false
  },
  {
    id: 'g-3',
    projectCode: 'PJ-2605-001',
    projectName: 'PNP Assembly & Inspection Station',
    customerName: 'บริษัท พีเอ็นพี คอนสตรัคชั่น จำกัด',
    phase: '3. วายริ่งตู้คอนโทรล & เขียนโปรแกรม PLC/HMI',
    startDate: '2026-06-01',
    endDate: '2026-06-15',
    progressPercent: 100,
    status: 'COMPLETED',
    assignedEngineer: 'คุณอรรถพล (Software Eng)',
    milestoneBillingPercent: 40,
    milestoneInvoiceCreated: true
  },
  {
    id: 'g-4',
    projectCode: 'PJ-2605-001',
    projectName: 'PNP Assembly & Inspection Station',
    customerName: 'บริษัท พีเอ็นพี คอนสตรัคชั่น จำกัด',
    phase: '4. ทดสอบระบบหน้าโรงงานลูกค้า & ส่งมอบ SAT',
    startDate: '2026-06-16',
    endDate: '2026-06-25',
    progressPercent: 85,
    status: 'IN_PROGRESS',
    assignedEngineer: 'คุณจีระวัฒน์ / ทีมหน้างาน',
    milestoneBillingPercent: 10,
    milestoneInvoiceCreated: false
  },
  {
    id: 'g-5',
    projectCode: 'PJ-2505-002',
    projectName: 'TSF Precision Jig & Test Station',
    customerName: 'บริษัท ทีเอสเอฟ อินเตอร์เนชั่นแนล จำกัด',
    phase: '1. ออกแบบชิ้นงาน & ขออนุมัติแบบ Drawing',
    startDate: '2026-05-10',
    endDate: '2026-05-20',
    progressPercent: 100,
    status: 'COMPLETED',
    assignedEngineer: 'คุณจีระวัฒน์',
    milestoneBillingPercent: 50,
    milestoneInvoiceCreated: true
  },
  {
    id: 'g-6',
    projectCode: 'PJ-2505-002',
    projectName: 'TSF Precision Jig & Test Station',
    customerName: 'บริษัท ทีเอสเอฟ อินเตอร์เนชั่นแนล จำกัด',
    phase: '2. ผลิตพาร์ท Jig & ทดสอบความแม่นยำ Tolerance',
    startDate: '2026-05-21',
    endDate: '2026-06-05',
    progressPercent: 100,
    status: 'COMPLETED',
    assignedEngineer: 'คุณวีรพล',
    milestoneBillingPercent: 40,
    milestoneInvoiceCreated: true
  },
  {
    id: 'g-7',
    projectCode: 'PJ-2505-002',
    projectName: 'TSF Precision Jig & Test Station',
    customerName: 'บริษัท ทีเอสเอฟ อินเตอร์เนชั่นแนล จำกัด',
    phase: '3. ส่งมอบและทดสอบการผลิตจริง (Mass Production Trial)',
    startDate: '2026-06-06',
    endDate: '2026-06-18',
    progressPercent: 100,
    status: 'COMPLETED',
    assignedEngineer: 'คุณจีระวัฒน์',
    milestoneBillingPercent: 10,
    milestoneInvoiceCreated: true
  }
];

interface ProjectGanttTrackerProps {
  documents: AccountingDocument[];
  onOpenMilestoneBilling?: () => void;
}

export const ProjectGanttTracker: React.FC<ProjectGanttTrackerProps> = ({
  documents,
  onOpenMilestoneBilling
}) => {
  const [tasks, setTasks] = useState<ProjectMilestoneTask[]>(() => {
    const saved = localStorage.getItem('warsgate_gantt_tasks');
    return saved ? JSON.parse(saved) : INITIAL_PROJECT_TASKS;
  });

  const [filterProject, setFilterProject] = useState<string>('ALL');

  const uniqueProjects = Array.from(new Set(tasks.map(t => t.projectCode)));

  const filteredTasks = tasks.filter(t => {
    if (filterProject !== 'ALL' && t.projectCode !== filterProject) return false;
    return true;
  });

  const handleToggleTaskStatus = (taskId: string) => {
    const updated = tasks.map(task => {
      if (task.id === taskId) {
        const nextStatus: 'COMPLETED' | 'IN_PROGRESS' = task.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
        const nextProgress = nextStatus === 'COMPLETED' ? 100 : 50;
        return { ...task, status: nextStatus, progressPercent: nextProgress };
      }
      return task;
    });
    setTasks(updated);
    localStorage.setItem('warsgate_gantt_tasks', JSON.stringify(updated));
  };

  return (
    <div className="space-y-5">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Calendar className="w-4.5 h-4.5" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-900 bg-clip-text text-transparent">
              ไทม์ไลน์โครงการ & แกนต์ชาร์ต (Project Timeline & Delivery Tracker)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            <span>ควบคุมวันส่งมอบงานสร้างเครื่องจักร (Milestones) และเชื่อมโยงการวางบิลรับเงิน 50-40-10</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
            <span className="text-indigo-600 font-bold">Progressive Delivery</span>
          </p>
        </div>

        {/* Project Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">เลือกโครงการ:</label>
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          >
            <option value="ALL">🌟 แสดงทุกโครงการ (All Projects)</option>
            {uniqueProjects.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Gantt / Task Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            รายการเฟสส่งมอบงานเครื่องจักร (Engineering Delivery Phases)
          </span>
          <span className="text-xs font-mono font-bold text-slate-500">
            {filteredTasks.length} เฟสงาน
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">โครงการ & ลูกค้า</th>
                <th className="py-2.5 px-4">เฟสงาน (Phase Description)</th>
                <th className="py-2.5 px-3 text-center">วิศวกรผู้รับผิดชอบ</th>
                <th className="py-2.5 px-3 text-center">ช่วงเวลาดำเนินการ</th>
                <th className="py-2.5 px-4 text-center w-40">ความคืบหน้า (Progress)</th>
                <th className="py-2.5 px-3 text-center">งวดวางบิล</th>
                <th className="py-2.5 px-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11.5px]">
              {filteredTasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs font-bold text-indigo-700 block">
                      {task.projectCode}
                    </span>
                    <span className="text-[10.5px] text-slate-500 font-medium">
                      {task.customerName}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 block">
                      {task.phase}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {task.projectName}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      <User className="w-3 h-3 text-slate-400" />
                      {task.assignedEngineer}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center font-mono text-[10.5px] text-slate-600">
                    {formatThaiDate(task.startDate)} - {formatThaiDate(task.endDate)}
                  </td>

                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10.5px] font-mono">
                        <span className="text-slate-500">สถานะงาน:</span>
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

                  <td className="py-3 px-3 text-center">
                    {task.milestoneBillingPercent > 0 ? (
                      <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold font-mono border ${
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
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
