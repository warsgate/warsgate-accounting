import { AuditLogEntry, UserRole, AuditAction } from '../types';

const AUDIT_LOG_STORAGE_KEY = 'warsgate_audit_logs';

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-09-28 09:15:20',
    userName: 'จีระวัฒน์ ปรีชานุรักษ์',
    userRole: 'MD_ADMIN',
    action: 'CREATE_DOC',
    targetDocNo: 'QT-2609-001',
    details: 'สร้างใบเสนอราคาโครงการ Automation Machine Assembly Zone 1-6 ให้ บจก. พีเอ็นพี เทคโนโลยี เกรท',
    ipAddress: '192.168.1.10'
  },
  {
    id: 'log-2',
    timestamp: '2026-09-28 09:30:45',
    userName: 'ธนกฤต วิศวกรรม',
    userRole: 'ENGINEER_PM',
    action: 'UPDATE_DOC',
    targetDocNo: 'BOM-PNP-01',
    details: 'ซิงค์ข้อมูล Mechanical BOM และวิเคราะห์ Cost Matrix ต้นทุนฮาร์ดแวร์ + ค่าแรงติดตั้ง',
    ipAddress: '192.168.1.15'
  },
  {
    id: 'log-3',
    timestamp: '2026-09-28 09:45:10',
    userName: 'ปิยะดา การค้า',
    userRole: 'SALES',
    action: 'MILESTONE_INVOICE',
    targetDocNo: 'INV-690800001',
    details: 'ออกใบแจ้งหนี้งวดที่ 1 (มัดจำ 50%) จากแผนงวดงานโครงการ Solenoid Line มูลค่า ฿2,323,499.85',
    ipAddress: '192.168.1.22'
  },
  {
    id: 'log-4',
    timestamp: '2026-09-28 10:05:00',
    userName: 'สมชาย จัดหา',
    userRole: 'PURCHASING',
    action: 'CREATE_DOC',
    targetDocNo: 'PO-2609-001',
    details: 'สร้างใบสั่งซื้อ PO เซอร์โวมอเตอร์และ PLC สำหรับโครงการ WARSGATE ให้ บจก. ออมรอน อีเลคทรอนิกส์',
    ipAddress: '192.168.1.33'
  },
  {
    id: 'log-5',
    timestamp: '2026-09-28 10:12:30',
    userName: 'วราภรณ์ การเงิน',
    userRole: 'ACCOUNTANT',
    action: 'STATUS_CHANGE',
    targetDocNo: 'INV-690600005',
    details: 'เปลี่ยนสถานะใบแจ้งหนี้เป็น "รับชำระแล้ว (PAID)" และออกใบกำกับภาษี/ใบเสร็จรับเงิน',
    ipAddress: '192.168.1.41'
  }
];

export const getAuditLogs = (): AuditLogEntry[] => {
  try {
    const saved = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load audit logs:', err);
  }
  return initialAuditLogs;
};

export const addAuditLog = (
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }
): AuditLogEntry => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timestamp = entry.timestamp || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  
  const newEntry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp,
    ...entry,
    ipAddress: entry.ipAddress || '192.168.1.10'
  };

  try {
    const currentLogs = getAuditLogs();
    const updatedLogs = [newEntry, ...currentLogs].slice(0, 200); // keep latest 200 logs
    localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (err) {
    console.error('Failed to save audit log:', err);
  }

  return newEntry;
};

export const clearAuditLogs = (): void => {
  try {
    localStorage.removeItem(AUDIT_LOG_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear audit logs:', err);
  }
};
