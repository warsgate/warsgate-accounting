import React, { useState, useEffect } from 'react';
import { 
  X, Check, ShoppingBag, Cpu, CheckCircle2, ChevronRight, AlertCircle, 
  Building2, Calendar, FileText, ArrowRight, ExternalLink, Printer, Sparkles, Layers
} from 'lucide-react';
import { 
  BomProject, BomPart, AccountingDocument, Contact, DocumentNumberingConfig, DocumentItem 
} from '../../types';
import { bomBridge } from '../../services/bomBridgeService';
import { formatMoney, formatNumber, formatThaiDate } from '../../utils/formatters';
import { defaultNumberingConfig, previewDocumentNo } from '../../utils/numbering';

interface BomPoGeneratorModalProps {
  contacts: Contact[];
  numberingConfig?: DocumentNumberingConfig;
  initialProjectCode?: string;
  initialQuotationDoc?: AccountingDocument | null;
  onClose: () => void;
  onBatchCreate: (createdDocs: AccountingDocument[]) => void;
  openViewDocument?: (doc: AccountingDocument) => void;
}

interface SupplierGroup {
  supplierKey: string;
  supplierName: string;
  contactId: string;
  matchedContact?: Contact;
  docNo: string;
  expectedDeliveryDate: string;
  selected: boolean;
  parts: BomPart[];
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
}

