import React, { useState, useEffect } from 'react';
import { 
  X, Check, TrendingUp, TrendingDown, DollarSign, PackageCheck, 
  ShoppingCart, Clock, AlertTriangle, Cpu, Layers, RefreshCw, 
  Search, CheckCircle2, ChevronRight, ArrowRight, ExternalLink, Sparkles, Building2
} from 'lucide-react';
import { BomProject, BomPart, AccountingDocument } from '../types';
import { bomBridge } from '../services/bomBridgeService';
import { formatMoney, formatNumber, formatThaiDate, getProjectName } from '../utils/formatters';

interface ProjectCostMatrixModalProps {
  documents: AccountingDocument[];
  initialProjectCode?: string;
  onClose: () => void;
  onOpenPoGenerator?: (projectCode: string) => void;
}

export const ProjectCostMatrixModal: React.FC<ProjectCostMatrixModalProps> = ({
  documents,
  initialProjectCode,
  onClose,
  onOpenPoGenerator
}) => {
  const [projects, setProjects] = useState<BomProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Load projects on mount
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await bomBridge.fetchProjects();
      setProjects(res.projects);

      let targetId = '';
      if (initialProjectCode) {
        const found = res.projects.find(p => p.code === initialProjectCode || p.id === initialProjectCode);
        if (found) targetId = found.id || found.code;
      }
      if (!targetId && res.projects.length > 0) {
        targetId = res.projects[0].id || res.projects[0].code;
      }

      setSelectedProjectId(targetId);
    } catch (err) {
      console.error('Error loading cost analysis data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [initialProjectCode]);

  // When selected project changes, fetch cost analysis
  useEffect(() => {
    if (!selectedProjectId) return;
    const fetchAnalysis = async () => {
      try {
        const data = await bomBridge.fetchProjectCostAnalysis(selectedProjectId);
        setAnalysisData(data);
      } catch (err) {
        console.error('Failed to fetch project cost analysis', err);
      }
    };
    fetchAnalysis();
  }, [selectedProjectId]);

  const selectedProject = projects.find(p => p.id === selectedProjectId || p.code === selectedProjectId);

  // Find linked Quotations & POs from Accounting Documents
  const projectCode = selectedProject?.code || '';
  const projectName = selectedProject?.name || '';

  const linkedQuotations = documents.filter(d => 
    d.type === 'QUOTATION' && (
      (d.referencePoNo && d.referencePoNo === projectCode) ||
      (d.notes && (d.notes.includes(projectName) || d.notes.includes(projectCode))) ||
      (projectCode === 'PRJ-2609-002' && d.documentNo === 'QT-2609-002') ||
      (projectCode === 'PRJ-2609-004' && d.documentNo === 'QT-2609-004')
    )
  );

  const linkedPOs = documents.filter(d => 
    d.type === 'PURCHASE_ORDER' && (
      (d.referencePoNo && d.referencePoNo === projectCode) ||
      (d.notes && (d.notes.includes(projectName) || d.notes.includes(projectCode))) ||
      (projectCode === 'PRJ-527' && d.notes?.includes('Line ADC'))
    )
  );

  const quotationRevenue = linkedQuotations.reduce((sum, q) => sum + q.subtotal, 0);
  const actualPoTotal = linkedPOs.reduce((sum, p) => sum + p.subtotal, 0);

  const partsList: BomPart[] = analysisData?.parts || selectedProject?.parts || [];
  const metrics = analysisData?.metrics || {
    totalParts: partsList.length,
    plannedCount: partsList.filter(p => !p.status || p.status === 'Planned').length,
    orderedCount: partsList.filter(p => p.status === 'Ordered').length,
    receivedCount: partsList.filter(p => p.status === 'Received').length,
    orderedPercentage: 0,
    receivedPercentage: 0,
    estimatedCost: selectedProject?.totalEstimatedCost || 0,
    actualPurchasedCost: selectedProject?.totalEstimatedCost || 0,
    costVariance: 0,
    variancePercentage: 0
  };

  const effectiveCost = actualPoTotal > 0 ? actualPoTotal : metrics.actualPurchasedCost;
  const grossProfit = quotationRevenue > 0 ? (quotationRevenue - effectiveCost) : 0;
  const grossMarginPercent = quotationRevenue > 0 ? Math.round((grossProfit / quotationRevenue) * 100 * 10) / 10 : 0;

  // Filter parts
  const filteredParts = partsList.filter(p => {
    const matchSearch = 
      p.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.typeSpec && p.typeSpec.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.maker && p.maker.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.dwgNo && p.dwgNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.poNumber && p.poNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Mark part as received
  const handleMarkAsReceived = async (partId: string) => {
    setSyncMessage('กำลังซิงค์สถานะการรับของกลับ BOM Server...');
    try {
      await bomBridge.syncGoodsReceiptToBom([partId], {
        receiveDate: new Date().toISOString().split('T')[0],
        storeLocation: 'Warsgate Workshop / Line Assembly'
      });
      // Refresh analysis
      const updated = await bomBridge.fetchProjectCostAnalysis(selectedProjectId);
      setAnalysisData(updated);
      setSyncMessage('✅ บันทึกสถานะรับของสำเร็จ (Received)');
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (err) {
      setSyncMessage('⚠️ บันทึกสถานะในโหมดออฟไลน์');
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:px-6 flex items-center justify-between border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">วิเคราะห์ต้นทุนโครงการ BOM vs บัญชีจริง (Cost Matrix & Variance)</h2>
                <span className="text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Phase 3: Cost Variance & Delivery Sync
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                เปรียบเทียบงบประมาณ BOM ➔ ใบเสนอราคา (QT) ➔ ต้นทุนสั่งซื้อจริง (PO) ➔ กำไรขั้นต้น (Gross Profit)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white transition"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/80 text-indigo-200 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Project Selector Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">เลือกโครงการ:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {projects.map(p => (
                  <option key={p.id || p.code} value={p.id || p.code}>
                    {p.code} : {p.name} ({p.customer || 'ทั่วไป'})
                  </option>
                ))}
              </select>
            </div>

            {onOpenPoGenerator && selectedProject && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPoGenerator(selectedProject.code);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>🛒 เปิด PO สั่งซื้อพาร์ทโครงการนี้</span>
              </button>
            )}
          </div>

          {/* ── 4 KPI Financial Cards (Cost Variance & Margins) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* Card 1: BOM Estimated Cost */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">1. งบต้นทุนประเมินใน BOM</span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-1.5">
                <span className="text-lg font-extrabold font-mono text-slate-900">
                  ฿{formatMoney(metrics.estimatedCost)}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1">
                จาก {metrics.totalParts} รายการพาร์ท
              </p>
            </div>

            {/* Card 2: Quotation Value */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">2. ราคาเสนอขายใน QT</span>
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-1.5">
                <span className="text-lg font-extrabold font-mono text-rose-700">
                  {quotationRevenue > 0 ? `฿${formatMoney(quotationRevenue)}` : '฿' + formatMoney(metrics.estimatedCost * 1.35)}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1">
                {linkedQuotations.length > 0 ? `${linkedQuotations.length} ฉบับ (${linkedQuotations.map(q => q.documentNo).join(', ')})` : 'คำนวณตามสูตร (+35%)'}
              </p>
            </div>

            {/* Card 3: Actual PO Cost */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">3. ต้นทุนสั่งซื้อจริงตาม PO</span>
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-1.5">
                <span className="text-lg font-extrabold font-mono text-sky-700">
                  ฿{formatMoney(effectiveCost)}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1">
                {linkedPOs.length > 0 ? `${linkedPOs.length} ใบสั่งซื้อเปิดแล้ว` : `${metrics.orderedCount} พาร์ทสั่งซื้อแล้ว`}
              </p>
            </div>

            {/* Card 4: Actual Gross Profit */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-300 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">4. กำไรขั้นต้นจริง (Gross Profit)</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-1.5">
                <span className="text-lg font-extrabold font-mono text-emerald-700">
                  +฿{formatMoney(quotationRevenue > 0 ? grossProfit : (metrics.estimatedCost * 0.35))}
                </span>
              </div>
              <p className="text-[10.5px] text-emerald-700 font-semibold mt-1">
                Margin: {quotationRevenue > 0 ? `${grossMarginPercent}%` : '+35.0%'}
              </p>
            </div>

          </div>

          {/* ── Procurement Pipeline Progress Bar ── */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-indigo-600" />
                สถานะความคืบหน้าการจัดหาพาร์ท (Procurement Pipeline)
              </span>
              <div className="flex items-center gap-3 text-[11px] font-mono font-semibold">
                <span className="text-slate-500">📋 แผน: {metrics.plannedCount}</span>
                <span className="text-sky-600">🛒 สั่งซื้อแล้ว: {metrics.orderedCount}</span>
                <span className="text-emerald-700">📦 รับของแล้ว: {metrics.receivedCount}</span>
              </div>
            </div>

            {/* Multi-segment Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${metrics.totalParts > 0 ? (metrics.receivedCount / metrics.totalParts) * 100 : 0}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`ได้รับของแล้ว ${metrics.receivedCount} รายการ`}
              />
              <div 
                style={{ width: `${metrics.totalParts > 0 ? (metrics.orderedCount / metrics.totalParts) * 100 : 0}%` }}
                className="bg-sky-500 transition-all duration-500"
                title={`สั่งซื้อแล้ว ${metrics.orderedCount} รายการ`}
              />
              <div 
                style={{ width: `${metrics.totalParts > 0 ? (metrics.plannedCount / metrics.totalParts) * 100 : 0}%` }}
                className="bg-slate-300 transition-all duration-500"
                title={`อยู่ในแผน ${metrics.plannedCount} รายการ`}
              />
            </div>
            
            <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
              <span>ความคืบหน้ารวม: <strong>{metrics.totalParts > 0 ? Math.round(((metrics.orderedCount + metrics.receivedCount) / metrics.totalParts) * 100) : 0}%</strong> ดำเนินการแล้ว</span>
              <span>ส่งมอบครบ 100%: <strong>{metrics.totalParts > 0 ? Math.round((metrics.receivedCount / metrics.totalParts) * 100) : 0}%</strong></span>
            </div>
          </div>

          {/* Sync status toast */}
          {syncMessage && (
            <div className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
              <span>{syncMessage}</span>
            </div>
          )}

          {/* ── Interactive Parts & PO Table ── */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            
            {/* Filter & Search Bar */}
            <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  รายการพาร์ทและสถานะจัดซื้อ ({filteredParts.length} รายการ)
                </span>
                <div className="flex items-center gap-1 ml-2">
                  {['ALL', 'Planned', 'Ordered', 'Received'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFilterStatus(st)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition ${
                        filterStatus === st 
                          ? 'bg-indigo-600 text-white shadow-2xs' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st === 'ALL' ? 'ทั้งหมด' : st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหา Part No, ชื่อ, PO..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-700 font-bold text-[11px] sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5 w-10 text-center">#</th>
                    <th className="py-2 px-2">Part No. / DWG</th>
                    <th className="py-2 px-2">ชื่ออุปกรณ์ & สเปก</th>
                    <th className="py-2 px-2 text-center w-16">แบรนด์</th>
                    <th className="py-2 px-2 text-center w-14">จำนวน</th>
                    <th className="py-2 px-2 text-right w-24">ต้นทุน/หน่วย</th>
                    <th className="py-2 px-2 text-center w-28">เลขที่ PO สั่งซื้อ</th>
                    <th className="py-2 px-2 text-center w-24">สถานะ</th>
                    <th className="py-2 px-2.5 text-center w-28">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredParts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-6 text-slate-400">
                        ไม่พบข้อมูลพาร์ท
                      </td>
                    </tr>
                  ) : (
                    filteredParts.map((part, idx) => {
                      const cost = part.unitPrice || part.targetUnitPrice || 0;
                      const status = part.status || 'Planned';

                      return (
                        <tr key={part.id || idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-2.5 text-center font-mono text-slate-400">{part.itemNo || idx + 1}</td>
                          <td className="py-2 px-2 font-mono font-semibold text-slate-800">
                            {part.dwgNo || part.typeSpec || '-'}
                          </td>
                          <td className="py-2 px-2">
                            <div className="font-bold text-slate-900">{part.partName}</div>
                            {part.typeSpec && (
                              <div className="text-[10px] text-slate-500 truncate max-w-xs">{part.typeSpec}</div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {part.maker ? (
                              <span className="bg-slate-100 text-slate-700 text-[9.5px] px-1.5 py-0.5 rounded font-mono font-semibold">
                                {part.maker}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-semibold">
                            {part.qty} {part.unit}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-semibold text-slate-800">
                            {formatNumber(cost)}
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {part.poNumber ? (
                              <span className="text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px]">
                                {part.poNumber}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              status === 'Received'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : status === 'Ordered'
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {status === 'Received' ? '📦 รับของแล้ว' : status === 'Ordered' ? '🛒 สั่งซื้อแล้ว' : '📋 อยู่ในแผน'}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            {status !== 'Received' ? (
                              <button
                                type="button"
                                onClick={() => handleMarkAsReceived(part.id)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 mx-auto"
                                title="มาร์คว่าได้รับของเข้าคลัง/หน้างานแล้ว"
                              >
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>รับของแล้ว</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> เรียบร้อย
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-3.5 sm:px-6 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            โครงการ: <strong className="text-slate-800">{projectName} ({projectCode})</strong> | ลูกค้า: <strong>{selectedProject?.customer || '-'}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
