import React, { useState, useEffect } from 'react';
import { 
  X, Check, Layers, Cpu, Search, RefreshCw, 
  ArrowRight, ShieldCheck, Wifi, WifiOff, Settings2, Sparkles, CheckCircle2, ChevronDown, ListFilter, AlertCircle
} from 'lucide-react';
import { BomProject, BomPart, DocumentItem, DocumentType } from '../types';
import { bomBridge } from '../services/bomBridgeService';
import { formatMoney, formatNumber } from '../utils/formatters';

interface BomImportModalProps {
  docType: DocumentType;
  onClose: () => void;
  onImport: (importedItems: DocumentItem[], projectMeta: { projectCode: string; projectName: string; customerName?: string; bomProjectId?: string }) => void;
}

export const BomImportModal: React.FC<BomImportModalProps> = ({
  docType,
  onClose,
  onImport
}) => {
  const isPurchase = docType === 'PURCHASE_ORDER' || docType === 'PURCHASE_INVOICE' || docType === 'PAYMENT_VOUCHER';
  
  const [projects, setProjects] = useState<BomProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [sourceInfo, setSourceInfo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL');
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(new Set());
  
  // Margin for selling price (0% for PO/Cost, default +35% for Quotation)
  const [marginPercent, setMarginPercent] = useState<number>(isPurchase ? 0 : 35);
  // Import Mode: 'ITEMIZED' (แยกรายชิ้น) vs 'LUMP_SUM' (รวมชุด)
  const [importMode, setImportMode] = useState<'ITEMIZED' | 'LUMP_SUM'>('ITEMIZED');
  
  // Settings toggle
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [customApiUrl, setCustomApiUrl] = useState<string>(bomBridge.getApiUrl());
  const [testStatus, setTestStatus] = useState<string>('');

  // Fetch projects on load
  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await bomBridge.fetchProjects();
      setProjects(res.projects);
      setIsOnline(res.isOnline);
      setSourceInfo(res.source);
      if (res.projects.length > 0) {
        setSelectedProjectId(res.projects[0].id || res.projects[0].code);
      }
    } catch (err) {
      console.error('Error fetching BOM projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId || p.code === selectedProjectId);
  const parts: BomPart[] = selectedProject?.parts || [];

  // Reset selected parts when project changes
  useEffect(() => {
    if (parts.length > 0) {
      setSelectedPartIds(new Set(parts.map(p => p.id)));
    } else {
      setSelectedPartIds(new Set());
    }
  }, [selectedProjectId, parts.length]);

  // Categories & Suppliers filter lists
  const categories = ['ALL', ...Array.from(new Set(parts.map(p => p.category).filter(Boolean))) as string[]];
  const suppliers = ['ALL', ...Array.from(new Set(parts.map(p => p.supplier || p.maker).filter(Boolean))) as string[]];

  // Filtered parts
  const filteredParts = parts.filter(p => {
    const matchSearch = 
      p.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.typeSpec && p.typeSpec.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.maker && p.maker.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.dwgNo && p.dwgNo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchSupplier = selectedSupplier === 'ALL' || p.supplier === selectedSupplier || p.maker === selectedSupplier;

    return matchSearch && matchCategory && matchSupplier;
  });

  // Toggle single part selection
  const toggleSelectPart = (id: string) => {
    const next = new Set(selectedPartIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPartIds(next);
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedPartIds.size === filteredParts.length) {
      setSelectedPartIds(new Set());
    } else {
      setSelectedPartIds(new Set(filteredParts.map(p => p.id)));
    }
  };

  // Calculations for selected parts
  const selectedPartsList = parts.filter(p => selectedPartIds.has(p.id));
  const totalCost = selectedPartsList.reduce((sum, p) => {
    const cost = p.unitPrice || p.targetUnitPrice || 0;
    return sum + (cost * p.qty);
  }, 0);
  const markupMultiplier = 1 + (marginPercent / 100);
  const totalSellingPrice = totalCost * markupMultiplier;
  const totalProfit = totalSellingPrice - totalCost;

  // Handle Confirm Import
  const handleConfirmImport = () => {
    if (selectedPartsList.length === 0) {
      alert('กรุณาเลือกรายการพาร์ทอย่างน้อย 1 รายการ');
      return;
    }

    if (!selectedProject) return;

    let resultItems: DocumentItem[] = [];

    if (importMode === 'ITEMIZED') {
      // Create individual items
      resultItems = selectedPartsList.map((part, index) => {
        const unitCost = part.unitPrice || part.targetUnitPrice || 0;
        const calculatedPrice = Math.round(unitCost * markupMultiplier * 100) / 100;
        const qty = part.qty || 1;
        const specText = [
          part.typeSpec ? part.typeSpec : '',
          part.maker ? `แบรนด์: ${part.maker}` : '',
          part.dwgNo ? `DWG: ${part.dwgNo}` : '',
          part.remarks ? part.remarks : ''
        ].filter(Boolean).join(' | ');

        return {
          id: `item-bom-${part.id}-${Date.now()}-${index}`,
          code: part.dwgNo || part.typeSpec || `PART-${part.itemNo || index + 1}`,
          name: part.partName,
          description: specText,
          quantity: qty,
          unit: part.unit || 'pcs',
          pricePerUnit: calculatedPrice,
          discount: 0,
          amount: Math.round(calculatedPrice * qty * 100) / 100,
          vatInclusive: false,
          withholdingTaxRate: 0
        };
      });
    } else {
      // Create 1 consolidated Lump-sum item
      const bulletList = selectedPartsList.map((p, idx) => 
        `${idx + 1}. ${p.partName} ${p.typeSpec ? `(${p.typeSpec})` : ''} [${p.maker || p.supplier || 'Standard'}] จำนวน ${p.qty} ${p.unit}`
      ).join('\n');

      const fullDesc = `รายการอุปกรณ์และระบบโครงการประกอบด้วย:\n${bulletList}`;
      const lumpPrice = Math.round(totalSellingPrice * 100) / 100;

      resultItems = [
        {
          id: `item-bom-lump-${selectedProject.id}-${Date.now()}`,
          code: selectedProject.code || 'SYS-PROJECT',
          name: `ชุดระบบ ${selectedProject.name}`,
          description: fullDesc,
          quantity: 1,
          unit: 'ชุด',
          pricePerUnit: lumpPrice,
          discount: 0,
          amount: lumpPrice,
          vatInclusive: false,
          withholdingTaxRate: 0
        }
      ];
    }

    onImport(resultItems, {
      projectCode: selectedProject.code,
      projectName: selectedProject.name,
      customerName: selectedProject.customer,
      bomProjectId: selectedProject.id
    });
  };

  // Test custom API URL
  const handleTestUrl = async () => {
    setTestStatus('กำลังตรวจสอบการเชื่อมต่อ...');
    bomBridge.setApiUrl(customApiUrl);
    const check = await bomBridge.checkConnection();
    if (check.online) {
      setTestStatus(`✅ เชื่อมต่อสำเร็จ! (Latency: ${check.latency}ms)`);
      setIsOnline(true);
      loadProjects();
    } else {
      setTestStatus('❌ ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบ URL หรือเปิด Server');
      setIsOnline(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:px-6 flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">ดึงรายการจาก Mechanical BOM (BOM Integration)</h2>
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" /> Live Server
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    <WifiOff className="w-3 h-3 text-amber-400" /> ออฟไลน์แคช
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200/80">
                นำเข้า Part No., สเปก, จำนวน และต้นทุน เข้าสู่{isPurchase ? 'ใบสั่งซื้อ (PO)' : 'ใบเสนอราคา (Quotation)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white transition-colors"
              title="ตั้งค่าการเชื่อมต่อ BOM Server"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button 
              onClick={loadProjects}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/80 text-indigo-200 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Settings Drawer (Toggleable) */}
        {showSettings && (
          <div className="bg-indigo-950/90 text-white p-3 sm:px-6 border-b border-indigo-800/80 text-xs animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="font-semibold text-indigo-200 whitespace-nowrap">BOM Backend API URL:</span>
              <input 
                type="text"
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
                placeholder="http://localhost:5000/api หรือ https://warsgate-bom-api.onrender.com/api"
                className="bg-indigo-900/60 border border-indigo-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-indigo-400 flex-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <button
                onClick={handleTestUrl}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg text-white transition-colors"
              >
                ทดสอบและบันทึก
              </button>
            </div>
            {testStatus && <p className="mt-1 text-[11px] text-indigo-300">{testStatus}</p>}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Step 1: Select Project Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
            <label className="text-xs font-bold text-slate-700 mb-1.5 block flex items-center justify-between">
              <span>1. เลือกโครงการจากระบบ Mechanical BOM (Select Project):</span>
              <span className="text-[11px] font-normal text-slate-500">แหล่งข้อมูล: {sourceInfo}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {projects.map((proj) => {
                const isSelected = (proj.id === selectedProjectId || proj.code === selectedProjectId);
                return (
                  <button
                    key={proj.id || proj.code}
                    type="button"
                    onClick={() => setSelectedProjectId(proj.id || proj.code)}
                    className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                          {proj.code}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {proj.parts?.length || proj.totalPartsCount || 0} รายการ
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 mt-1.5 line-clamp-2 leading-snug">
                        {proj.name}
                      </h4>
                      {proj.customer && (
                        <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                          ลูกค้า: {proj.customer}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">ต้นทุนรวมประเมิน:</span>
                      <strong className="font-mono text-slate-800">
                        {formatMoney(proj.totalEstimatedCost || proj.targetBudget || 0)}
                      </strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Part Filter & Selection */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            
            {/* Filter Bar */}
            <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ListFilter className="w-3.5 h-3.5 text-indigo-600" />
                  2. รายการพาร์ทใน BOM ({filteredParts.length} รายการ)
                </span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline ml-2"
                >
                  {selectedPartIds.size === filteredParts.length ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                </button>
              </div>

              <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
                {/* Search */}
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหา Part No, ชื่อ, แบรนด์..."
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Category Filter */}
                {categories.length > 2 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>หมวด: {c}</option>
                    ))}
                  </select>
                )}

                {/* Supplier Filter */}
                {suppliers.length > 2 && (
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {suppliers.map(s => (
                      <option key={s} value={s}>ผู้จำหน่าย: {s}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Parts Table */}
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-700 font-bold text-[11px] sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5 text-center w-10">
                      <input
                        type="checkbox"
                        checked={filteredParts.length > 0 && selectedPartIds.size === filteredParts.length}
                        onChange={toggleSelectAll}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-2 px-2 w-10 text-center">#</th>
                    <th className="py-2 px-2">Part No. / รหัส</th>
                    <th className="py-2 px-2">ชื่ออุปกรณ์ & สเปก (Description)</th>
                    <th className="py-2 px-2 text-center w-16">แบรนด์</th>
                    <th className="py-2 px-2 text-center w-16">จำนวน</th>
                    <th className="py-2 px-2 text-right w-24">ต้นทุน/หน่วย</th>
                    {!isPurchase && (
                      <th className="py-2 px-2 text-right w-24 text-indigo-700 font-bold">ราคาขาย (+{marginPercent}%)</th>
                    )}
                    <th className="py-2 px-3 text-right w-28">ยอดรวม (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredParts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-6 text-slate-400">
                        ไม่พบรายการพาร์ทที่ตรงกับเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredParts.map((part, idx) => {
                      const isChecked = selectedPartIds.has(part.id);
                      const unitCost = part.unitPrice || part.targetUnitPrice || 0;
                      const sellPrice = Math.round(unitCost * markupMultiplier * 100) / 100;
                      const lineAmount = (isPurchase ? unitCost : sellPrice) * (part.qty || 1);

                      return (
                        <tr 
                          key={part.id || idx}
                          onClick={() => toggleSelectPart(part.id)}
                          className={`cursor-pointer transition-colors ${
                            isChecked ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'hover:bg-slate-50/60 opacity-60'
                          }`}
                        >
                          <td className="py-2 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectPart(part.id)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-slate-400">{part.itemNo || idx + 1}</td>
                          <td className="py-2 px-2 font-mono font-semibold text-slate-800">
                            {part.dwgNo || part.typeSpec || '-'}
                          </td>
                          <td className="py-2 px-2">
                            <div className="font-bold text-slate-900">{part.partName}</div>
                            {part.typeSpec && (
                              <div className="text-[10px] text-slate-500 line-clamp-1">{part.typeSpec}</div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {part.maker ? (
                              <span className="bg-slate-100 text-slate-700 text-[9.5px] px-1.5 py-0.5 rounded font-mono font-semibold">
                                {part.maker}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-semibold text-slate-800">
                            {part.qty} {part.unit || 'pcs'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-slate-600">
                            {formatNumber(unitCost)}
                          </td>
                          {!isPurchase && (
                            <td className="py-2 px-2 text-right font-mono font-bold text-indigo-700">
                              {formatNumber(sellPrice)}
                            </td>
                          )}
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatNumber(lineAmount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 3 & 4: Margin Control & Import Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            
            {/* Margin & Pricing Control */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <label className="text-xs font-bold text-slate-800 block mb-2">
                3. กำหนดอัตรากำไร (Profit Margin / Markup %):
              </label>
              
              <div className="flex items-center gap-1.5 mb-2.5">
                {[0, 20, 30, 35, 50].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setMarginPercent(rate)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      marginPercent === rate
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {rate === 0 ? '0% (ต้นทุนจริง)' : `+${rate}%`}
                  </button>
                ))}
                <div className="flex items-center gap-1 ml-auto">
                  <input
                    type="number"
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(Number(e.target.value))}
                    className="w-14 text-right text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-600">%</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-lg p-2.5 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>ต้นทุนรวมที่เลือก ({selectedPartsList.length} รายการ):</span>
                  <span className="font-semibold text-slate-800">{formatMoney(totalCost)}</span>
                </div>
                {!isPurchase && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>กำไรประมาณการ (+{marginPercent}%):</span>
                    <span>+{formatMoney(totalProfit)}</span>
                  </div>
                )}
                <div className="flex justify-between text-indigo-950 font-bold pt-1 border-t border-slate-100 text-xs">
                  <span>{isPurchase ? 'ยอดสั่งซื้อรวม (Subtotal):' : 'ยอดเสนอขายรวม (Subtotal):'}</span>
                  <span className="text-indigo-700 font-bold">{formatMoney(isPurchase ? totalCost : totalSellingPrice)}</span>
                </div>
              </div>
            </div>

            {/* Import Mode Selector */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <label className="text-xs font-bold text-slate-800 block mb-2">
                4. รูปแบบการนำเข้าข้อมูล (Import Mode):
              </label>

              <div className="space-y-2">
                <label 
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    importMode === 'ITEMIZED'
                      ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 bg-white/70 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'ITEMIZED'}
                    onChange={() => setImportMode('ITEMIZED')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <strong className="text-xs text-slate-900 block font-semibold">
                      นำเข้าแยกรายชิ้น (Itemized List) — แนะนำ
                    </strong>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      แสดงรายการพาร์ทและอุปกรณ์แต่ละชิ้นในตาราง พร้อมราคาต่อหน่วยตามสูตรกำไร
                    </p>
                  </div>
                </label>

                <label 
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    importMode === 'LUMP_SUM'
                      ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 bg-white/70 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'LUMP_SUM'}
                    onChange={() => setImportMode('LUMP_SUM')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <strong className="text-xs text-slate-900 block font-semibold">
                      นำเข้ารวมชุดโครงการ (Lump-sum Project)
                    </strong>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      สร้างเป็น 1 รายการราคารวม โดยใส่รายชื่ออุปกรณ์ทั้งหมดลงในรายละเอียด (Description)
                    </p>
                  </div>
                </label>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-3.5 sm:px-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            เลือก <strong className="text-indigo-700">{selectedPartsList.length}</strong> จาก {parts.length} รายการ | 
            ยอดรวมสุทธิ: <strong className="font-mono text-slate-900 text-sm">{formatMoney(isPurchase ? totalCost : totalSellingPrice)}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={selectedPartsList.length === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              นำเข้ารายการสู่เอกสาร ({selectedPartsList.length})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
