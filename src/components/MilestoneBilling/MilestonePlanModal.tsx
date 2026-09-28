import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, CheckCircle2, AlertCircle, Percent, 
  DollarSign, FileText, Calendar, Building2, Sparkles, RefreshCw
} from 'lucide-react';
import { ContractMilestonePlan, ProjectMilestone, Contact, AccountingDocument } from '../../types';

interface MilestonePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: ContractMilestonePlan) => void;
  existingPlan?: ContractMilestonePlan | null;
  contacts: Contact[];
  documents: AccountingDocument[];
}

const PRESETS = [
  {
    name: '50% - 40% - 10%',
    desc: 'มาตรฐานสร้างเครื่องจักร: มัดจำ / ติดตั้ง FAT / ส่งมอบ SAT',
    splits: [
      { percentage: 50, title: 'งวดที่ 1: เงินมัดจำลงนามสัญญาและสั่งซื้ออุปกรณ์หลัก (50%)' },
      { percentage: 40, title: 'งวดที่ 2: ประกอบ ติดตั้ง และทดสอบระบบ Factory Acceptance Test (40%)' },
      { percentage: 10, title: 'งวดที่ 3: ส่งมอบงานขั้นสุดท้าย Site Acceptance Test & Training (10%)' }
    ]
  },
  {
    name: '30% - 50% - 20%',
    desc: 'งานระบบและติดตั้ง Software: มัดจำ / ส่งมอบระบบ / ตรวจรับ',
    splits: [
      { percentage: 30, title: 'งวดที่ 1: เงินมัดจำเริ่มงานออกแบบและวางโครงสร้างระบบ (30%)' },
      { percentage: 50, title: 'งวดที่ 2: ส่งมอบและติดตั้งโปรแกรมระบบ Software & Commissioning (50%)' },
      { percentage: 20, title: 'งวดที่ 3: ตรวจรับงานและส่งมอบเอกสารคู่มือ (20%)' }
    ]
  },
  {
    name: '50% - 50%',
    desc: 'งานซื้อมาขายไป & ปรับปรุงระบบ: มัดจำ 50% / ส่งมอบ 50%',
    splits: [
      { percentage: 50, title: 'งวดที่ 1: เงินมัดจำสั่งผลิตและจัดหาอุปกรณ์ (50%)' },
      { percentage: 50, title: 'งวดที่ 2: ส่งมอบงานและตรวจรับสมบูรณ์ (50%)' }
    ]
  },
  {
    name: '40% - 30% - 30%',
    desc: '3 งวดตามระยะเวลาโครงการ',
    splits: [
      { percentage: 40, title: 'งวดที่ 1: เงินมัดจำและจัดทำแบบวิศวกรรม (40%)' },
      { percentage: 30, title: 'งวดที่ 2: ประกอบโครงสร้างและเดินระบบไฟฟ้า (30%)' },
      { percentage: 30, title: 'งวดที่ 3: ทดสอบการทำงานจริงและส่งมอบงาน (30%)' }
    ]
  },
  {
    name: '100% ส่งมอบครบ',
    desc: 'วางบิลงวดเดียวเมื่อส่งของครบ 100%',
    splits: [
      { percentage: 100, title: 'งวดที่ 1: วางบิลส่งมอบงานและอุปกรณ์ครบถ้วน (100%)' }
    ]
  }
];

