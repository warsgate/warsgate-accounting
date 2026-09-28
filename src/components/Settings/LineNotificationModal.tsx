import React, { useState, useEffect } from 'react';
import { 
  Bell, Send, CheckCircle2, AlertTriangle, ShieldCheck, 
  Smartphone, MessageSquare, ToggleLeft, ToggleRight, Sparkles, Clock, Check, X
} from 'lucide-react';
import { AccountingDocument } from '../../types';
import { formatMoney, formatThaiDate } from '../../utils/formatters';

interface LineNotificationSettings {
  lineNotifyToken: string;
  enabledEvents: {
    overdueAr: boolean;
    milestoneDue: boolean;
    lowStock: boolean;
    highValuePo: boolean;
  };
  minPoAmountAlert: number;
}

interface LineNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: AccountingDocument[];
  onApproveDocument?: (docId: string) => void;
  onRejectDocument?: (docId: string) => void;
}

export const LineNotificationModal: React.FC<LineNotificationModalProps> = ({
  isOpen,
  onClose,
  documents,
  onApproveDocument,
  onRejectDocument
}) => {
  const [settings, setSettings] = useState<LineNotificationSettings>(() => {
    const saved = localStorage.getItem('warsgate_line_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      lineNotifyToken: 'WARSGATE_AUTOMATION_OFFICIAL_LINE_NOTIFY_KEY',
      enabledEvents: {
        overdueAr: true,
        milestoneDue: true,
        lowStock: true,
        highValuePo: true
      },
      minPoAmountAlert: 50000
    };
  });

  const [testSent, setTestSent] = useState<boolean>(false);
  const [pendingApprovals, setPendingApprovals] = useState<AccountingDocument[]>([]);

  useEffect(() => {
    const pending = documents.filter(d => 
      d.status === 'PENDING' || d.status === 'DRAFT'
    ).slice(0, 5);
    setPendingApprovals(pending);
  }, [documents]);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    localStorage.setItem('warsgate_line_settings', JSON.stringify(settings));
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSimulateLinePush = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white flex items-center justify-between border-b border-emerald-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>LINE Official / Notify & Real-Time Approvals</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                  ONLINE
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                แจ้งเตือนงานด่วนยอดค้างชำระ วางบิลงวดงาน และอนุมัติเอกสาร 1-Click ผ่านมือถือ
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
          
          {/* Section 1: Quick Push Test & Notification Toggles */}
          <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  การตั้งค่าแจ้งเตือนอัตโนมัติ (Event Triggers)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ส่งแจ้งเตือนเข้ากลุ่ม LINE ผู้บริหารและวิศวกรทันทีเมื่อเกิดเหตุการณ์
                </p>
              </div>
              <button
                onClick={handleSimulateLinePush}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ทดสอบยิง LINE Alert</span>
              </button>
            </div>

            {testSent && (
              <div className="p-3 bg-emerald-100/80 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>🔔 ส่งข้อความแจ้งเตือนเข้า LINE กลุ่ม "Warsgate Management" เรียบร้อยแล้ว!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition">
                <span className="font-semibold text-slate-700">📌 ลูกหนี้ค้างชำระเกินกำหนด (Overdue AR)</span>
                <input 
                  type="checkbox" 
                  checked={settings.enabledEvents.overdueAr}
                  onChange={e => setSettings({
                    ...settings, 
                    enabledEvents: { ...settings.enabledEvents, overdueAr: e.target.checked }
                  })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition">
                <span className="font-semibold text-slate-700">⏱️ ถึงกำหนดวางบิลงวดงาน (Milestone Due)</span>
                <input 
                  type="checkbox" 
                  checked={settings.enabledEvents.milestoneDue}
                  onChange={e => setSettings({
                    ...settings, 
                    enabledEvents: { ...settings.enabledEvents, milestoneDue: e.target.checked }
                  })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition">
                <span className="font-semibold text-slate-700">📦 อะไหล่ต่ำกว่า Min Stock Alert</span>
                <input 
                  type="checkbox" 
                  checked={settings.enabledEvents.lowStock}
                  onChange={e => setSettings({
                    ...settings, 
                    enabledEvents: { ...settings.enabledEvents, lowStock: e.target.checked }
                  })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition">
                <span className="font-semibold text-slate-700">💰 ใบสั่งซื้อ (PO) ยอดเกิน 50,000 บาท</span>
                <input 
                  type="checkbox" 
                  checked={settings.enabledEvents.highValuePo}
                  onChange={e => setSettings({
                    ...settings, 
                    enabledEvents: { ...settings.enabledEvents, highValuePo: e.target.checked }
                  })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Interactive Mobile Approval Workflow Simulation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                รายการเอกสารที่รอการอนุมัติ (Mobile Approval Queue)
              </h3>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {pendingApprovals.length} รายการ
              </span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                ไม่มีเอกสารค้างรออนุมัติในระบบขณะนี้
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingApprovals.map(doc => (
                  <div key={doc.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-200 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {doc.documentNo}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {doc.contact?.companyName || doc.contact?.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatThaiDate(doc.issueDate)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>ยอดรวม: <strong className="text-slate-900 font-mono">{formatMoney(doc.grandTotal)} บาท</strong></span>
                        {doc.projectNote && (
                          <span className="text-rose-600 font-semibold text-[11px] bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                            {doc.projectNote}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (onRejectDocument) onRejectDocument(doc.id);
                          setPendingApprovals(prev => prev.filter(d => d.id !== doc.id));
                        }}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1 transition active:scale-95"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>ปฏิเสธ (Reject)</span>
                      </button>
                      <button
                        onClick={() => {
                          if (onApproveDocument) onApproveDocument(doc.id);
                          setPendingApprovals(prev => prev.filter(d => d.id !== doc.id));
                        }}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-200 transition active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>อนุมัติ (Approve)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-mono">
            Webhook: https://api.warsgate.co.th/webhooks/line-notify
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>บันทึกการตั้งค่า LINE</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
