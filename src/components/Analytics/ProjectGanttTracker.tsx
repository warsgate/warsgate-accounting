import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar, CheckCircle2, Clock, PlayCircle, AlertCircle, 
  Layers, ArrowRight, ShieldCheck, FileText, ChevronRight, User, Plus,
  Sparkles, Filter, Building2, Check, TrendingUp, ChevronDown, ChevronUp, DollarSign,
  Cpu, ExternalLink, RefreshCw, Trash2, RotateCcw, EyeOff, PackageCheck, AlertTriangle,
  Kanban, BarChart3, Wrench, FileCode, CheckSquare, Truck, BookOpen, Settings,
  LayoutGrid, Eye, Info, Target, ArrowLeft
} from "lucide-react";
import { AccountingDocument, ContractMilestonePlan, BomProject } from "../../types";
import { formatThaiDate, formatMoney, getProjectName } from "../../utils/formatters";
import { bomBridge, FALLBACK_BOM_PROJECTS } from "../../services/bomBridgeService";
import { initialMilestonePlans } from "../../data/initialMilestonePlans";

// ─── 9 Canonical Master Plan Stages from https://warsgate-bom.onrender.com/ ──
export interface MasterPlanStage {
  id: string;
  stepNum: number;
  wbs: string;
  title: string;
  nameTh: string;
  nameEn: string;
  color: string;
  bgBadge: string;
  icon: React.ElementType;
  defaultDurationDays: number;
  weightPercent: number;
  linkedMilestoneKey?: "DOWNPAYMENT" | "PROCESS_WORK" | "FAT_BUYOFF" | "SAT_DELIVERY";
}

export const MASTER_PLAN_STAGES: MasterPlanStage[] = [
  {
    id: "1. Design (DS,EE,PG)",
    stepNum: 1,
    wbs: "1.0",
    title: "1. Design (DS,EE,PG)",
    nameTh: "ออกแบบกลไก ไฟฟ้า และโปรแกรม",
    nameEn: "Mechanical, Electrical & PLC/Software Design",
    color: "bg-blue-600",
    bgBadge: "bg-blue-50 text-blue-700 border-blue-200",
    icon: FileCode,
    defaultDurationDays: 14,
    weightPercent: 15,
    linkedMilestoneKey: "DOWNPAYMENT"
  },
  {
    id: "2. BOM Part List",
    stepNum: 2,
    wbs: "2.0",
    title: "2. BOM Part List",
    nameTh: "ถอดแบบพาร์ท & จัดทำรายการ BOM",
    nameEn: "BOM Part List & Material Breakdown",
    color: "bg-indigo-600",
    bgBadge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Cpu,
    defaultDurationDays: 7,
    weightPercent: 10
  },
  {
    id: "3. Procurement (STD,FEB)",
    stepNum: 3,
    wbs: "3.0",
    title: "3. Procurement (STD,FEB)",
    nameTh: "สั่งซื้ออุปกรณ์มาตรฐาน & งานสั่งกลึง/FEB",
    nameEn: "Standard Parts & Machining Pipeline",
    color: "bg-amber-600",
    bgBadge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: PackageCheck,
    defaultDurationDays: 21,
    weightPercent: 15,
    linkedMilestoneKey: "PROCESS_WORK"
  },
  {
    id: "4. Assembly",
    stepNum: 4,
    wbs: "4.0",
    title: "4. Assembly",
    nameTh: "ประกอบเครื่องจักร & เดินสายไฟตู้คอนโทรล",
    nameEn: "Mechanical Assembly & Control Box Wiring",
    color: "bg-sky-600",
    bgBadge: "bg-sky-50 text-sky-700 border-sky-200",
    icon: Wrench,
    defaultDurationDays: 21,
    weightPercent: 15
  },
  {
    id: "5. Testing",
    stepNum: 5,
    wbs: "5.0",
    title: "5. Testing",
    nameTh: "ปรับตั้งระบบ & ทดสอบการทำงานภายใน",
    nameEn: "Internal Commissioning, Dry Run & Debugging",
    color: "bg-purple-600",
    bgBadge: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Settings,
    defaultDurationDays: 10,
    weightPercent: 10
  },
  {
    id: "6. BuyOff",
    stepNum: 6,
    wbs: "6.0",
    title: "6. BuyOff",
    nameTh: "ตรวจรับเครื่องจักรในโรงงาน (FAT BuyOff)",
    nameEn: "Factory Acceptance Test (FAT) & Customer BuyOff",
    color: "bg-emerald-600",
    bgBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckSquare,
    defaultDurationDays: 7,
    weightPercent: 15,
    linkedMilestoneKey: "FAT_BUYOFF"
  },
  {
    id: "7. Packing",
    stepNum: 7,
    wbs: "7.0",
    title: "7. Packing",
    nameTh: "บรรจุหีบห่อ & เตรียมการขนส่ง",
    nameEn: "Packaging & Logistics Preparation",
    color: "bg-teal-600",
    bgBadge: "bg-teal-50 text-teal-700 border-teal-200",
    icon: Truck,
    defaultDurationDays: 3,
    weightPercent: 5
  },
  {
    id: "8. Install & Service",
    stepNum: 8,
    wbs: "8.0",
    title: "8. Install & Service",
    nameTh: "ติดตั้งหน้างานลูกค้า & ตรวจรับ SAT + ประกัน 1 ปี",
    nameEn: "Site Installation, SAT & 1-Year Warranty Service",
    color: "bg-rose-600",
    bgBadge: "bg-rose-50 text-rose-700 border-rose-200",
    icon: ShieldCheck,
    defaultDurationDays: 14,
    weightPercent: 10,
    linkedMilestoneKey: "SAT_DELIVERY"
  },
  {
    id: "9. Others",
    stepNum: 9,
    wbs: "9.0",
    title: "9. Others",
    nameTh: "เอกสาร คู่มือการใช้งาน & ฝึกอบรม",
    nameEn: "Documentation, User Manual & Training",
    color: "bg-slate-600",
    bgBadge: "bg-slate-100 text-slate-700 border-slate-200",
    icon: BookOpen,
    defaultDurationDays: 7,
    weightPercent: 5
  }
];