export const MilestonePlanModal: React.FC<MilestonePlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingPlan,
  contacts,
  documents
}) => {
  const [contractTitle, setContractTitle] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [referencePoNo, setReferencePoNo] = useState('');
  const [quotationDocNo, setQuotationDocNo] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [totalContractAmount, setTotalContractAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);

  const quotations = documents.filter(d => d.type === 'QUOTATION');

  useEffect(() => {
    if (existingPlan) {
      setContractTitle(existingPlan.contractTitle);
      setProjectName(existingPlan.projectName);
      setProjectCode(existingPlan.projectCode || '');
      setReferencePoNo(existingPlan.referencePoNo || '');
      setQuotationDocNo(existingPlan.quotationDocNo || '');
      setSelectedContactId(existingPlan.customerContact.id);
      setTotalContractAmount(existingPlan.totalContractAmount);
      setNotes(existingPlan.notes || '');
      setMilestones(existingPlan.milestones);
    } else {
      // Default new plan
      setContractTitle('โครงการระบบอัตโนมัติ');
      setProjectName('Automation Engineering Project');
      setProjectCode(`PRJ-${new Date().getFullYear().toString().slice(2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}`);
      setReferencePoNo('');
      setQuotationDocNo('');
      setSelectedContactId(contacts[0]?.id || '');
      setTotalContractAmount(500000);
      setNotes('เงื่อนไขการชำระเงินแบ่งตามงวดงานสัญญา');
      applyPreset(PRESETS[0], 500000);
    }
  }, [existingPlan, isOpen]);

  const applyPreset = (preset: typeof PRESETS[0], total: number) => {
    const today = new Date();
    const newMilestones: ProjectMilestone[] = preset.splits.map((split, index) => {
      const dueDate = new Date(today);
      dueDate.setMonth(today.getMonth() + index + 1);
      const amount = Math.round((total * (split.percentage / 100)) * 100) / 100;
      
      return {
        id: `ms-${Date.now()}-${index}`,
        milestoneNo: index + 1,
        title: split.title,
        percentage: split.percentage,
        amount: amount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'WAITING',
        notes: ''
      };
    });
    setMilestones(newMilestones);
  };

  const handleSelectQuotation = (docNo: string) => {
    setQuotationDocNo(docNo);
    const selectedDoc = quotations.find(q => q.documentNo === docNo);
    if (selectedDoc) {
      if (selectedDoc.contact) {
        setSelectedContactId(selectedDoc.contact.id);
      }
      if (selectedDoc.referencePoNo) {
        setReferencePoNo(selectedDoc.referencePoNo);
      }
      if (selectedDoc.projectNote) {
        setProjectName(selectedDoc.projectNote);
        setContractTitle(`โครงการ ${selectedDoc.projectNote}`);
      } else {
        setContractTitle(`สัญญาตามใบเสนอราคา ${selectedDoc.documentNo}`);
      }
      setTotalContractAmount(selectedDoc.grandTotal);
      
      // Recalculate milestone amounts based on new total
      setMilestones(prev => prev.map(m => ({
        ...m,
        amount: Math.round((selectedDoc.grandTotal * (m.percentage / 100)) * 100) / 100
      })));
    }
  };

  const handleTotalAmountChange = (newTotal: number) => {
    setTotalContractAmount(newTotal);
    setMilestones(prev => prev.map(m => ({
      ...m,
      amount: Math.round((newTotal * (m.percentage / 100)) * 100) / 100
    })));
  };

  const handleMilestonePercentageChange = (index: number, newPct: number) => {
    setMilestones(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        percentage: newPct,
        amount: Math.round((totalContractAmount * (newPct / 100)) * 100) / 100
      };
      return next;
    });
  };

  const handleMilestoneAmountChange = (index: number, newAmt: number) => {
    setMilestones(prev => {
      const next = [...prev];
      const pct = totalContractAmount > 0 ? Math.round((newAmt / totalContractAmount) * 10000) / 100 : 0;
      next[index] = {
        ...next[index],
        amount: newAmt,
        percentage: pct
      };
      return next;
    });
  };

  const handleAddMilestoneRow = () => {
    const nextNo = milestones.length + 1;
    const currentSumPct = milestones.reduce((sum, m) => sum + m.percentage, 0);
    const remainingPct = Math.max(0, 100 - currentSumPct);
    const amount = Math.round((totalContractAmount * (remainingPct / 100)) * 100) / 100;
    
    const newRow: ProjectMilestone = {
      id: `ms-${Date.now()}`,
      milestoneNo: nextNo,
      title: `งวดที่ ${nextNo}: ส่งมอบงานระยะที่ ${nextNo} (${remainingPct}%)`,
      percentage: remainingPct,
      amount: amount,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'WAITING',
      notes: ''
    };
    setMilestones(prev => [...prev, newRow]);
  };

  const handleRemoveMilestoneRow = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((m, i) => ({
        ...m,
        milestoneNo: i + 1
      }));
    });
  };

  const totalPercentage = Math.round(milestones.reduce((sum, m) => sum + m.percentage, 0) * 100) / 100;
  const totalMilestoneAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
  const isPercentageValid = Math.abs(totalPercentage - 100) < 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const contact = contacts.find(c => c.id === selectedContactId) || contacts[0];
    
    const plan: ContractMilestonePlan = {
      id: existingPlan?.id || `plan-${Date.now()}`,
      contractTitle: contractTitle || 'โครงการตามสัญญา',
      quotationDocNo: quotationDocNo || undefined,
      referencePoNo: referencePoNo || undefined,
      projectCode: projectCode || undefined,
      projectName: projectName || contractTitle,
      customerContact: contact,
      totalContractAmount: totalContractAmount,
      milestones: milestones,
      createdAt: existingPlan?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      notes: notes || undefined
    };

    onSave(plan);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {existingPlan ? 'แก้ไขแผนงวดงานสัญญา' : 'สร้างแผนวางบิลตามงวดงานสัญญา (Milestone Billing Plan)'}
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-mono">
                  WARSGATE PRO
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                กำหนดสัดส่วนการเบิกเงินตามงวดงานสัญญา (เช่น 50% มัดจำ / 40% ติดตั้ง / 10% ตรวจรับ)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Quick Presets Section */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-indigo-600" />
                เลือกรูปแบบงวดงานมาตรฐาน (Quick Presets)
              </span>
              <span className="text-[11px] text-indigo-600 font-medium">
                คลิกเพื่อจัดสัดส่วน % อัตโนมัติ
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset, totalContractAmount)}
                  className="p-2.5 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200/80 hover:border-indigo-600 rounded-xl text-left transition group shadow-2xs flex flex-col justify-between"
                >
                  <span className="text-xs font-bold text-slate-800 group-hover:text-white block">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-slate-500 group-hover:text-indigo-100 line-clamp-2 mt-1">
                    {preset.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Contract Base Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Link to Quotation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                อ้างอิงใบเสนอราคา (Quotation)
              </label>
              <select
                value={quotationDocNo}
                onChange={(e) => handleSelectQuotation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- ไม่ได้ผูกใบเสนอราคา / กำหนดเอง --</option>
                {quotations.map(q => (
                  <option key={q.id} value={q.documentNo}>
                    {q.documentNo} - {q.contact.companyName} (฿{q.grandTotal.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Contact */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                ลูกค้า / บริษัทคู่สัญญา <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {contacts.filter(c => c.type === 'CUSTOMER' || c.type === 'BOTH').map(c => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference PO */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เลขที่ใบสั่งซื้อลูกค้า (Customer PO No.)
              </label>
              <input
                type="text"
                placeholder="เช่น 2505004, PO-2601"
                value={referencePoNo}
                onChange={(e) => setReferencePoNo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Contract Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อสัญญา / โครงการ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น โครงการระบบ Automation Assembly Line Zone 1-6"
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Total Contract Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>มูลค่าสัญญารวม (บาท) <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-indigo-600 font-normal">รวม VAT 7% แล้ว</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={totalContractAmount}
                  onChange={(e) => handleTotalAmountChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">฿</span>
              </div>
            </div>

          </div>

          {/* Milestones Breakdown Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-800">
                  รายการงวดงาน ({milestones.length} งวด)
                </h3>
                {isPercentageValid ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    รวมครบ {totalPercentage}% (฿{totalMilestoneAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    สัดส่วนรวม {totalPercentage}% (ขาด/เกิน {(100 - totalPercentage).toFixed(2)}%)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddMilestoneRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มงวดงาน</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">งวด</th>
                    <th className="py-2.5 px-3">รายละเอียดและเงื่อนไขงวดงาน</th>
                    <th className="py-2.5 px-3 w-28 text-center">สัดส่วน (%)</th>
                    <th className="py-2.5 px-3 w-36 text-right">จำนวนเงิน (บาท)</th>
                    <th className="py-2.5 px-3 w-32">กำหนดวางบิล</th>
                    <th className="py-2.5 px-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {milestones.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        <span className="w-6 h-6 rounded-full bg-slate-200 inline-flex items-center justify-center text-[11px]">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          required
                          value={m.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMilestones(prev => prev.map((item, i) => i === idx ? { ...item, title: val } : item));
                          }}
                          placeholder="ระบุรายละเอียดงวดงาน..."
                          className="w-full bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-500 focus:outline-none py-1 text-xs text-slate-800"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={m.percentage}
                            onChange={(e) => handleMilestonePercentageChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-full text-center bg-slate-50 border border-slate-200 rounded-lg py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={m.amount}
                            onChange={(e) => handleMilestoneAmountChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-full text-right bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="date"
                          value={m.dueDate || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMilestones(prev => prev.map((item, i) => i === idx ? { ...item, dueDate: val } : item));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestoneRow(idx)}
                          disabled={milestones.length <= 1}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:text-slate-400 transition"
                          title="ลบงวดงานนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หมายเหตุ / เงื่อนไขเพิ่มเติม
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น การส่งมอบงานแต่ละงวดต้องมีใบลงนามรับมอบจากวิศวกรผู้ควบคุมงาน"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {isPercentageValid ? (
              <span className="text-emerald-600 font-medium">✓ สัดส่วนเปอร์เซ็นต์ถูกต้อง พร้อมบันทึกแผน</span>
            ) : (
              <span className="text-amber-600 font-medium">⚠ กรุณาปรับเปอร์เซ็นต์ให้รวมเท่ากับ 100%</span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isPercentageValid || !contractTitle}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-200 transition"
            >
              {existingPlan ? 'บันทึกการแก้ไข' : 'ยืนยันสร้างแผนงวดงาน'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
