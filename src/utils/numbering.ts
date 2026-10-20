import type { DocumentType, DocumentNumberingConfig, DocumentNumberSetting } from '../types/index.ts';

export const defaultNumberingConfig: DocumentNumberingConfig = {
  QUOTATION: {
    prefix: 'QT',
    dateFormat: 'YYYYMM',
    digits: 3,
    nextNumber: 1,
    separator: '-',
  },
  INVOICE: {
    prefix: 'INV',
    dateFormat: 'YYYYMM',
    digits: 3,
    nextNumber: 1,
    separator: '-',
  },
  TAX_INVOICE: {
    prefix: 'TAX',
    dateFormat: 'YYYYMM',
    digits: 3,
    nextNumber: 1,
    separator: '-',
  },
  RECEIPT: {
    prefix: 'REC',
    dateFormat: 'YYYYMM',
    digits: 3,
    nextNumber: 1,
    separator: '-',
  },
  DELIVERY_ORDER: {
    prefix: 'DO',
    dateFormat: 'YYYYMM',
    digits: 3,
    nextNumber: 1,
    separator: '-',
  },
  PURCHASE_ORDER: {
    prefix: 'PO',
    dateFormat: 'YYYYMM',
    digits: 3,
    nextNumber: 1,
    separator: '-',
  },
  PURCHASE_INVOICE: {
    prefix: 'PINV',
    dateFormat: 'YYYYMM',
    digits: 3,
    nextNumber: 1,
    separator: '-',
  },
  PAYMENT_VOUCHER: {
    prefix: 'PV',
    dateFormat: 'YYYYMM',
    digits: 3,
    nextNumber: 1,
    separator: '-',
  },
  WHT_CERTIFICATE: {
    prefix: 'WHT',
    dateFormat: 'YYYYMM',
    digits: 3,
    nextNumber: 1,
    separator: '-',
  },
};

export const previewDocumentNo = (
  setting: DocumentNumberSetting,
  dateStr?: string,
  existingDocuments?: { documentNo?: string; type?: DocumentType }[]
): string => {
  let date = new Date();
  if (dateStr) {
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      date = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) date = parsed;
    }
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const shortYear = String(year).slice(-2);

  let datePart = '';
  if (setting.dateFormat === 'YYYYMM') {
    datePart = `${year}${month}`;
  } else if (setting.dateFormat === 'YYMM') {
    datePart = `${shortYear}${month}`;
  } else if (setting.dateFormat === 'YYYY') {
    datePart = `${year}`;
  }

  const sep = setting.separator ?? '-';
  const prefixHeader = datePart
    ? `${setting.prefix}${sep}${datePart}${sep}`
    : `${setting.prefix}${sep}`;

  let effectiveNext = setting.nextNumber || 1;

  if (existingDocuments && existingDocuments.length > 0) {
    const existingDocNos = new Set<string>();
    let maxExistingSeq = 0;

    for (const doc of existingDocuments) {
      const docNo = doc.documentNo?.trim();
      if (!docNo) continue;
      existingDocNos.add(docNo);

      if (docNo.startsWith(prefixHeader)) {
        const tail = docNo.slice(prefixHeader.length);
        const match = tail.match(/^(\d+)/);
        if (match) {
          const seq = parseInt(match[1], 10);
          if (!isNaN(seq) && seq > maxExistingSeq) {
            maxExistingSeq = seq;
          }
        }
      }
    }

    if (maxExistingSeq >= effectiveNext) {
      effectiveNext = maxExistingSeq + 1;
    }

    let candidate = `${prefixHeader}${String(effectiveNext).padStart(setting.digits, '0')}`;
    while (existingDocNos.has(candidate)) {
      effectiveNext += 1;
      candidate = `${prefixHeader}${String(effectiveNext).padStart(setting.digits, '0')}`;
    }
    return candidate;
  }

  const numPart = String(effectiveNext).padStart(setting.digits, '0');
  return `${prefixHeader}${numPart}`;
};

export const generateNextDocumentNo = (
  type: DocumentType,
  config: DocumentNumberingConfig,
  issueDate?: string,
  existingDocuments?: { documentNo?: string; type?: DocumentType }[]
): string => {
  const setting = config[type] || defaultNumberingConfig[type];
  return previewDocumentNo(setting, issueDate, existingDocuments);
};
