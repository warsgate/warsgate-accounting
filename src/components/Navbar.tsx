import React, { useState } from 'react';
import { 
  Search, PanelLeft, Bell, PlusCircle, ChevronDown, 
  ShieldCheck, FileText, CreditCard, Box, Cpu, 
  ExternalLink, UserCheck, Check, Sparkles
} from 'lucide-react';
import { CompanyProfile, UserProfile } from '../types';
import { AVAILABLE_USER_PROFILES } from '../data/userRoles';

interface NavbarProps {
  company: CompanyProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openCreateModal: (type: 'QUOTATION' | 'INVOICE' | 'RECEIPT' | 'PURCHASE_ORDER') => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  currentUser?: UserProfile;
  onSwitchUser?: (user: UserProfile) => void;
  onOpenLineNotification?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  company,
  setActiveTab,
  openCreateModal,
  isSidebarCollapsed = false,
  onToggleSidebar,
  currentUser = AVAILABLE_USER_PROFILES[0],
  onSwitchUser,
  onOpenLineNotification
}) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Official WARSGATE Logo & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition active:scale-95"
              title={isSidebarCollapsed ? "ขยายเมนูด้านซ้าย (Expand Sidebar)" : "ย่อ/ซ่อนเมนูด้านซ้าย (Collapse Sidebar)"}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <img 
              src="/warsgate-logo.png" 
              alt="WARSGATE Logo" 
              className="h-8 md:h-9 w-auto object-contain transition group-hover:scale-105"
            />
            <div className="hidden sm:block pl-3 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-sm md:text-base font-black text-slate-800 tracking-tight leading-tight">
                  โปรแกรมบัญชี <span className="text-rose-600 font-extrabold">วอร์สเกต</span>
                </span>
                <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-2 py-0.2 rounded-full border border-rose-200">
                  {company.branchCode === '00000' ? 'สำนักงานใหญ่' : `สาขา ${company.branchCode}`}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">Tax ID: {company.taxId}</span>
            </div>
          </button>
        </div>

        {/* Middle: Quick Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="ค้นหาเอกสาร (INV-xxx, QT-xxx), สัญญา, หรือสินค้า..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/40 transition"
            />
            <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Actions & Role Persona Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5">

          {/* Direct Link to Mechanical BOM WebApp */}
          <a
            href="https://warsgate-bom.onrender.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-indigo-200 transition active:scale-95 group"
            title="เปิดโปรแกรม Mechanical BOM Part List (เปิดแท็บใหม่)"
          >
            <Cpu className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
            <span className="font-bold tracking-tight">Mechanical BOM</span>
            <ExternalLink className="w-3 h-3 text-indigo-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

          {/* LINE Alerts & Approvals Button */}
          {onOpenLineNotification && (
            <button
              onClick={onOpenLineNotification}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 shadow-xs transition active:scale-95"
              title="ตั้งค่าแจ้งเตือนและระบบอนุมัติเอกสารผ่าน LINE Official / Notify"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
              <span className="hidden sm:inline">LINE Alert</span>
            </button>
          )}

          {/* Quick Add Button */}
          <div className="relative">
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-rose-200 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>สร้างเอกสาร</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showQuickMenu ? 'rotate-180' : ''}`} />
            </button>

            {showQuickMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowQuickMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-20 space-y-1 text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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

          {/* User Persona / Role Switcher Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition text-left"
              title="สลับบทบาทผู้ใช้งาน (Switch User Role)"
            >
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${currentUser.avatarColor} flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0`}>
                {currentUser.avatarInitials}
              </div>
              <div className="hidden xl:block text-left text-xs leading-tight">
                <span className="block font-bold text-slate-800 truncate max-w-[130px]">{currentUser.name}</span>
                <span className="text-[10px] text-slate-500 truncate max-w-[130px]">{currentUser.roleTitle.split('/')[0]}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-20 space-y-1 text-xs">
                  <div className="px-3 py-2 bg-slate-50 rounded-xl mb-1 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>สลับบทบาทจำลอง (RBAC Persona)</span>
                      <span className="text-rose-600 font-bold">WARSGATE</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {currentUser.department}
                    </div>
                  </div>

                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    เลือกตำแหน่งงาน (Switch Role):
                  </div>

                  {AVAILABLE_USER_PROFILES.map((profile) => {
                    const isSelected = currentUser.id === profile.id;
                    return (
                      <button
                        key={profile.id}
                        onClick={() => {
                          if (onSwitchUser) onSwitchUser(profile);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                          isSelected
                            ? 'bg-rose-50 border border-rose-200 text-rose-900 font-bold'
                            : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${profile.avatarColor} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}>
                            {profile.avatarInitials}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs truncate font-bold text-slate-800">
                              {profile.name}
                            </span>
                            <span className="block text-[10px] text-slate-500 truncate">
                              {profile.roleTitle}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-center py-1.5 text-[11px] text-slate-500 hover:text-slate-800 font-semibold transition"
                    >
                      ⚙ ดูตารางสิทธิ์ผู้ใช้งานทั้งหมด (Role Matrix)
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
