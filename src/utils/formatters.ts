// Helper for formatting currency in Thai Baht (THB)
export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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
