import React, { useState } from 'react';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { ChartOfAccount, JournalEntry } from '../../types';
import { formatMoney } from '../../utils/formatters';

interface AccountingViewProps {
  chartOfAccounts: ChartOfAccount[];
  journalEntries: JournalEntry[];
}

export const AccountingView: React.FC<AccountingViewProps> = ({ chartOfAccounts, journalEntries }) => {
  const [activeTab, setActiveTab] = useState<'COA' | 'JV' | 'TRIAL_BALANCE'>('COA');
  const totalDebit = chartOfAccounts.reduce((sum, c) => sum + c.debit, 0);
  const totalCredit = chartOfAccounts.reduce((sum, c) => sum + c.credit, 0);

  const catColors: Record<string, string> = {
    ASSET: 'bg-sky-50 text-sky-700 border-sky-200',
    LIABILITY: 'bg-rose-50 text-rose-700 border-rose-200',
    EQUITY: 'bg-purple-50 text-purple-700 border-purple-200',
    REVENUE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    EXPENSE: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-500" />
            <span>ระบบบัญชี & การเงิน (General Ledger)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">ผังบัญชีมาตรฐาน, สมุดรายวันทั่วไป (JV), งบทดลอง และงบการเงิน</p>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
          {(['COA', 'JV', 'TRIAL_BALANCE'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === tab ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {tab === 'COA' ? 'ผังบัญชี' : tab === 'JV' ? 'สมุดรายวัน (JV)' : 'งบทดลอง'}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl">
        {activeTab === 'COA' && (
          <>
            <h2 className="text-base font-bold text-slate-800 mb-4">ผังบัญชีตามมาตรฐานการบัญชีไทย</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">รหัสบัญชี</th>
                    <th className="py-3 px-4">ชื่อบัญชี</th>
                    <th className="py-3 px-4">หมวดหมู่</th>
                    <th className="py-3 px-4">ประเภท</th>
                    <th className="py-3 px-4 text-right">ยอดเดบิต</th>
                    <th className="py-3 px-4 text-right">ยอดเครดิต</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chartOfAccounts.map(a => (
                    <tr key={a.code} className="hover:bg-rose-50/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{a.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{a.name}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${catColors[a.category] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {a.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{a.type}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">{a.debit > 0 ? formatMoney(a.debit) : '-'}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">{a.credit > 0 ? formatMoney(a.credit) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'JV' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">รายการบันทึกบัญชีสมุดรายวันทั่วไป</h2>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Debit & Credit Balanced
              </span>
            </div>
            <div className="space-y-4">
              {journalEntries.map(jv => (
                <div key={jv.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-rose-600">{jv.jvNo}</span>
                      <span className="text-slate-400">วันที่: {jv.date}</span>
                      <span className="text-slate-600 font-semibold">อ้างอิง: {jv.referenceNo}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">{jv.status}</span>
                  </div>
                  <p className="text-xs text-slate-600 italic">{jv.description}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-slate-400 font-semibold text-[11px]">
                        <tr>
                          <th className="py-1">รหัสบัญชี</th>
                          <th className="py-1">ชื่อบัญชี</th>
                          <th className="py-1 text-right">เดบิต (Dr)</th>
                          <th className="py-1 text-right">เครดิต (Cr)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {jv.entries.map((entry, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 font-mono text-slate-600">{entry.accountCode}</td>
                            <td className="py-1.5 text-slate-700 font-medium">{entry.accountName}</td>
                            <td className="py-1.5 text-right font-mono text-emerald-600 font-semibold">{entry.debit > 0 ? formatMoney(entry.debit) : '-'}</td>
                            <td className="py-1.5 text-right font-mono text-sky-600 font-semibold">{entry.credit > 0 ? formatMoney(entry.credit) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'TRIAL_BALANCE' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">รายงานงบทดลอง (Trial Balance)</h2>
              <span className="text-xs text-slate-400 font-mono">ณ วันที่ 12 สิงหาคม 2569</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">รหัสบัญชี</th>
                    <th className="py-3 px-4">รายการบัญชี</th>
                    <th className="py-3 px-4 text-right">เดบิต (Debit)</th>
                    <th className="py-3 px-4 text-right">เครดิต (Credit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chartOfAccounts.map(a => (
                    <tr key={a.code} className="hover:bg-rose-50/30">
                      <td className="py-2.5 px-4 font-mono text-slate-600">{a.code}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{a.name}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-600 font-semibold">{a.debit > 0 ? formatMoney(a.debit) : '-'}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-sky-600 font-semibold">{a.credit > 0 ? formatMoney(a.credit) : '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-rose-50 font-bold border-t-2 border-rose-200">
                    <td colSpan={2} className="py-3 px-4 text-slate-800 font-bold">ยอดรวมดุลการชำระ (Total Balance)</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 text-sm font-bold">{formatMoney(totalDebit)}</td>
                    <td className="py-3 px-4 text-right font-mono text-sky-700 text-sm font-bold">{formatMoney(totalCredit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