export const BomPoGeneratorModal: React.FC<BomPoGeneratorModalProps> = ({
  contacts,
  numberingConfig: propNumberingConfig,
  initialProjectCode,
  initialQuotationDoc,
  onClose,
  onBatchCreate,
  openViewDocument
}) => {
  const [projects, setProjects] = useState<BomProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [supplierGroups, setSupplierGroups] = useState<SupplierGroup[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<AccountingDocument[]>([]);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];
  const next2WeeksStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const numConfig: DocumentNumberingConfig = propNumberingConfig || (() => {
    const saved = localStorage.getItem('warsgate_doc_numbering');
    return saved ? JSON.parse(saved) : defaultNumberingConfig;
  })();

  const supplierContacts = contacts.filter(c => c.type === 'SUPPLIER' || c.type === 'BOTH');

  // Load BOM projects on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res = await bomBridge.fetchProjects();
        setProjects(res.projects);
        
        let targetId = '';
        if (initialProjectCode) {
          const match = res.projects.find(p => p.code === initialProjectCode || p.id === initialProjectCode);
          if (match) targetId = match.id || match.code;
        } else if (initialQuotationDoc) {
          const notes = initialQuotationDoc.notes || '';
          const match = res.projects.find(p => 
            notes.includes(p.name) || notes.includes(p.code) || 
            (initialQuotationDoc.documentNo === 'QT-2609-002' && p.code === 'PRJ-2609-002') ||
            (initialQuotationDoc.documentNo === 'QT-2609-004' && p.code === 'PRJ-2609-004')
          );
          if (match) targetId = match.id || match.code;
        }

        if (!targetId && res.projects.length > 0) {
          targetId = res.projects[0].id || res.projects[0].code;
        }

        setSelectedProjectId(targetId);
      } catch (err) {
        console.error('Failed to load BOM projects for PO Generator', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [initialProjectCode, initialQuotationDoc]);

  const selectedProject = projects.find(p => p.id === selectedProjectId || p.code === selectedProjectId);

  // Group parts by Supplier / Maker
  useEffect(() => {
    if (!selectedProject || !selectedProject.parts || selectedProject.parts.length === 0) {
      setSupplierGroups([]);
      return;
    }

    const groupsMap = new Map<string, BomPart[]>();
    selectedProject.parts.forEach(part => {
      const supKey = (part.supplier || part.maker || 'ซัพพลายเออร์ทั่วไป').trim();
      if (!groupsMap.has(supKey)) {
        groupsMap.set(supKey, []);
      }
      groupsMap.get(supKey)!.push(part);
    });

    const poSetting = numConfig.PURCHASE_ORDER || defaultNumberingConfig.PURCHASE_ORDER;
    let baseNextNum = poSetting.nextNumber || 1;

    const result: SupplierGroup[] = [];
    let groupIndex = 0;

    groupsMap.forEach((partsList, supKey) => {
      // Find matching contact or fallback
      const matched = supplierContacts.find(c => 
        c.companyName.toLowerCase().includes(supKey.toLowerCase()) ||
        c.name.toLowerCase().includes(supKey.toLowerCase()) ||
        supKey.toLowerCase().includes(c.companyName.toLowerCase())
      ) || supplierContacts[0] || contacts[0];

      const subtotal = partsList.reduce((sum, p) => {
        const cost = p.unitPrice || p.targetUnitPrice || 0;
        return sum + (cost * p.qty);
      }, 0);
      const vatAmount = Math.round(subtotal * 0.07 * 100) / 100;
      const grandTotal = Math.round((subtotal + vatAmount) * 100) / 100;

      // Generate sequence PO Number
      const simulatedSetting = {
        ...poSetting,
        nextNumber: baseNextNum + groupIndex
      };
      const docNo = previewDocumentNo(simulatedSetting, todayStr);

      result.push({
        supplierKey: supKey,
        supplierName: matched?.companyName || supKey,
        contactId: matched?.id || '',
        matchedContact: matched,
        docNo,
        expectedDeliveryDate: next2WeeksStr,
        selected: true,
        parts: partsList,
        subtotal,
        vatAmount,
        grandTotal
      });

      groupIndex++;
    });

    setSupplierGroups(result);
  }, [selectedProjectId, selectedProject]);

  // Toggle selection for a group
  const toggleGroupSelect = (supKey: string) => {
    setSupplierGroups(prev => prev.map(g => g.supplierKey === supKey ? { ...g, selected: !g.selected } : g));
  };

  // Change contact for a group
  const handleContactChange = (supKey: string, contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    setSupplierGroups(prev => prev.map(g => {
      if (g.supplierKey === supKey) {
        return {
          ...g,
          contactId,
          supplierName: contact?.companyName || g.supplierName,
          matchedContact: contact
        };
      }
      return g;
    }));
  };

  // Change expected delivery date
  const handleDateChange = (supKey: string, date: string) => {
    setSupplierGroups(prev => prev.map(g => g.supplierKey === supKey ? { ...g, expectedDeliveryDate: date } : g));
  };

  // Generate POs Batch
  const handleGeneratePOs = async () => {
    const selectedBatches = supplierGroups.filter(g => g.selected);
    if (selectedBatches.length === 0) {
      alert('กรุณาเลือก Supplier ที่ต้องการเปิดใบสั่งซื้ออย่างน้อย 1 รายการ');
      return;
    }

    if (!selectedProject) return;

    const createdList: AccountingDocument[] = [];
    const allOrderedPartIds: string[] = [];

    selectedBatches.forEach((batch, idx) => {
      const contact = batch.matchedContact || contacts.find(c => c.id === batch.contactId) || {
        id: `supp-${Date.now()}-${idx}`,
        name: batch.supplierName,
        companyName: batch.supplierName,
        taxId: '0000000000000',
        isBranch: false,
        branchCode: '00000',
        address: '-',
        phone: '-',
        email: '-',
        type: 'SUPPLIER',
        creditDays: 30,
        totalTransactions: 0,
        balanceDue: 0
      };

      const docItems: DocumentItem[] = batch.parts.map((p, pIdx) => {
        const cost = p.unitPrice || p.targetUnitPrice || 0;
        const lineTotal = Math.round(cost * p.qty * 100) / 100;
        allOrderedPartIds.push(p.id);

        const specText = [
          p.typeSpec ? p.typeSpec : '',
          p.maker ? `แบรนด์: ${p.maker}` : '',
          p.dwgNo ? `DWG: ${p.dwgNo}` : '',
          p.remarks ? p.remarks : ''
        ].filter(Boolean).join(' | ');

        return {
          id: `item-po-${Date.now()}-${idx}-${pIdx}`,
          code: p.dwgNo || p.typeSpec || `PART-${p.itemNo || pIdx + 1}`,
          name: p.partName,
          description: specText,
          quantity: p.qty,
          unit: p.unit || 'pcs',
          pricePerUnit: cost,
          discount: 0,
          amount: lineTotal,
          vatInclusive: false,
          withholdingTaxRate: 0
        };
      });

      const newDoc: AccountingDocument = {
        id: `doc-po-${Date.now()}-${idx}`,
        documentNo: batch.docNo,
        type: 'PURCHASE_ORDER',
        issueDate: todayStr,
        dueDate: batch.expectedDeliveryDate,
        referencePoNo: selectedProject.code,
        referenceDocNo: initialQuotationDoc?.documentNo || undefined,
        projectNote: selectedProject.name,
        contact,
        items: docItems,
        subtotal: batch.subtotal,
        discountTotal: 0,
        vatRate: 7,
        vatAmount: batch.vatAmount,
        grandTotal: batch.grandTotal,
        withholdingTaxTotal: 0,
        netPayment: batch.grandTotal,
        status: 'PENDING',
        notes: `สั่งซื้ออุปกรณ์โครงการ: ${selectedProject.name} (${selectedProject.code}) ${initialQuotationDoc ? `| อ้างอิง QT: ${initialQuotationDoc.documentNo}` : ''} | กำหนดส่งมอบ: ${formatThaiDate(batch.expectedDeliveryDate)} | รายการนี้ส่งของครบ จ่าย 100%`,
        createdByName: 'ฝ่ายจัดซื้อ / คุณจีระวัฒน์ (MD)'
      };

      createdList.push(newDoc);
    });

    // Save batch in Accounting
    onBatchCreate(createdList);
    setGeneratedDocs(createdList);

    // Update numbering config
    try {
      const poSetting = numConfig.PURCHASE_ORDER || defaultNumberingConfig.PURCHASE_ORDER;
      const updatedConfig = {
        ...numConfig,
        PURCHASE_ORDER: {
          ...poSetting,
          nextNumber: (poSetting.nextNumber || 1) + createdList.length
        }
      };
      localStorage.setItem('warsgate_doc_numbering', JSON.stringify(updatedConfig));
    } catch (err) {
      console.error('Error saving numbering config', err);
    }

    // Sync back to BOM Server
    setSyncStatus('กำลังซิงค์สถานะกลับไปยัง Mechanical BOM Server...');
    try {
      const syncRes = await bomBridge.syncPoToBom(allOrderedPartIds, {
        poNumber: createdList.map(d => d.documentNo).join(', '),
        supplier: selectedBatches.map(b => b.supplierName).join(', '),
        orderDate: todayStr
      });
      setSyncStatus(`✅ ซิงค์สถานะ 'Ordered' สำเร็จ ${allOrderedPartIds.length} รายการ`);
    } catch (err) {
      setSyncStatus('⚠️ ซิงค์ข้อมูลกลับ BOM Server ในโหมดออฟไลน์');
    }

    setIsDone(true);
  };

  const selectedBatches = supplierGroups.filter(g => g.selected);
  const totalBatchCost = selectedBatches.reduce((sum, g) => sum + g.subtotal, 0);
  const totalBatchGrand = selectedBatches.reduce((sum, g) => sum + g.grandTotal, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:px-6 flex items-center justify-between border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">สร้างใบสั่งซื้อ (PO) จาก BOM แยกตาม Supplier</h2>
                <span className="text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Phase 2: Multi-Supplier PO Generator
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                แยกสั่งซื้อพาร์ทตามร้านค้า/ผู้จำหน่ายอัตโนมัติ พร้อมซิงค์สถานะกลับระบบ Mechanical BOM
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/80 text-indigo-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isDone ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            
            {/* Step 1: Select Project or Quote */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
              <label className="text-xs font-bold text-slate-700 mb-1.5 block flex items-center justify-between">
                <span>1. เลือกโครงการเป้าหมาย (Target BOM Project):</span>
                {initialQuotationDoc && (
                  <span className="text-xs font-semibold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded">
                    อ้างอิงใบเสนอราคา: {initialQuotationDoc.documentNo}
                  </span>
                )}
              </label>

              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {projects.map(p => (
                  <option key={p.id || p.code} value={p.id || p.code}>
                    {p.code} - {p.name} ({p.customer || 'ทั่วไป'}) — {p.parts?.length || p.totalPartsCount || 0} พาร์ท [ต้นทุน: {formatMoney(p.totalEstimatedCost || 0)} บาท]
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Supplier Batches Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  2. จัดกลุ่มพาร์ทแยกตาม Supplier ({supplierGroups.length} กลุ่มร้านค้า)
                </h3>
                <span className="text-xs text-slate-500">
                  เลือกเปิด PO: <strong className="text-indigo-700">{selectedBatches.length}</strong> จาก {supplierGroups.length} ฉบับ
                </span>
              </div>

              {supplierGroups.length === 0 ? (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                  ไม่พบรายการพาร์ทในโครงการที่เลือก
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {supplierGroups.map((group) => {
                    return (
                      <div 
                        key={group.supplierKey}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          group.selected 
                            ? 'border-indigo-300 bg-white shadow-xs' 
                            : 'border-slate-200 bg-slate-50/70 opacity-60'
                        }`}
                      >
                        {/* Group Header */}
                        <div className="p-3.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={group.selected}
                              onChange={() => toggleGroupSelect(group.supplierKey)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {group.supplierKey}
                                </span>
                                <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                                  {group.docNo}
                                </span>
                                <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                  {group.parts.length} รายการ
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Contact mapping & Expected Date */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-slate-500 text-[11px]">ผูกบัญชีผู้จำหน่าย:</span>
                              <select
                                value={group.contactId}
                                onChange={(e) => handleContactChange(group.supplierKey, e.target.value)}
                                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold max-w-[200px] truncate"
                              >
                                {supplierContacts.map(c => (
                                  <option key={c.id} value={c.id}>
                                    {c.companyName}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-slate-500 text-[11px]">กำหนดส่งของ:</span>
                              <input
                                type="date"
                                value={group.expectedDeliveryDate}
                                onChange={(e) => handleDateChange(group.supplierKey, e.target.value)}
                                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono text-slate-800"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Parts Preview Table */}
                        <div className="max-h-40 overflow-y-auto">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-100/60 text-slate-600 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="py-1 px-3 w-8 text-center">#</th>
                                <th className="py-1 px-2">Part No. / Spec</th>
                                <th className="py-1 px-2">ชื่ออุปกรณ์</th>
                                <th className="py-1 px-2 text-center w-14">จำนวน</th>
                                <th className="py-1 px-2 text-right w-24">ต้นทุน/หน่วย</th>
                                <th className="py-1 px-3 text-right w-28">ยอดรวม (บาท)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                              {group.parts.map((p, pIdx) => {
                                const cost = p.unitPrice || p.targetUnitPrice || 0;
                                return (
                                  <tr key={p.id || pIdx} className="hover:bg-slate-50/50">
                                    <td className="py-1.5 px-3 text-center font-mono text-slate-400">{pIdx + 1}</td>
                                    <td className="py-1.5 px-2 font-mono font-semibold text-slate-800">{p.dwgNo || p.typeSpec || '-'}</td>
                                    <td className="py-1.5 px-2 font-medium text-slate-900">{p.partName}</td>
                                    <td className="py-1.5 px-2 text-center font-mono">{p.qty} {p.unit}</td>
                                    <td className="py-1.5 px-2 text-right font-mono text-slate-600">{formatNumber(cost)}</td>
                                    <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">{formatNumber(cost * p.qty)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Group Footer Total */}
                        <div className="p-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-500 font-sans text-[11px]">
                            รวมก่อน VAT: <strong>{formatMoney(group.subtotal)}</strong> | VAT 7%: <strong>{formatMoney(group.vatAmount)}</strong>
                          </span>
                          <span className="font-bold text-indigo-950">
                            ยอดรวมใบสั่งซื้อสุทธิ: <strong className="text-indigo-700 text-sm">{formatMoney(group.grandTotal)}</strong> บาท
                          </span>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Step 3: Done Screen */
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                สร้างใบสั่งซื้อ (Purchase Orders) สำเร็จเรียบร้อย! 🎉
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg mx-auto">
                ระบบได้สร้างใบสั่งซื้อจำนวน <strong>{generatedDocs.length} ฉบับ</strong> ลงในระบบบัญชี และอัปเดตสถานะพาร์ทใน Mechanical BOM Server เป็น <span className="text-emerald-700 font-bold">'Ordered'</span> เรียบร้อยแล้ว
              </p>
              {syncStatus && (
                <p className="text-xs text-indigo-600 font-medium mt-2 bg-indigo-50 inline-block px-3 py-1 rounded-full border border-indigo-200">
                  {syncStatus}
                </p>
              )}
            </div>

            {/* Cards of generated POs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-3xl mx-auto text-left">
              {generatedDocs.map((doc) => (
                <div key={doc.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-300 hover:bg-indigo-50/20 transition-all shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">
                        {doc.documentNo}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {doc.items.length} รายการ
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-2 line-clamp-1">
                      {doc.contact?.companyName || doc.contact?.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      กำหนดส่งของ: {formatThaiDate(doc.dueDate)}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      ฿{formatMoney(doc.grandTotal)}
                    </span>
                    {openViewDocument && (
                      <button
                        onClick={() => {
                          onClose();
                          openViewDocument(doc);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>ดูใบสั่งซื้อ</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-50 p-3.5 sm:px-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {!isDone ? (
            <>
              <div className="text-xs text-slate-600">
                พร้อมเปิดใบสั่งซื้อ: <strong className="text-indigo-700">{selectedBatches.length}</strong> ฉบับ | 
                ยอดรวมสั่งซื้อสุทธิ: <strong className="font-mono text-slate-900 text-sm font-bold">{formatMoney(totalBatchGrand)}</strong> บาท
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
                  disabled={selectedBatches.length === 0}
                  onClick={handleGeneratePOs}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>🚀 สร้างใบสั่งซื้อ ({selectedBatches.length} ฉบับ)</span>
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
              >
                เสร็จสิ้น (ปิดหน้าต่าง)
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
