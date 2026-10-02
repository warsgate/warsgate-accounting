import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, KeyRound, Clock, AlertTriangle, 
  CheckCircle2, RefreshCw, Copy, Check, Eye, EyeOff, 
  Smartphone, ShieldAlert, Sparkles, Sliders
} from 'lucide-react';
import { 
  getSecurityConfig, saveSecurityConfig, getDynamicOtp, 
  setSession2FAAuthenticated, SecurityConfig 
} from '../../utils/securityConfig';
import { addAuditLog } from '../../utils/auditLogger';
import { AVAILABLE_USER_PROFILES } from '../../data/userRoles';

interface SecuritySettingsPanelProps {
  currentUser?: UserProfile;
  onLockScreen?: () => void;
}

export const SecuritySettingsPanel: React.FC<SecuritySettingsPanelProps> = ({
  currentUser = AVAILABLE_USER_PROFILES[0],
  onLockScreen = () => {}
}) => {
  const [config, setConfig] = useState<SecurityConfig>(getSecurityConfig());
  const [currentOtp, setCurrentOtp] = useState(getDynamicOtp(0));
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Change PIN modal / form state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentOtp(getDynamicOtp(0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggle2FA = () => {
    const updated = { ...config, is2FAEnabled: !config.is2FAEnabled };
    setConfig(updated);
    saveSecurityConfig(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);

    addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'SETTINGS_UPDATE',
      details: updated.is2FAEnabled 
        ? 'เปิดใช้งานระบบป้องกัน 2 ชั้น (2FA Security Enforced)' 
        : 'ปิดการบังคับใช้ระบบ 2FA ชั่วคราว',
    });
  };

  const handleToggleBruteForce = () => {
    const updated = { ...config, antiBruteForceEnabled: !config.antiBruteForceEnabled };
    setConfig(updated);
    saveSecurityConfig(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (newPin.length < 4) {
      setPinError('รหัสผ่าน Master PIN ต้องมีอย่างน้อย 4 ตัวอักษร');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('รหัสผ่านยืนยันไม่ตรงกัน');
      return;
    }

    const updated = { ...config, masterPin: newPin };
    setConfig(updated);
    saveSecurityConfig(updated);
    setPinSuccess('เปลี่ยนรหัสผ่าน Master PIN เรียบร้อยแล้ว');
    setNewPin('');
    setConfirmPin('');

    addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'SETTINGS_UPDATE',
      details: 'เปลี่ยนรหัสผ่านหลัก (Master PIN) สำหรับระบบความปลอดภัย 2 ชั้น',
    });

    setTimeout(() => setPinSuccess(null), 3500);
  };

  const handleGenerateNewRecoveryKey = () => {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newKey = `WARS-RECOVER-${randomHex}`;
    const updated = { ...config, recoveryKey: newKey };
    setConfig(updated);
    saveSecurityConfig(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);

    addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'SETTINGS_UPDATE',
      details: `สร้างรหัสกู้คืนฉุกเฉิน (Emergency Recovery Key) ชุดใหม่`,
    });
  };

  const copyToClipboard = (text: string, type: 'KEY' | 'OTP') => {
    navigator.clipboard.writeText(text);
    if (type === 'KEY') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      
      {/* ── Status Banner ────────────────────────────────────────────────────── */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
        config.is2FAEnabled
          ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border-emerald-500/40 text-white'
          : 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/40 text-slate-200'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-md shrink-0 border ${
            config.is2FAEnabled 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">
                ระบบป้องกันการเจาะ 2 ชั้น (Two-Factor Authentication: 2FA)
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono border ${
                config.is2FAEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {config.is2FAEnabled ? '✓ เปิดใช้งาน (ACTIVE)' : '⚠️ ปิดชั่วคราว'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ป้องกันการเจาะระบบ (Anti-Intrusion / Anti-Brute Force) ด้วยรหัสผ่านหลัก + โทเค็นความปลอดภัย 6 หลักแบบไดนามิก
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onLockScreen}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-600 transition active:scale-95 shadow-md"
            title="ทดสอบล็อกหน้าจอและทดสอบการยืนยันตัวตน 2FA ทันที"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>🔒 ล็อกหน้าจอทันที</span>
          </button>

          <button
            type="button"
            onClick={handleToggle2FA}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs transition active:scale-95 shadow-md ${
              config.is2FAEnabled
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {config.is2FAEnabled ? 'ปิด 2FA ชั่วคราว' : 'เปิดใช้งาน 2FA ทันที'}
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>บันทึกการตั้งค่าความปลอดภัยเรียบร้อยแล้ว</span>
        </div>
      )}

      {/* ── 2 Columns: Master PIN & Dynamic OTP Generator ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Left Card: Master PIN (Factor 1) */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-xs">ชั้นที่ 1: รหัสผ่านหลัก (Master PIN)</h4>
                <p className="text-[10px] text-slate-400">ใช้เป็นด่านแรกในการปลดล็อกระบบ</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 font-mono text-slate-600 font-semibold">
              PIN ปัจจุบัน: {showPin ? config.masterPin : '••••••'}
            </span>
          </div>

          <form onSubmit={handleUpdatePin} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                รหัสผ่าน Master PIN ใหม่
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="กรอกรหัส PIN ใหม่ (อย่างน้อย 4 หลัก)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono tracking-wider focus:outline-none focus:border-rose-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                ยืนยันรหัสผ่าน Master PIN อีกครั้ง
              </label>
              <input
                type={showPin ? 'text' : 'password'}
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value)}
                placeholder="กรอกรหัส PIN เดิมอีกครั้ง..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono tracking-wider focus:outline-none focus:border-rose-400"
              />
            </div>

            {pinError && (
              <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{pinError}</span>
              </p>
            )}

            {pinSuccess && (
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{pinSuccess}</span>
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition active:scale-95 shadow-sm"
            >
              บันทึกรหัส Master PIN ใหม่
            </button>
          </form>
        </div>

        {/* Right Card: Dynamic OTP Token Generator (Factor 2) */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs">ชั้นที่ 2: รหัสความปลอดภัย OTP ไดนามิก</h4>
                  <p className="text-[10px] text-slate-400">อัลกอริทึม TOTP 60 วินาที ป้องกันการดักจับ</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>รีเฟรชใน {currentOtp.secondsRemaining}s</span>
              </span>
            </div>

            <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-2">
              <span className="text-[10px] text-slate-400 font-mono block">LIVE DYNAMIC SECURITY TOKEN:</span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-black tracking-widest text-emerald-400">
                  {currentOtp.code}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(currentOtp.code, 'OTP')}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition"
                >
                  {copiedOtp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedOtp ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}</span>
                </button>
              </div>

              {/* Countdown Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden mt-2">
                <div 
                  className="bg-emerald-400 h-1 transition-all duration-1000"
                  style={{ width: `${(currentOtp.secondsRemaining / 60) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Emergency Master Recovery Key */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-amber-500" />
                <span>รหัสกู้คืนฉุกเฉิน (Master Recovery Key):</span>
              </span>
              <button
                type="button"
                onClick={handleGenerateNewRecoveryKey}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium"
              >
                สุ่มสร้างรหัสใหม่
              </button>
            </div>
            
            <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200 font-mono font-bold text-xs text-slate-800">
              <span>{config.recoveryKey}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(config.recoveryKey, 'KEY')}
                className="text-slate-400 hover:text-slate-700 p-1"
                title="คัดลอกรหัสกู้คืน"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              * ใช้สำหรับปลดล็อกฉุกเฉินในกรณีที่ลืมรหัสผ่านหรืออุปกรณ์มีปัญหา
            </p>
          </div>
        </div>

      </div>

      {/* ── Anti-Brute Force Protection Details ─────────────────────────────── */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-200 bg-white space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs">
                ระบบป้องกันการเดารหัสอัตโนมัติ (Anti-Brute Force & Rate Limiting)
              </h4>
              <p className="text-[10px] text-slate-400">
                ล็อกระบบชั่วคราวอัตโนมัติเมื่อตรวจพบการพยายามสุ่มรหัสผ่านผิดซ้ำหลายครั้ง
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.antiBruteForceEnabled}
              onChange={handleToggleBruteForce}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-[11px]">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
            <span className="text-slate-400 block text-[10px]">จำนวนครั้งที่อนุญาตให้กรอกผิด:</span>
            <strong className="text-slate-800 text-xs">{config.maxFailedAttempts} ครั้ง</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
            <span className="text-slate-400 block text-[10px]">ระยะเวลาล็อกระบบชั่วคราว:</span>
            <strong className="text-slate-800 text-xs">{config.lockoutDurationSeconds} วินาที (Cooldown)</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
            <span className="text-slate-400 block text-[10px]">บันทึกประวัติการบุกรุก:</span>
            <strong className="text-emerald-700 text-xs">Security Audit Log 100%</strong>
          </div>
        </div>
      </div>

    </div>
  );
};