export interface ProjectMasterTask {
  id: string;
  wbs: string;
  stageName: string;
  title: string;
  responsible: string;
  planStartDate: string;
  planEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progressPct: number;
  status: "Pending" | "In_Progress" | "Completed";
  billingPercent?: number;
  billingAmount?: number;
  milestoneStatus?: "PAID" | "INVOICED" | "WAITING";
  invoiceDocNo?: string;
  notes?: string;
}

export interface ProjectDeliveryPlan {
  id: string;
  projectCode: string;
  projectName: string;
  customerName: string;
  referencePoNo?: string;
  dwgNo?: string;
  issueDate: string;
  targetEndDate: string;
  totalAmount: number;
  progressPercent: number;
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING";
  assignedEngineer: string;
  bomLinked?: boolean;
  bomPartsCount?: number;
  bomOrderedCount?: number;
  bomReceivedCount?: number;
  bomTargetBudget?: number;
  masterTasks: ProjectMasterTask[];
}

interface ProjectGanttTrackerProps {
  documents: AccountingDocument[];
  onOpenMilestoneBilling?: () => void;
}

const HIDDEN_PROJECTS_KEY = "warsgate_hidden_timeline_projects";

// ─── Canonical Master Confirmed PO Data ──────────────────────────────────────
const CONFIRMED_PO_DATA: Record<string, { total: number; subtotal: number; poNo: string; dwgNo: string; name: string }> = {
  "PRJ-527": { total: 2610620.24, subtotal: 2439832.00, poNo: "2607001", dwgNo: "ADC-2608-001", name: "Tracking ability Line ADC (บอร์ด PLC & Data Center)" },
  "PRJ-107": { total: 3793792.00, subtotal: 3545600.00, poNo: "PO252155", dwgNo: "TSF1-LM1-2026", name: "TSF1 Auto pack LM1 (Stacker, Open Bag & Insert Foam)" },
  "PRJ-2505-004": { total: 4646999.71, subtotal: 4342990.38, poNo: "2505004", dwgNo: "TRACE-5LINE-2025", name: "Traceability Solenoid Line IMV (Fujipart Thailand)" },
  "PRJ-PNP-SOL": { total: 4646999.71, subtotal: 4342990.38, poNo: "2505004", dwgNo: "TRACE-5LINE-2025", name: "Traceability Solenoid Line IMV (Fujipart Thailand)" },
  "PRJ-2605-001": { total: 2580305.00, subtotal: 2411500.00, poNo: "2605001", dwgNo: "FJP-Z16-2026", name: "Zone 1-6 Automation & Structure Parts (Fujipart)" },
  "PRJ-PNP-Z1-6": { total: 2580305.00, subtotal: 2411500.00, poNo: "2605001", dwgNo: "FJP-Z16-2026", name: "Zone 1-6 Automation & Structure Parts (Fujipart)" },
  "PRJ-2605-002": { total: 1260246.00, subtotal: 1177800.00, poNo: "2605002", dwgNo: "FJP-Z7-2026", name: "Zone 7 Automation & Structure Parts (Fujipart)" },
  "PRJ-PNP-Z7": { total: 1260246.00, subtotal: 1177800.00, poNo: "2605002", dwgNo: "FJP-Z7-2026", name: "Zone 7 Automation & Structure Parts (Fujipart)" },
  "PRJ-2505-005": { total: 2325558.33, subtotal: 2173419.00, poNo: "2505005", dwgNo: "SOL-SW-2025", name: "Traceability Solenoid Line Software (Fujipart)" },
  "PRJ-2609-003": { total: 158841.50, subtotal: 148450.00, poNo: "2609002", dwgNo: "NET-2609-01", name: "Network Infrastructure & Hardware Installation" },
  "PRJ-PNP-NET26": { total: 158841.50, subtotal: 148450.00, poNo: "2609002", dwgNo: "NET-2609-01", name: "Network Infrastructure & Hardware Installation" },
};

