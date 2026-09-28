// Helper for formatting currency in Thai Baht (THB)
export const formatMoney = (amount: number | null | undefined): string => {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Thai Date formatting (e.g. 30 ก.ค. 2026 or พ.ศ. 2569)
export const formatThaiDate = (dateString: string, includeBE: boolean = true): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const monthNames = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = includeBE ? date.getFullYear() + 543 : date.getFullYear();

  return `${day} ${month} ${year}`;
};

// Converts numbers to Thai Baht Text string (e.g., 1250.50 -> "หนึ่งพันสองร้อยห้าสิบบาทห้าสิบสตางค์")
export const arabicToThaiBahtText = (numberInput: number): string => {
  if (isNaN(numberInput)) return 'ศูนย์บาทถ้วน';

  const numberStr = numberInput.toFixed(2);
  const [bahtPart, satangPart] = numberStr.split('.');

  if (parseFloat(numberStr) === 0) return 'ศูนย์บาทถ้วน';

  const digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

  const convertGroup = (groupStr: string): string => {
    let result = '';
    const len = groupStr.length;

    for (let i = 0; i < len; i++) {
      const digit = parseInt(groupStr[i]);
      const position = len - i - 1;

      if (digit !== 0) {
        if (position === 1 && digit === 1) {
          result += 'สิบ';
        } else if (position === 1 && digit === 2) {
          result += 'ยี่สิบ';
        } else if (position === 0 && digit === 1 && len > 1) {
          result += 'เอ็ด';
        } else {
          result += digits[digit] + units[position];
        }
      }
    }
    return result;
  };

  let bahtText = '';
  let bahtVal = parseInt(bahtPart);

  if (bahtVal === 0) {
    bahtText = 'ศูนย์บาท';
  } else {
    // Process in groups of 6 digits (ล้าน)
    const groups: string[] = [];
    let tempBaht = bahtPart;

    while (tempBaht.length > 0) {
      if (tempBaht.length > 6) {
        groups.unshift(tempBaht.slice(-6));
        tempBaht = tempBaht.slice(0, -6);
      } else {
        groups.unshift(tempBaht);
        tempBaht = '';
      }
    }

    for (let i = 0; i < groups.length; i++) {
      const groupText = convertGroup(groups[i]);
      bahtText += groupText;
      if (i < groups.length - 1) {
        bahtText += 'ล้าน';
      }
    }
    bahtText += 'บาท';
  }

  let satangText = '';
  const satangVal = parseInt(satangPart);

  if (satangVal === 0) {
    satangText = 'ถ้วน';
  } else {
    satangText = convertGroup(satangPart) + 'สตางค์';
  }

  return bahtText + satangText;
};

// Document Status Label & Color Badge Helper
export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PAID':
    case 'APPROVED':
    case 'POSTED':
      return {
        label: 'ชำระแล้ว / อนุมัติ',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500'
      };
    case 'PENDING':
      return {
        label: 'รอชำระ / รออนุมัติ',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500'
      };
    case 'OVERDUE':
      return {
        label: 'เกินกำหนดชำระ',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500 animate-pulse'
      };
    case 'DRAFT':
      return {
        label: 'ร่างเอกสาร',
        bg: 'bg-slate-100 text-slate-600 border-slate-300',
        dot: 'bg-slate-400'
      };
    case 'CANCELLED':
      return {
        label: 'ยกเลิก',
        bg: 'bg-red-50 text-red-600 border-red-200',
        dot: 'bg-red-500'
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 text-slate-600 border-slate-300',
        dot: 'bg-slate-400'
      };
  }
};

export interface LatestMonthInfo {
  ym: string;
  year: number;
  month: number;
  thaiYear: number;
  thaiMonthName: string;
  label: string;
  firstDay: string;
  lastDay: string;
}

export const getLatestYearMonthInfo = (docs: { issueDate?: string; date?: string }[] = []): LatestMonthInfo => {
  let maxDate = '';
  for (const d of docs) {
    const dt = d.issueDate || d.date || '';
    if (dt && dt > maxDate) maxDate = dt;
  }
  let y: number;
  let m: number;
  if (maxDate && maxDate.length >= 7) {
    const parts = maxDate.split('-');
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
  } else {
    const now = new Date();
    y = now.getFullYear();
    m = now.getMonth() + 1;
  }
  const ym = `${y}-${String(m).padStart(2, '0')}`;
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const thaiYear = y + 543;
  const thaiMonthName = thaiMonths[m - 1] || '';
  const label = `${thaiMonthName} ${thaiYear}`;
  const firstDay = `${ym}-01`;
  const lastDayDate = new Date(y, m, 0);
  const lastDay = `${ym}-${String(lastDayDate.getDate()).padStart(2, '0')}`;
  return { ym, year: y, month: m, thaiYear, thaiMonthName, label, firstDay, lastDay };
};

