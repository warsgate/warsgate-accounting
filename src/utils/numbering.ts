import { DocumentType, DocumentNumberingConfig, DocumentNumberSetting } from '../types';

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

export const previewDocumentNo = (setting: DocumentNumberSetting, dateStr?: string): string => {
  const date = dateStr ? new Date(dateStr) : new Date();
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

  const numPart = String(setting.nextNumber || 1).padStart(setting.digits, '0');
  const sep = setting.separator ?? '-';

  if (!datePart) {
    return `${setting.prefix}${sep}${numPart}`;
  }

  return `${setting.prefix}${sep}${datePart}${sep}${numPart}`;
};

export const generateNextDocumentNo = (
  type: DocumentType,
  config: DocumentNumberingConfig,
  issueDate?: string
): string => {
  const setting = config[type] || defaultNumberingConfig[type];
  return previewDocumentNo(setting, issueDate);
};
