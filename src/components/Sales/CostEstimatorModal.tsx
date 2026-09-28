import React, { useState } from 'react';
import { 
  Calculator, Plus, Trash2, Cpu, Wrench, Code, UserCheck, 
  DollarSign, TrendingUp, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2, X
} from 'lucide-react';
import { Contact, DocumentType, DocumentNumberingConfig } from '../../types';
import { formatMoney } from '../../utils/formatters';

interface CostEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onGenerateQuotation: (quotationData: any) => void;
}

interface CostItem {
  id: string;
  category: 'HARDWARE_BOM' | 'MACHINING_CNC' | 'ELECTRICAL_PANEL' | 'PROGRAMMING_PLC' | 'INSTALLATION_SAT';
  description: string;
  cost: number;
}

export const CostEstimatorModal: React.FC<CostEstimatorModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onGenerateQuotation
}) => {
  const [projectName, setProjectName] = useState<string>('Auto Screw Tightening Machine (Line 2)');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(contacts[0]?.id || '');
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(35); // 35% default margin
  const [contingencyPercent, setContingencyPercent] = useState<number>(5); // 5% contingency buffer

  const [costItems, setCostItems] = useState<CostItem[]>([
    { id: '1', category: 'HARDWARE_BOM', description: 'Standard Mechanical BOM (THK, SMC, MISUMI)', cost: 185000 },
    { id: '2', category: 'MACHINING_CNC', description: 'CNC Machining, Milling & Surface Treatment (Black Oxide/Anodize)', cost: 95000 },
    { id: '3', category: 'ELECTRICAL_PANEL', description: 'Control Box, Mitsubishi PLC, Omron Relay, Wiring Kit', cost: 72000 },
    { id: '4', category: 'PROGRAMMING_PLC', description: 'Software Engineering & HMI / SCADA Programming (8 Man-Days)', cost: 45000 },
    { id: '5', category: 'INSTALLATION_SAT', description: 'Site Installation, Commissioning & SAT (Site Acceptance Test)', cost: 28000 }
  ]);

  if (!isOpen) return null;

  const handleAddCostItem = () => {
    setCostItems([
      ...costItems,
      {
        id: `cost-${Date.now()}`,
        category: 'HARDWARE_BOM',
        description: 'รายการต้นทุนใหม่',
        cost: 10000
      }
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof CostItem, value: any) => {
    setCostItems(costItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveItem = (id: string) => {
    setCostItems(costItems.filter(item => item.id !== id));
  };

  // Calculations
  const baseTotalCost = costItems.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const contingencyCost = baseTotalCost * (contingencyPercent / 100);
  const totalDirectCost = baseTotalCost + contingencyCost;

  // Selling Price = Total Cost / (1 - Margin%)
  const targetSellingPrice = targetMarginPercent < 100 
    ? totalDirectCost / (1 - (targetMarginPercent / 100))
    : totalDirectCost * 1.5;
  
  const estimatedGrossProfit = targetSellingPrice - totalDirectCost;

  const handleCreateQuotation = () => {
    const selectedContact = contacts.find(c => c.id === selectedCustomerId) || contacts[0];
    
    // Group costs into neat quotation line items
    const quotationItems = [
      {
        id: `item-${Date.now()}-1`,
        code: 'AUTO-MACH-01',
        name: `ระบบเครื่องจักรอัตโนมัติ: ${projectName}`,
        description: `ออกแบบ ผลิต ประกอบ และติดตั้งระบบอัตโนมัติ พร้อมรายการอุปกรณ์มาตรฐานอุตสาหกรรม\n- ระบบโครงสร้างกลไกและชิ้นส่วนสั่งกลึงความแม่นยำสูง\n- ตู้ควบคุมคอนโทรลและระบบไฟฟ้ามาตรฐานอุตสาหกรรม\n- งานโปรแกรมมิ่ง PLC/HMI และการทดสอบเดินระบบหน้างาน (FAT/SAT)`,
        quantity: 1,
        unit: 'ระบบ',
        pricePerUnit: Math.round(targetSellingPrice),
        discount: 0,
        amount: Math.round(targetSellingPrice),
        vatInclusive: false,
        withholdingTaxRate: 3
      }
    ];

    onGenerateQuotation({
      type: 'QUOTATION',
      contact: selectedContact,
      projectNote: projectName,
      items: quotationItems,
      subtotal: Math.round(targetSellingPrice),
      vatAmount: Math.round(targetSellingPrice * 0.07),
      grandTotal: Math.round(targetSellingPrice * 1.07),
      notes: `ประเมินราคาด้วย Warsgate Smart Costing Engine (Target Margin: ${targetMarginPercent}%)`
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white flex items-center justify-between border-b border-rose-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Smart Automation Project Cost Estimator</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40">
                  Engineering Costing
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                เครื่องมือประเมินและวิเคราะห์ต้นทุนสร้างเครื่องจักร เพื่อตั้งราคาขายและรักษาอัตรากำไร (Margin)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Inputs: Project Details & Margin Targets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-slate-600 font-bold">ชื่อโครงการ / โซลูชันเครื่องจักร (Project Title)</label>
              <input 
                type="text"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="เช่น Automatic Assembly & Vision Inspection Machine"
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-600 font-bold">ลูกค้าผู้รับบริการ</label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {contacts.filter(c => c.type === 'CUSTOMER' || c.type === 'BOTH').map(c => (
                  <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-600 font-bold">เป้าหมายกำไรขั้นต้น (Target Margin %)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  min="5"
                  max="80"
                  value={targetMarginPercent}
                  onChange={e => setTargetMarginPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-rose-700 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="font-bold text-slate-500">%</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-600 font-bold">สำรองความเสี่ยงหน้างาน (Contingency Buffer %)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  min="0"
                  max="20"
                  value={contingencyPercent}
                  onChange={e => setContingencyPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-amber-700 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="font-bold text-slate-500">%</span>
              </div>
            </div>

            <div className="space-y-1 flex flex-col justify-end">
              <button
                type="button"
                onClick={handleAddCostItem}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มหมวดต้นทุน</span>
              </button>
            </div>
          </div>

          {/* Cost Items Matrix Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              ตารางแจกแจงต้นทุนโครงสร้างเครื่องจักร (Direct Cost Breakdown)
            </span>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 text-left w-44">หมวดหมู่</th>
                    <th className="py-2 px-3 text-left">รายละเอียด / พาร์ท</th>
                    <th className="py-2 px-3 text-right w-36">ต้นทุนประเมิน (บาท)</th>
                    <th className="py-2 px-2 text-center w-12">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {costItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3">
                        <select
                          value={item.category}
                          onChange={e => handleUpdateItem(item.id, 'category', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-700 text-[11px]"
                        >
                          <option value="HARDWARE_BOM">⚙️ Mechanical BOM</option>
                          <option value="MACHINING_CNC">🔩 CNC Machining</option>
                          <option value="ELECTRICAL_PANEL">⚡ Electrical & PLC</option>
                          <option value="PROGRAMMING_PLC">💻 Software Dev</option>
                          <option value="INSTALLATION_SAT">🛠️ FAT / SAT Site</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input 
                          type="text"
                          value={item.description}
                          onChange={e => handleUpdateItem(item.id, 'description', e.target.value)}
                          className="w-full px-2 py-1 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-rose-500 focus:outline-none font-medium text-slate-800"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input 
                          type="number"
                          value={item.cost}
                          onChange={e => handleUpdateItem(item.id, 'cost', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 text-right font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Simulation Output Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                รวมต้นทุนตรง (Total Direct Cost)
              </span>
              <div className="text-lg font-black font-mono text-slate-900">
                {formatMoney(totalDirectCost)} <span className="text-xs font-normal text-slate-500">บาท</span>
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                (Base: {formatMoney(baseTotalCost)} + Buffer {contingencyPercent}%)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                ประมาณการกำไรขั้นต้น (Gross Profit)
              </span>
              <div className="text-lg font-black font-mono text-emerald-700">
                {formatMoney(estimatedGrossProfit)} <span className="text-xs font-normal text-emerald-600">บาท</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block font-mono">
                อัตรากำไร {targetMarginPercent}% ของยอดเสนอราคา
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-200 space-y-1">
              <span className="text-[11px] font-bold text-rose-100 uppercase tracking-wider block">
                ราคาเสนอขายแนะนำ (Target Quotation Price)
              </span>
              <div className="text-xl font-black font-mono text-white">
                {formatMoney(targetSellingPrice)} <span className="text-xs font-normal text-rose-200">บาท</span>
              </div>
              <span className="text-[10px] text-rose-200 block font-mono">
                (ก่อนภาษีมูลค่าเพิ่ม VAT 7%)
              </span>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>พร้อมสร้างและออกใบเสนอราคา (Quotation) ได้ทันที</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition"
            >
              ปิด
            </button>
            <button
              onClick={handleCreateQuotation}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-200 transition active:scale-95"
            >
              <TrendingUp className="w-4 h-4" />
              <span>ออกใบเสนอราคา (Quotation) ทันที</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