export const getProjectName = (doc: any): string => {
  if (!doc) return '-';

  const po = (doc.referencePoNo || '').trim();
  const notes = (doc.notes || '').trim();
  const docNo = (doc.documentNo || '').trim();
  const projNote = (doc.projectNote || '').trim();
  const projName = (doc.projectName || '').trim();
  const allText = `${po} ${notes} ${docNo} ${projNote} ${projName}`.toLowerCase();
  const firstItem = doc.items && doc.items.length > 0 ? (doc.items[0].name || doc.items[0].description || '') : '';
  const itemText = (firstItem + ' ' + (doc.items ? doc.items.map((it: any) => it.name || it.description || '').join(' ') : '')).toLowerCase();

  // 1. PO: 2607001 (Line ADC PLC Board & Data Center Line)
  if (
    po === '2607001' || docNo === 'QT-2607-001' || docNo === 'INV-2608-001' || docNo === 'TAX-2608-001' || docNo === 'DO-2608-001' ||
    allText.includes('2607001') || allText.includes('line adc') || allText.includes('prj-527') || allText.includes('บอร์ดควบคุม plc line adc') ||
    itemText.includes('line adc') || itemText.includes('cj1w-eip21')
  ) {
    return 'โครงการชุดบอร์ดควบคุม PLC Line ADC & Data Center Line';
  }

  // 2. PO: 2605001 (Zone 1-6 Fujipart Thailand)
  if (
    po === '2605001' || po === '2506001' || docNo === 'QT-2605-001' || docNo === 'INV-690600002' || docNo === 'INV-690600003' ||
    allText.includes('2605001') || allText.includes('2506001') || allText.includes('zone 1-6') || allText.includes('fjp-z16') ||
    (itemText.includes('standard and feb part') && !allText.includes('2605002') && !allText.includes('zone 7')) ||
    (allText.includes('รายการ part') && !allText.includes('zone 7'))
  ) {
    return 'โครงการระบบสายการผลิต Zone 1-6 (Fujipart Thailand)';
  }

  // 3. PO: 2605002 (Zone 7 Fujipart Thailand)
  if (
    po === '2605002' || docNo === 'QT-2605-002' || docNo === 'INV-690600001' || docNo === 'INV-690600004' || docNo === 'REC-2605-002/1' ||
    allText.includes('2605002') || allText.includes('zone 7') || allText.includes('fjp-z7') || allText.includes('prj-pnp-z7')
  ) {
    return 'โครงการระบบสายการผลิต Zone 7 (Fujipart Thailand)';
  }

  // 4. PO: 2505004 (Traceability Solenoid Line IMV 5 Stations)
  if (
    po === '2505004' || docNo === 'QT-2505-004' || docNo === 'INV-690800001' ||
    allText.includes('2505004') || allText.includes('imv') || allText.includes('5 stations') || allText.includes('trace-5line') ||
    itemText.includes('corrugating line') || itemText.includes('winding line') || itemText.includes('adhesive & spin') || itemText.includes('df4 line') || itemText.includes('treceability corrugating')
  ) {
    return 'โครงการซอฟต์แวร์ Traceability Solenoid Line IMV & 5 Stations';
  }

  // 5. PO: 2505005 (Traceability Solenoid Line Software & Expansion)
  if (
    po === '2505005' || docNo === 'QT-2505-005' || docNo === 'INV-690600005' || docNo === 'INV-690400001' || docNo.startsWith('REC-2505-005') ||
    allText.includes('2505005') || allText.includes('sol-sw') || allText.includes('expansion') ||
    itemText.includes('solinoid line1') || itemText.includes('sw-trace-001') || itemText.includes('sw-trace-002')
  ) {
    return 'โครงการซอฟต์แวร์ Traceability Solenoid Line Software & Expansion';
  }

  // 6. PO: PO252155 (TSF1 Auto pack LM1 - Thai Sekisui Foam)
  if (
    po === 'PO252155' || po.includes('252155') || docNo === 'QT-2512-2155' || docNo === 'IV-690100001' ||
    allText.includes('po252155') || allText.includes('252155') || allText.includes('tsf1') || allText.includes('sekisui') ||
    allText.includes('auto pack') || allText.includes('auto packing') || allText.includes('cap250095') || allText.includes('prj-107') ||
    itemText.includes('station stacker foam') || itemText.includes('tsf-st-001') || itemText.includes('insert foam')
  ) {
    return 'โครงการเครื่องจักร TSF1 Auto pack LM1 (Thai Sekisui Foam)';
  }

  // 7. PO: 2609002 (Network Infrastructure & Hardware Installation)
  if (
    po === '2609002' || docNo === 'QT-2609-003' || docNo === 'INV-2609-002' ||
    allText.includes('2609002') || allText.includes('convert usb to lan') || allText.includes('net-2609') ||
    itemText.includes('convert usb')
  ) {
    return 'โครงการจัดซื้ออุปกรณ์ Network & งานบริการติดตั้ง';
  }

  // Other Quotations (Pending PO)
  if (docNo === 'QT-2609-001' || allText.includes('new box or') || itemText.includes('or-pcb-01')) {
    return 'โครงการ Service Repair & Maintenance OR Board';
  }
  if (docNo === 'QT-2609-004' || (allText.includes('dashboard data monitor') && (itemText.includes('dell') || itemText.includes('comp-dell')))) {
    return 'งาน Dashboard Data Monitor - Hardware (Kuroda)';
  }
  if (docNo === 'QT-2609-005' || allText.includes('โปรแกรม ระบบ dashboard data monitor') || itemText.includes('srv-dashboard-sw')) {
    return 'งาน Dashboard Data Monitor - Software (Kuroda)';
  }

  // Fallback to explicit projectNote / projectName if custom named
  if (projNote) return projNote;
  if (projName) return projName;

  if (notes.includes('โครงการ:')) {
    const match = notes.match(/โครงการ:\s*([^|]+)/);
    if (match && match[1]) return match[1].trim();
  }
  if (notes.includes('โครงการ')) {
    const match = notes.match(/โครงการ\s*([^|]+)/);
    if (match && match[1]) return match[1].trim();
  }
  if (notes.includes('งาน ')) {
    const match = notes.match(/งาน\s*([^|]+)/);
    if (match && match[1]) return match[1].trim();
  }

  // Fallback to first item name if available
  if (firstItem) {
    return firstItem.length > 35 ? firstItem.substring(0, 35) + '...' : firstItem;
  }

  return 'งานระบบทั่วไป';
};

