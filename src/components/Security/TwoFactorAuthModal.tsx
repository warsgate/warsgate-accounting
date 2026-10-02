import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, KeyRound, Clock, AlertTriangle, 
  CheckCircle2, RefreshCw, Eye, EyeOff, UserCheck, 
  ChevronDown, Copy, Check, Sparkles, ShieldAlert
} from 'lucide-react';
import { UserProfile } from '../../types';
import { AVAILABLE_USER_PROFILES } from '../../data/userRoles';
import { 
  getSecurityConfig, getDynamicOtp, verifyTwoFactorCredentials, 
  getLockoutStatus, setSession2FAAuthenticated 
} from '../../utils/securityConfig';
import { addAuditLog } from '../../utils/auditLogger';

interface TwoFactorAuthModalProps {
  currentUser: UserProfile;
  onSuccess: () => void;
  onSwitchUser?: (user: UserProfile) => void;
}

export const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  currentUser,
  onSuccess,
  onSwitchUser
}) => {
  const [pin, setPin] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successAnim, setSuccessAnim] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Dynamic OTP real-time clock state
  const [currentOtp, setCurrentOtp] = useState(getDynamicOtp(0));
  const [lockout, setLockout] = useState(getLockoutStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      const otp = getDynamicOtp(0);
      setCurrentOtp(otp);

      const lk = getLockoutStatus();
      setLockout(lk);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCopyOtp = () => {
    navigator.clipboard.writeText(currentOtp.code);
    setOtpCode(currentOtp.code);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleQuickFillPin = () => {
    const cfg = getSecurityConfig();
    setPin(cfg.masterPin || '123456');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!pin.trim()) {
      setErrorMessage('กรุณากรอกรหัสผ่านหลัก (Master PIN)');
      return;
    }

    if (!otpCode.trim()) {
      setErrorMessage('กรุณากรอกรหัสความปลอดภัยชั้นที่ 2 (OTP 6 หลัก หรือ Recovery Key)');
      return;
    }

    const result = verifyTwoFactorCredentials(pin, otpCode);

    if (result.success) {
      setSuccessAnim(true);
      addAuditLog({
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'STATUS_CHANGE',
        details: `ยืนยันความปลอดภัย 2 ชั้น (2FA Verification) สำเร็จ เข้าใช้งานระบบบัญชี`,
      });

      setTimeout(() => {
        setSession2FAAuthenticated(true);
        onSuccess();
      }, 700);
    } else {
      setErrorMessage(result.message);
      addAuditLog({
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'STATUS_CHANGE',
        details: `ล้มเหลวในการยืนยันตัวตน 2FA: ${result.message}`,
      });
      setLockout(getLockoutStatus());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto text-white">
        
        {/* Cyber Security Glow Border Effect */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-400" />
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 sm:p-8 space-y-5">
          
          {/* Header Banner */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 shadow-lg shadow-rose-900/40 border border-white/20 mb-1">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold tracking-wider">
              MILITARY-GRADE 2FA ENCRYPTION ACTIVE
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              ระบบรักษาความปลอดภัย 2 ชั้น (2FA)
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              กรุณายืนยันตัวตน 2 ขั้นตอน เพื่อปลดล็อกเข้าถึงสมุดบัญชี, รายงานการเงิน, และฐานข้อมูลภาษี
            </p>
          </div>

          {/* Current User Profile Box */}
          <div className="relative">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentUser.avatarColor} flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-sm border border-white/20`}>
                  {currentUser.avatarInitials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">{currentUser.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono font-semibold border border-rose-500/30">
                      {currentUser.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">{currentUser.roleTitle}</span>
                </div>
              </div>

              {onSwitchUser && (
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition shrink-0"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>สลับผู้ใช้</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dropdown for Switching User Persona */}
            {showUserDropdown && onSwitchUser && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl p-2 z-20 shadow-2xl space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  เลือกผู้ใช้งานสำหรับล็อกอิน:
                </div>
                {AVAILABLE_USER_PROFILES.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      onSwitchUser(user);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                      user.id === currentUser.id ? 'bg-rose-500/20 text-rose-200 border border-rose-500/30' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${user.avatarColor} text-white font-bold text-[10px] flex items-center justify-center`}>
                        {user.avatarInitials}
                      </div>
                      <span className="text-xs font-semibold">{user.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{user.roleTitle.split('/')[0]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* ── Factor 1: Master PIN ────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-rose-400" />
                  <span>ชั้นที่ 1: รหัสผ่านหลัก (Master PIN)</span>
                </label>
                <button
                  type="button"
                  onClick={handleQuickFillPin}
                  className="text-[10px] text-rose-400 hover:text-rose-300 transition underline underline-offset-2"
                >
                  ใช้รหัสเริ่มต้น (123456)
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="กรอกรหัส PIN ประจำตัว..."
                  disabled={lockout.isLocked}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono tracking-widest focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* ── Factor 2: Dynamic 2FA OTP Code Generator & Input ───────────── */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ชั้นที่ 2: รหัสความปลอดภัย OTP 6 หลัก</span>
                </label>
                <span className="text-[10px] font-mono text-indigo-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>เปลี่ยนใน {currentOtp.secondsRemaining}วิ</span>
                </span>
              </div>

              {/* Dynamic OTP Live Card */}
              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-indigo-300 block font-medium">รหัสความปลอดภัยปัจจุบัน (Dynamic Token):</span>
                  <div className="font-mono text-lg font-black tracking-widest text-emerald-400 mt-0.5">
                    {currentOtp.code}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyOtp}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 border border-indigo-400/30 shrink-0"
                  title="คัดลอกและใส่รหัส OTP ทันที"
                >
                  {copiedOtp ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>ใส่รหัสแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-200" />
                      <span>คัดลอกใส่ทันที</span>
                    </>
                  )}
                </button>
              </div>

              {/* OTP Input Field */}
              <input
                type="text"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                placeholder="กรอกรหัส 6 หลัก หรือ WARS-SECURE-9999..."
                maxLength={20}
                disabled={lockout.isLocked}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-center text-white placeholder-slate-500 font-mono tracking-widest text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-50"
              />
              <p className="text-[10px] text-slate-400 text-center">
                * รองรับรหัสกู้คืนฉุกเฉินสำหรับผู้บริหาร: <span className="font-mono text-slate-300 font-semibold">WARS-SECURE-9999</span>
              </p>
            </div>

            {/* Error or Lockout Alert Banner */}
            {lockout.isLocked && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center gap-2.5 text-rose-300 text-xs animate-pulse">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <div className="leading-tight">
                  <span className="font-bold block">ระบบถูกระงับชั่วคราว (Brute-Force Lockout)</span>
                  <span className="text-[10px]">กรุณารออีก {lockout.secondsRemaining} วินาทีก่อนลองใหม่</span>
                </div>
              </div>
            )}

            {errorMessage && !lockout.isLocked && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center gap-2 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={lockout.isLocked || successAnim}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 ${
                successAnim
                  ? 'bg-emerald-600 text-white shadow-emerald-900/40'
                  : 'bg-gradient-to-r from-rose-600 via-indigo-600 to-emerald-600 hover:from-rose-500 hover:to-emerald-500 text-white shadow-rose-950/50 hover:shadow-rose-900/40'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {successAnim ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                  <span>ยืนยันตัวตนสำเร็จ กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>ปลดล็อกระบบความปลอดภัย 2 ชั้น (Verify & Enter)</span>
                </>
              )}
            </button>

          </form>

          {/* Footer Security Badges */}
          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>WARSGATE Defense Shield v2.4</span>
            </span>
            <span>AES-256 / SHA-256 Dual Token</span>
          </div>

        </div>
      </div>
    </div>
  );
};
