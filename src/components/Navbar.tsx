import React from 'react';
import { 
  Search, 
  Bell, 
  PlusCircle, 
  ChevronDown, 
  ShieldCheck, 
  FileText, 
  CreditCard, 
  Box 
} from 'lucide-react';
import { CompanyProfile } from '../types';

interface NavbarProps {
  company: CompanyProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openCreateModal: (type: 'QUOTATION' | 'INVOICE' | 'RECEIPT' | 'PURCHASE_ORDER') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  company,
  setActiveTab,
  openCreateModal
}) => {
  const [showQuickMenu, setShowQuickMenu] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Official WARSGATE Logo */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 text-left focus:outline-none"
          >
            <img 
              src="/warsgate-logo.png" 
              alt="WARSGATE Logo" 
              className="h-9 md:h-11 w-auto object-contain"
            />
            <div className="hidden sm:block pl-3 border-l border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                  {company.branchCode === '00000' ? 'สำนักงานใหญ่' : `สาขา ${company.branchCode}`}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Tax ID: {company.taxId}</span>
            </div>
          </button>
        </div>

        {/* Middle: Quick Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="ค้นหาเอกสาร (INV-xxx, QT-xxx), คู่ค้า, หรือสินค้า..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/40 transition"
            />
            <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Actions & User Profile */}
        <div className="flex items-center gap-2">

          {/* Quick Add Button */}
          <div className="relative">
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs shadow-md shadow-rose-200 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>สร้างเอกสารด่วน</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showQuickMenu ? 'rotate-180' : ''}`} />
            </button>

            {showQuickMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowQuickMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-20 space-y-1 text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    เมนูขาย (Income)
                  </div>
                  <button onClick={() => { openCreateModal('QUOTATION'); setShowQuickMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <span>ใบเสนอราคา (Quotation)</span>
                  </button>
                  <button onClick={() => { openCreateModal('INVOICE'); setShowQuickMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition">
                    <CreditCard className="w-4 h-4 text-sky-500" />
                    <span>ใบแจ้งหนี้ / ใบกำกับภาษี</span>
                  </button>
                  <button onClick={() => { openCreateModal('RECEIPT'); setShowQuickMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>ใบเสร็จรับเงิน (Receipt)</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    เมนูซื้อ (Expense)
                  </div>
                  <button onClick={() => { openCreateModal('PURCHASE_ORDER'); setShowQuickMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition">
                    <Box className="w-4 h-4 text-purple-500" />
                    <span>ใบสั่งซื้อ (Purchase Order)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition border border-slate-200">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              จว
            </div>
            <div className="hidden lg:block text-left text-xs">
              <span className="block font-semibold text-slate-700">จีระวัฒน์ ปรีชานุรักษ์</span>
              <span className="text-[10px] text-slate-400">Managing Director</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