export const ProjectGanttTracker: React.FC<ProjectGanttTrackerProps> = ({
  documents = [],
  onOpenMilestoneBilling
}) => {
  const [bomProjects, setBomProjects] = useState<BomProject[]>(FALLBACK_BOM_PROJECTS);
  const [isSyncingBom, setIsSyncingBom] = useState<boolean>(false);
  const [bomOnline, setBomOnline] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"SINGLE" | "MATRIX" | "PIPELINE" | "CARDS" | "ALL_TABLES">("SINGLE");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [showStageDefinitions, setShowStageDefinitions] = useState<boolean>(false);
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("ALL");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("ALL");
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>("PRJ-527");

  const [hiddenProjectIds, setHiddenProjectIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(HIDDEN_PROJECTS_KEY) || "[]");
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

  // 3. Load Milestone Plans
  const [milestonePlans] = useState<ContractMilestonePlan[]>(() => {
    try {
      const saved = localStorage.getItem("warsgate_milestone_plans");
      if (saved) {
        const parsed: ContractMilestonePlan[] = JSON.parse(saved);
        const map = new Map<string, ContractMilestonePlan>();
        initialMilestonePlans.forEach(p => map.set(p.id, p));
        parsed.forEach(p => {
          if (p.id !== "plan-kuroda-vision" && !map.has(p.id)) map.set(p.id, p);
        });
        return Array.from(map.values());
      }
    } catch {}
    return initialMilestonePlans;
  });

  // 4. Generate Standard 9-Stage Master Plan for Each Project
  const projects: ProjectDeliveryPlan[] = useMemo(() => {
    const list: ProjectDeliveryPlan[] = [];

    bomProjects.forEach(bom => {
      const pCode = bom.code;
      const partPo = (bom.parts && bom.parts.find(p => p.poNumber)?.poNumber) || "";
      const cleanPartPo = partPo.replace(/^PO-?/i, "");

      const confirmedInfo = CONFIRMED_PO_DATA[pCode] || Object.values(CONFIRMED_PO_DATA).find(c => c.poNo === cleanPartPo || (bom.dwgNo && c.dwgNo === bom.dwgNo));

      // Match Quotation / Invoice
      const matchingDoc = documents.find(d => 
        (d.referencePoNo && confirmedInfo?.poNo && d.referencePoNo === confirmedInfo.poNo) ||
        (d.referencePoNo && d.referencePoNo === cleanPartPo) ||
        (d.documentNo && d.documentNo.includes(pCode.replace("PRJ-", "")))
      );

      // Match Milestone Plan
      const matchedPlan = milestonePlans.find(p => 
        p.projectCode === bom.code ||
        (confirmedInfo?.poNo && p.referencePoNo === confirmedInfo.poNo) ||
        (cleanPartPo && p.referencePoNo?.replace(/^PO-?/i, "") === cleanPartPo)
      );

      const custName = bom.customer || matchingDoc?.contact?.companyName || "บริษัท พีเอ็นพี เทคโนโลยี เกรท จำกัด";
      const baseDate = matchingDoc?.issueDate || bom.createdAt?.split("T")[0] || "2026-05-01";
      
      const grandTotal = confirmedInfo?.total ?? 
        matchedPlan?.totalContractAmount ?? 
        matchingDoc?.grandTotal ?? 
        bom.targetBudget ?? 
        850000;
        
      const refPo = confirmedInfo?.poNo || matchedPlan?.referencePoNo || cleanPartPo || "2607001";
      const displayDwg = confirmedInfo?.dwgNo || bom.dwgNo || "DWG-AUTO-2026";

      // BOM parts procurement progress
      const parts = bom.parts || [];
      const totalParts = parts.length || bom.totalPartsCount || 0;
      const receivedParts = parts.filter(p => p.status === "Received" || p.status === "Assembled" || p.status === "Delivered").length;
      const orderedParts = parts.filter(p => (p.status === "Ordered" || p.poNumber) && p.status !== "Received").length;
      const isCompleted = bom.status === "Completed" || bom.status === "Delivered" || (matchedPlan && matchedPlan.milestones.every(m => m.status === "PAID"));

      // ── Build 9 Master Plan Tasks ──
      let currentDate = new Date(baseDate);
      const masterTasks: ProjectMasterTask[] = MASTER_PLAN_STAGES.map((stage, sIdx) => {
        const stageStart = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + stage.defaultDurationDays);
        const stageEnd = new Date(currentDate);

        let progress = 0;
        let taskStatus: "Pending" | "In_Progress" | "Completed" = "Pending";

        if (isCompleted) {
          progress = 100;
          taskStatus = "Completed";
        } else {
          switch (stage.stepNum) {
            case 1: // 1. Design
              progress = 100;
              taskStatus = "Completed";
              break;
            case 2: // 2. BOM Part List
              progress = 100;
              taskStatus = "Completed";
              break;
            case 3: // 3. Procurement
              progress = totalParts > 0 ? Math.min(100, Math.round(((receivedParts + orderedParts) / totalParts) * 100)) : 80;
              taskStatus = progress === 100 ? "Completed" : "In_Progress";
              break;
            case 4: // 4. Assembly
              progress = totalParts > 0 ? Math.min(100, Math.round((receivedParts / totalParts) * 100)) : 60;
              taskStatus = progress === 100 ? "Completed" : progress > 0 ? "In_Progress" : "Pending";
              break;
            case 5: // 5. Testing
              progress = receivedParts >= totalParts && totalParts > 0 ? 80 : 30;
              taskStatus = progress >= 80 ? "In_Progress" : "Pending";
              break;
            case 6: // 6. BuyOff (FAT)
              // Linked to Invoiced milestone 50%
              if (matchedPlan && (matchedPlan.milestones[1]?.status === "INVOICED" || matchedPlan.milestones[1]?.status === "PAID")) {
                progress = matchedPlan.milestones[1].status === "PAID" ? 100 : 75;
                taskStatus = progress === 100 ? "Completed" : "In_Progress";
              } else {
                progress = 20;
                taskStatus = "Pending";
              }
              break;
            case 7: // 7. Packing
              progress = 0;
              taskStatus = "Pending";
              break;
            case 8: // 8. Install & Service (SAT)
              // Linked to Final milestone 20%
              if (matchedPlan && matchedPlan.milestones[2]?.status === "PAID") {
                progress = 100;
                taskStatus = "Completed";
              } else {
                progress = 0;
                taskStatus = "Pending";
              }
              break;
            case 9: // 9. Others
              progress = 0;
              taskStatus = "Pending";
              break;
            default:
              progress = 0;
              taskStatus = "Pending";
          }
        }

        // Link milestone billing info if applicable
        let billingPercent: number | undefined;
        let billingAmount: number | undefined;
        let milestoneStatus: "PAID" | "INVOICED" | "WAITING" | undefined;
        let invoiceDocNo: string | undefined;
        let notes: string | undefined;

        if (matchedPlan && matchedPlan.milestones) {
          if (stage.stepNum === 1 && matchedPlan.milestones[0]) {
            billingPercent = matchedPlan.milestones[0].percentage;
            billingAmount = matchedPlan.milestones[0].amount;
            milestoneStatus = matchedPlan.milestones[0].status;
            invoiceDocNo = matchedPlan.milestones[0].invoiceDocNo;
            notes = matchedPlan.milestones[0].notes;
          } else if (stage.stepNum === 6 && matchedPlan.milestones[1]) {
            billingPercent = matchedPlan.milestones[1].percentage;
            billingAmount = matchedPlan.milestones[1].amount;
            milestoneStatus = matchedPlan.milestones[1].status;
            invoiceDocNo = matchedPlan.milestones[1].invoiceDocNo;
            notes = matchedPlan.milestones[1].notes;
          } else if (stage.stepNum === 8 && matchedPlan.milestones[2]) {
            billingPercent = matchedPlan.milestones[2].percentage;
            billingAmount = matchedPlan.milestones[2].amount;
            milestoneStatus = matchedPlan.milestones[2].status;
            invoiceDocNo = matchedPlan.milestones[2].invoiceDocNo;
            notes = matchedPlan.milestones[2].notes;
          }
        }

        return {
          id: `${bom.id}-task-${stage.stepNum}`,
          wbs: stage.wbs,
          stageName: stage.title,
          title: stage.nameTh,
          responsible: stage.stepNum <= 2 ? "คุณจีระวัฒน์ (Lead Eng)" : stage.stepNum <= 5 ? "วิศวกรประกอบ & ไฟฟ้า" : "คุณจีระวัฒน์ & ลูกค้า",
          planStartDate: stageStart.toISOString().split("T")[0],
          planEndDate: stageEnd.toISOString().split("T")[0],
          actualStartDate: progress > 0 ? stageStart.toISOString().split("T")[0] : undefined,
          actualEndDate: progress === 100 ? stageEnd.toISOString().split("T")[0] : undefined,
          progressPct: progress,
          status: taskStatus,
          billingPercent,
          billingAmount,
          milestoneStatus,
          invoiceDocNo,
          notes
        };
      });

      // Calculate total progress
      const totalProgress = Math.round(masterTasks.reduce((sum, t, idx) => {
        const weight = MASTER_PLAN_STAGES[idx]?.weightPercent || 10;
        return sum + (t.progressPct * (weight / 100));
      }, 0));

      const targetEndDate = masterTasks[masterTasks.length - 1].planEndDate;

      list.push({
        id: bom.id,
        projectCode: pCode,
        projectName: confirmedInfo?.name || bom.name,
        customerName: custName,
        referencePoNo: refPo,
        dwgNo: displayDwg,
        issueDate: baseDate,
        targetEndDate,
        totalAmount: grandTotal,
        progressPercent: isCompleted ? 100 : Math.min(99, totalProgress),
        status: isCompleted ? "COMPLETED" : "IN_PROGRESS",
        assignedEngineer: "คุณจีระวัฒน์ พูลศิริ (Lead Automation Engineer)",
        bomLinked: true,
        bomPartsCount: totalParts,
        bomOrderedCount: orderedParts,
        bomReceivedCount: receivedParts,
        bomTargetBudget: bom.targetBudget,
        masterTasks
      });
    });

    return list.filter(p => !hiddenProjectIds.includes(p.id) && !hiddenProjectIds.includes(p.projectCode));
  }, [bomProjects, documents, milestonePlans, hiddenProjectIds]);

  // Filtered projects
  const filteredProjects = projects.filter(p => {
    if (selectedCustomerId !== "ALL" && !p.customerName.includes(selectedCustomerId)) return false;
    if (selectedStageFilter !== "ALL") {
      const task = p.masterTasks.find(t => t.stageName === selectedStageFilter);
      if (!task || task.status === "Pending") return false;
    }
    return true;
  });

  const totalProjectsCount = projects.length;
  const completedCount = projects.filter(p => p.status === "COMPLETED").length;
  const inProgressCount = projects.filter(p => p.status === "IN_PROGRESS").length;
  const totalContractSum = projects.reduce((s, p) => s + p.totalAmount, 0);

  // Active project for SINGLE view
  const currentSelectedProject = filteredProjects.find(p => p.id === selectedProjectId) || filteredProjects[0];

  return (
    <div className="space-y-4 pb-12">
      
      {/* ── Compact Page Header ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white shadow-xl border border-indigo-900/40">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10.5px] font-bold border border-indigo-500/30">
                <Sparkles className="w-3 h-3" />
                BOM MASTER PLAN (9 STAGES)
              </span>
              <span className="text-[10.5px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                {totalProjectsCount} โครงการ
              </span>
              <span className="text-[10.5px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                🏁 ส่งมอบแล้ว {completedCount}
              </span>
              <span className="text-[10.5px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                ⚡ ดำเนินการ {inProgressCount}
              </span>
              <span className="text-[10.5px] font-mono text-sky-200 bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-500/30">
                💰 สัญญารวม ฿{formatMoney(totalContractSum)}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
              ไทม์ไลน์โครงการ & ส่งมอบงานตาม Master Plan
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              แผนงานก่อสร้างและประกอบเครื่องจักรอัตโนมัติ 9 ขั้นตอน (WBS 1.0 - 9.0) จาก WARSGATE BOM Pro เชื่อมโยงงวดงานและใบแจ้งหนี้
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowStageDefinitions(!showStageDefinitions)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Info className="w-3.5 h-3.5 text-indigo-300" />
              <span>{showStageDefinitions ? "ซ่อนนิยาม 9 ขั้นตอน" : "ดูนิยาม 9 ขั้นตอน"}</span>
              {showStageDefinitions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <a
              href="https://warsgate-bom.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition active:scale-95"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>WARSGATE BOM Pro</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            {onOpenMilestoneBilling && (
              <button
                onClick={onOpenMilestoneBilling}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-white/20 flex items-center gap-1.5 transition active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span>วางบิลงวดงาน</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible 9 Stages Mini Visual Flow */}
        {showStageDefinitions && (
          <div className="mt-3.5 pt-3.5 border-t border-indigo-800/40">
            <div className="text-[11px] text-indigo-200 font-bold mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>มาตรฐาน 9 ขั้นตอนวิศวกรรมสร้างเครื่องจักร (WARSGATE Master Plan Process):</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5 text-[10px] font-bold">
              {MASTER_PLAN_STAGES.map(st => (
                <div 
                  key={st.id}
                  className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/15 transition cursor-pointer"
                  onClick={() => setSelectedStageFilter(selectedStageFilter === st.id ? "ALL" : st.id)}
                >
                  <span className="block text-indigo-300 font-mono text-[9px]">{st.wbs}</span>
                  <span className="block truncate text-white mt-0.5" title={st.title}>{st.title.split(" ")[1] || st.title}</span>
                  {st.linkedMilestoneKey && (
                    <span className="inline-block mt-0.5 px-1 py-0.2 rounded bg-indigo-500/40 text-[8px] text-indigo-200">
                      วางบิล
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Toolbar: Views & Filters ─────────────────────────────────────────── */}
      <div className="glass-panel p-2.5 sm:p-3 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 shadow-sm border border-slate-200 bg-white">
        
        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs overflow-x-auto">
          <button
            onClick={() => setViewMode("SINGLE")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              viewMode === "SINGLE" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>🎯 รายโครงการ (Single Focus)</span>
          </button>

          <button
            onClick={() => setViewMode("MATRIX")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              viewMode === "MATRIX" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>📊 ภาพรวม 9 ขั้นตอน (Master Matrix)</span>
          </button>

          <button
            onClick={() => setViewMode("PIPELINE")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              viewMode === "PIPELINE" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>📋 Pipeline</span>
          </button>

          <button
            onClick={() => setViewMode("CARDS")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              viewMode === "CARDS" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>📑 การ์ด</span>
          </button>

          <button
            onClick={() => setViewMode("ALL_TABLES")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              viewMode === "ALL_TABLES" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>📜 ตารางทั้งหมด</span>
          </button>
        </div>

        {/* Customer Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="ALL">ลูกค้าทั้งหมด ({projects.length} โครงการ)</option>
            <option value="พีเอ็นพี">บริษัท พีเอ็นพี เทคโนโลยี เกรท จำกัด</option>
            <option value="เซกิซุย">บริษัท ไทย เซกิซุย โฟม จำกัด</option>
          </select>

          {hiddenProjectIds.length > 0 && (
            <button
              onClick={handleRestoreAllProjects}
              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>กู้คืน ({hiddenProjectIds.length})</span>
            </button>
          )}
        </div>

      </div>

      {/* ── VIEW 1: SINGLE PROJECT FOCUS (ZERO-SCROLL VIEW) ────────────────────── */}
      {viewMode === "SINGLE" && (
        <div className="space-y-3">
          
          {/* Project Tabs Strip */}
          <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1.5 px-2">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Target className="w-3 h-3 text-indigo-600" />
                คลิกเลือกโครงการเพื่อดูแผนงาน (ดูจบในหน้าเดียว ไม่ต้องเลื่อน):
              </span>
              <span className="text-[10.5px] font-mono text-slate-400">
                {filteredProjects.length} โครงการ
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {filteredProjects.map(proj => {
                const isSelected = (currentSelectedProject?.id === proj.id);
                return (
                  <button
                    key={proj.id}
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={`px-3 py-2 rounded-xl text-left transition shrink-0 flex items-center gap-2 border ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300/40"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span className={`font-mono font-extrabold text-[11px] px-1.5 py-0.5 rounded ${
                      isSelected ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                    }`}>
                      {proj.projectCode}
                    </span>
                    <div className="min-w-0 max-w-[150px] sm:max-w-[200px]">
                      <span className="block text-xs font-bold truncate">
                        {proj.projectName}
                      </span>
                      <span className={`block text-[9.5px] truncate font-mono ${
                        isSelected ? "text-indigo-100" : "text-slate-400"
                      }`}>
                        PO: {proj.referencePoNo}
                      </span>
                    </div>
                    <span className={`font-mono font-extrabold text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected 
                        ? (proj.progressPercent === 100 ? "bg-emerald-400 text-slate-900" : "bg-white/20 text-white")
                        : (proj.progressPercent === 100 ? "bg-emerald-100 text-emerald-800" : "bg-indigo-50 text-indigo-700")
                    }`}>
                      {proj.progressPercent}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Project Full Detail Card */}
          {currentSelectedProject ? (
            <div className="glass-panel rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              
              {/* Project Card Header */}
              <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {currentSelectedProject.projectCode}
                    </span>
                    <span className="text-xs text-slate-600 font-mono">
                      PO: <strong className="text-slate-900">{currentSelectedProject.referencePoNo}</strong>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      DWG: {currentSelectedProject.dwgNo}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      currentSelectedProject.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                    }`}>
                      {currentSelectedProject.status === "COMPLETED" ? "ส่งมอบเสร็จสิ้น 100%" : "กำลังดำเนินการ"}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 mt-1">
                    {currentSelectedProject.projectName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentSelectedProject.customerName} • วิศวกร: {currentSelectedProject.assignedEngineer}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">มูลค่าสัญญา PO</span>
                    <span className="font-mono font-black text-sm text-slate-900">
                      ฿{formatMoney(currentSelectedProject.totalAmount)}
                    </span>
                  </div>
                  <div className="pl-3 border-l border-slate-200">
                    <span className="text-[10px] text-indigo-600 block font-bold">ความคืบหน้ารวม</span>
                    <span className="font-mono font-black text-lg text-indigo-700">
                      {currentSelectedProject.progressPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Horizontal 9-Step Visual Stepper */}
              <div className="p-3 bg-slate-50/40 border-b border-slate-100">
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5">
                  {currentSelectedProject.masterTasks.map((t, idx) => {
                    const stage = MASTER_PLAN_STAGES[idx] || MASTER_PLAN_STAGES[0];
                    const Icon = stage.icon;
                    const isDone = t.progressPct === 100;
                    const isInProgress = t.progressPct > 0 && t.progressPct < 100;
                    
                    return (
                      <div 
                        key={t.id} 
                        className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-between ${
                          isDone 
                            ? "bg-emerald-50/90 border-emerald-200/80 text-emerald-900" 
                            : isInProgress 
                            ? "bg-indigo-50 border-indigo-300 text-indigo-900 ring-2 ring-indigo-400/20 shadow-xs" 
                            : "bg-white border-slate-200 text-slate-500"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full text-[9px] font-mono font-bold mb-1">
                          <span>{stage.wbs}</span>
                          <span className={isDone ? "text-emerald-700" : isInProgress ? "text-indigo-700" : "text-slate-400"}>
                            {t.progressPct}%
                          </span>
                        </div>
                        <div className={`p-1 rounded-lg my-0.5 ${
                          isDone 
                            ? "bg-emerald-100 text-emerald-700" 
                            : isInProgress 
                            ? "bg-indigo-100 text-indigo-700" 
                            : "bg-slate-100 text-slate-400"
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-bold block truncate w-full mt-0.5" title={stage.title}>
                          {stage.title.split(" ")[1] || stage.title}
                        </span>
                        {t.milestoneStatus && (
                          <span className={`inline-block mt-1 px-1 py-0.2 rounded text-[8px] font-bold ${
                            t.milestoneStatus === "PAID" 
                              ? "bg-emerald-100 text-emerald-800" 
                              : t.milestoneStatus === "INVOICED" 
                              ? "bg-amber-100 text-amber-800" 
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {t.billingPercent}% บิล
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 9 Stages Gantt Table (Compact Format) */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[760px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center">WBS</th>
                      <th className="py-2 px-3">STAGE / TASK NAME (9 ขั้นตอนมาตรฐาน)</th>
                      <th className="py-2 px-3">ผู้รับผิดชอบ (RESPONSIBLE)</th>
                      <th className="py-2 px-3 text-center">กำหนดการ (PLAN DATES)</th>
                      <th className="py-2 px-3 text-center w-28">PROGRESS</th>
                      <th className="py-2 px-3 text-center w-36">สถานะงวดวางบิล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentSelectedProject.masterTasks.map((task, tIdx) => {
                      const stageDef = MASTER_PLAN_STAGES[tIdx] || MASTER_PLAN_STAGES[0];
                      const Icon = stageDef.icon;

                      let milestoneBadge = (
                        <span className="text-slate-400 font-mono text-[11px]">-</span>
                      );

                      if (task.milestoneStatus) {
                        if (task.milestoneStatus === "PAID") {
                          milestoneBadge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> ชำระแล้ว ({task.billingPercent}%)
                            </span>
                          );
                        } else if (task.milestoneStatus === "INVOICED") {
                          milestoneBadge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-2.5 h-2.5 text-amber-600" /> เปิดบิลแล้ว ({task.billingPercent}%)
                            </span>
                          );
                        } else {
                          milestoneBadge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="w-2.5 h-2.5" /> รอส่งมอบ ({task.billingPercent}%)
                            </span>
                          );
                        }
                      }

                      return (
                        <tr key={task.id} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">
                            {task.wbs}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${stageDef.bgBadge}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block text-xs">{task.stageName}</span>
                                <span className="text-[10px] text-slate-500 block">{task.title}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">
                            {task.responsible}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-500">
                            {formatThaiDate(task.planStartDate)} ➔ {formatThaiDate(task.planEndDate)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div 
                                  className={`h-full transition-all ${
                                    task.progressPct === 100 ? "bg-emerald-500" : "bg-indigo-600"
                                  }`}
                                  style={{ width: `${task.progressPct}%` }}
                                />
                              </div>
                              <span className="font-mono font-bold text-[10.5px] w-8 text-right text-slate-700">
                                {task.progressPct}%
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {milestoneBadge}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              ไม่พบโครงการตามตัวกรองที่เลือก
            </div>
          )}

        </div>
      )}

      {/* ── VIEW 2: MASTER MATRIX TABLE (ALL PROJECTS AT A GLANCE) ─────────────── */}
      {viewMode === "MATRIX" && (
        <div className="glass-panel rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                ตารางสรุปสถานะ 9 ขั้นตอนวิศวกรรมครบทุกโครงการ (WBS 1.0 - 9.0)
              </h3>
              <p className="text-[11px] text-slate-500">
                ดูความคืบหน้าของทุกโครงการในหน้าเดียว คลิกที่แถวโครงการเพื่อดูรายละเอียดเจาะลึก
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> 100% เสร็จ
              </span>
              <span className="inline-flex items-center gap-1 text-indigo-700">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> กำลังดำเนินการ
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> รอเริ่ม
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-40">รหัส / โครงการ</th>
                  <th className="py-2.5 px-3 w-44">ลูกค้า & PO</th>
                  <th className="py-2.5 px-3 text-right w-28">มูลค่าสัญญา PO</th>
                  <th className="py-2.5 px-3 text-center">ผังความคืบหน้า 9 ขั้นตอน (WBS 1.0 - 9.0)</th>
                  <th className="py-2.5 px-3 text-center w-28">PROGRESS</th>
                  <th className="py-2.5 px-3 text-center w-24">วันส่งมอบ</th>
                  <th className="py-2.5 px-3 text-center w-24">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map(proj => (
                  <tr 
                    key={proj.id} 
                    className="hover:bg-indigo-50/50 transition cursor-pointer group"
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setViewMode("SINGLE");
                    }}
                  >
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 block w-fit mb-0.5">
                        {proj.projectCode}
                      </span>
                      <span className="font-bold text-slate-900 block truncate max-w-[160px]" title={proj.projectName}>
                        {proj.projectName}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="text-slate-800 font-medium block truncate max-w-[170px]" title={proj.customerName}>
                        {proj.customerName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 block">
                        PO: <strong className="text-slate-700">{proj.referencePoNo}</strong>
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      ฿{formatMoney(proj.totalAmount)}
                    </td>

                    {/* 9 Process Stages Mini Stepper */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {proj.masterTasks.map((t, idx) => {
                          const isDone = t.progressPct === 100;
                          const isInProgress = t.progressPct > 0 && t.progressPct < 100;
                          const stage = MASTER_PLAN_STAGES[idx];

                          return (
                            <div 
                              key={t.id}
                              className={`w-7 h-7 rounded-lg border text-[9px] font-mono font-bold flex flex-col items-center justify-center transition ${
                                isDone 
                                  ? "bg-emerald-500 text-white border-emerald-600 shadow-2xs" 
                                  : isInProgress 
                                  ? "bg-indigo-600 text-white border-indigo-700 shadow-2xs ring-2 ring-indigo-300/40" 
                                  : "bg-slate-100 text-slate-400 border-slate-200"
                              }`}
                              title={`${stage.wbs} ${stage.title}: ${t.progressPct}% (${t.title})`}
                            >
                              <span>{stage.wbs.split(".")[0]}</span>
                              <span className="text-[7.5px] leading-none opacity-90">
                                {isDone ? "✓" : isInProgress ? `${t.progressPct}%` : "-"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full transition-all ${
                              proj.progressPercent === 100 ? "bg-emerald-500" : "bg-indigo-600"
                            }`}
                            style={{ width: `${proj.progressPercent}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-[10.5px] w-8 text-right text-slate-700">
                          {proj.progressPercent}%
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono text-[10px] text-slate-500">
                      {formatThaiDate(proj.targetEndDate)}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProjectId(proj.id);
                          setViewMode("SINGLE");
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 text-[10.5px] font-bold transition flex items-center justify-center gap-1 mx-auto"
                      >
                        <Eye className="w-3 h-3" />
                        <span>ดูผัง</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VIEW 3: PIPELINE 9 STAGES ────────────────────────────────────────── */}
      {viewMode === "PIPELINE" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-[1400px]">
            {MASTER_PLAN_STAGES.map(stage => {
              const Icon = stage.icon;
              const matchingTasks = filteredProjects.flatMap(p => 
                p.masterTasks
                  .filter(t => t.stageName === stage.title)
                  .map(t => ({ project: p, task: t }))
              );

              return (
                <div key={stage.id} className="flex-1 min-w-[220px] max-w-[260px] bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${stage.bgBadge}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-[10px] text-slate-400 block">{stage.wbs}</span>
                        <span className="font-bold text-xs text-slate-800 block truncate">{stage.title.split(" ")[1] || stage.title}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {matchingTasks.length}
                    </span>
                  </div>

                  {/* Pipeline Task Cards */}
                  <div className="space-y-2">
                    {matchingTasks.map(({ project, task }) => (
                      <div 
                        key={task.id} 
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setViewMode("SINGLE");
                        }}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-indigo-300 transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {project.projectCode}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-indigo-600">
                            {task.progressPct}%
                          </span>
                        </div>

                        <div className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                          {project.projectName}
                        </div>

                        <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-100">
                          <span>PO: {project.referencePoNo}</span>
                          <span>{formatThaiDate(task.planEndDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── VIEW 4: CARDS VIEW ──────────────────────────────────────────────── */}
      {viewMode === "CARDS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(proj => {
            const isExpanded = expandedProjectId === proj.id;

            return (
              <div key={proj.id} className="glass-panel rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {proj.projectCode}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">PO: {proj.referencePoNo}</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 mt-1">{proj.projectName}</h3>
                    <p className="text-xs text-slate-500">{proj.customerName}</p>
                  </div>

                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg ${
                    proj.progressPercent === 100 ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                  }`}>
                    {proj.progressPercent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className={`h-full transition-all ${proj.progressPercent === 100 ? "bg-emerald-500" : "bg-indigo-600"}`}
                    style={{ width: `${proj.progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-mono pt-1 border-t border-slate-100">
                  <span className="text-slate-500">มูลค่าสัญญา:</span>
                  <span className="font-bold text-slate-900">฿{formatMoney(proj.totalAmount)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setViewMode("SINGLE");
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-xs transition border border-indigo-200 flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>เปิดดูผังโครงการ</span>
                  </button>

                  <button
                    onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
                    className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs transition border border-slate-200"
                    title="ขยายดู 9 ขั้นตอน"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="space-y-1.5 pt-2 text-xs border-t border-slate-100">
                    {proj.masterTasks.map(t => (
                      <div key={t.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-indigo-700 block text-[9.5px]">{t.wbs} {t.stageName}</span>
                          <span className="text-[10.5px] text-slate-800 font-medium block truncate">{t.title}</span>
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-700 shrink-0 pl-2">{t.progressPct}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── VIEW 5: ALL TABLES (EXPANDED ALL PROJECTS) ─────────────────────────── */}
      {viewMode === "ALL_TABLES" && (
        <div className="space-y-5">
          {filteredProjects.map(proj => (
            <div key={proj.id} className="glass-panel rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition">
              
              {/* Project Card Header */}
              <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {proj.projectCode}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      PO: <strong className="text-slate-800">{proj.referencePoNo}</strong>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      DWG: {proj.dwgNo}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      proj.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                    }`}>
                      {proj.status === "COMPLETED" ? "ส่งมอบเสร็จสิ้น 100%" : "กำลังดำเนินการ"}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 mt-1">{proj.projectName}</h3>
                  <p className="text-xs text-slate-500">{proj.customerName} • วิศวกรผู้รับผิดชอบ: {proj.assignedEngineer}</p>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">มูลค่าสัญญา PO</span>
                    <span className="font-mono font-black text-sm text-slate-900">฿{formatMoney(proj.totalAmount)}</span>
                  </div>
                  <div className="pl-3 border-l border-slate-200">
                    <span className="text-[10px] text-indigo-600 block font-bold">ความคืบหน้ารวม Master Plan</span>
                    <span className="font-mono font-black text-base text-indigo-700">{proj.progressPercent}%</span>
                  </div>
                </div>
              </div>

              {/* 9 Stages Gantt Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[780px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center">WBS</th>
                      <th className="py-2 px-3">STAGE / TASK NAME (9 ขั้นตอนมาตรฐาน)</th>
                      <th className="py-2 px-3">ผู้รับผิดชอบ (RESPONSIBLE)</th>
                      <th className="py-2 px-3 text-center">กำหนดการ (PLAN DATES)</th>
                      <th className="py-2 px-3 text-center w-28">PROGRESS</th>
                      <th className="py-2 px-3 text-center w-36">สถานะงวดวางบิล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {proj.masterTasks.map((task, tIdx) => {
                      const stageDef = MASTER_PLAN_STAGES[tIdx] || MASTER_PLAN_STAGES[0];
                      const Icon = stageDef.icon;

                      let milestoneBadge = (
                        <span className="text-slate-400 font-mono text-[11px]">-</span>
                      );

                      if (task.milestoneStatus) {
                        if (task.milestoneStatus === "PAID") {
                          milestoneBadge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> ชำระแล้ว ({task.billingPercent}%)
                            </span>
                          );
                        } else if (task.milestoneStatus === "INVOICED") {
                          milestoneBadge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-2.5 h-2.5 text-amber-600" /> เปิดบิลแล้ว ({task.billingPercent}%)
                            </span>
                          );
                        } else {
                          milestoneBadge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="w-2.5 h-2.5" /> รอส่งมอบ ({task.billingPercent}%)
                            </span>
                          );
                        }
                      }

                      return (
                        <tr key={task.id} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">
                            {task.wbs}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${stageDef.bgBadge}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block text-xs">{task.stageName}</span>
                                <span className="text-[10px] text-slate-500 block">{task.title}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">
                            {task.responsible}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-500">
                            {formatThaiDate(task.planStartDate)} ➔ {formatThaiDate(task.planEndDate)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div 
                                  className={`h-full transition-all ${
                                    task.progressPct === 100 ? "bg-emerald-500" : "bg-indigo-600"
                                  }`}
                                  style={{ width: `${task.progressPct}%` }}
                                />
                              </div>
                              <span className="font-mono font-bold text-[10.5px] w-8 text-right text-slate-700">
                                {task.progressPct}%
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {milestoneBadge}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
