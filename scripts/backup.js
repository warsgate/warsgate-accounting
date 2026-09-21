import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

import {
  initialCompanyProfile,
  initialBankAccounts,
  initialContacts,
  initialProducts,
  initialDocuments,
  initialChartOfAccounts,
  initialJournalEntries
} from '../src/data/initialData.ts';
import { defaultNumberingConfig } from '../src/utils/numbering.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const backupsDir = path.resolve(projectRoot, 'backups');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Current date formatted YYYY-MM-DD
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
const timestampIso = `${dateStr}T${timeStr}+07:00`;

// 1. Prepare Full Database Backup Payload
const backupPayload = {
  version: '1.0.0',
  backupDate: timestampIso,
  appName: 'WARSGATE Accounting System',
  metadata: {
    documentsCount: initialDocuments.length,
    contactsCount: initialContacts.length,
    productsCount: initialProducts.length,
    chartOfAccountsCount: initialChartOfAccounts.length,
    journalEntriesCount: initialJournalEntries.length,
    bankAccountsCount: initialBankAccounts.length,
  },
  company: initialCompanyProfile,
  numberingConfig: defaultNumberingConfig,
  bankAccounts: initialBankAccounts,
  contacts: initialContacts,
  products: initialProducts,
  documents: initialDocuments,
  chartOfAccounts: initialChartOfAccounts,
  journalEntries: initialJournalEntries,
};

// 2. Save JSON files
const latestJsonPath = path.join(backupsDir, 'warsgate_backup_latest.json');
const datedJsonPath = path.join(backupsDir, `warsgate_backup_${dateStr}.json`);

fs.writeFileSync(latestJsonPath, JSON.stringify(backupPayload, null, 2), 'utf8');
fs.writeFileSync(datedJsonPath, JSON.stringify(backupPayload, null, 2), 'utf8');

console.log(`✅ [JSON Backup] Created:`);
console.log(`   - ${latestJsonPath}`);
console.log(`   - ${datedJsonPath}`);

// 3. Generate Multi-sheet Excel Backup
const wb = XLSX.utils.book_new();

// Sheet: Company
const companyData = [
  { 'หัวข้อ': 'ชื่อบริษัท (ไทย)', 'ข้อมูล': initialCompanyProfile.name },
  { 'หัวข้อ': 'ชื่อบริษัท (English)', 'ข้อมูล': initialCompanyProfile.nameEn || '' },
  { 'หัวข้อ': 'เลขประจำตัวผู้เสียภาษี', 'ข้อมูล': initialCompanyProfile.taxId },
  { 'หัวข้อ': 'สาขา', 'ข้อมูล': initialCompanyProfile.branchCode },
  { 'หัวข้อ': 'ที่อยู่', 'ข้อมูล': initialCompanyProfile.address },
  { 'หัวข้อ': 'เบอร์โทร', 'ข้อมูล': initialCompanyProfile.phone },
  { 'หัวข้อ': 'อีเมล', 'ข้อมูล': initialCompanyProfile.email },
  { 'หัวข้อ': 'เว็บไซต์', 'ข้อมูล': initialCompanyProfile.website },
  { 'หัวข้อ': 'ผู้มีอำนาจลงนาม', 'ข้อมูล': initialCompanyProfile.authorizedSignatory },
  { 'หัวข้อ': 'ตำแหน่ง', 'ข้อมูล': initialCompanyProfile.signatoryPosition || '' },
];
const wsCompany = XLSX.utils.json_to_sheet(companyData);
XLSX.utils.book_append_sheet(wb, wsCompany, 'Company');

// Sheet: Contacts
const contactsData = initialContacts.map(c => ({
  'ID': c.id,
  'ประเภท': c.type === 'CUSTOMER' ? 'ลูกค้า (Customer)' : 'ซัพพลายเออร์ (Supplier)',
  'ชื่อผู้ติดต่อ': c.name,
  'ชื่อบริษัท/องค์กร': c.companyName,
  'เลขประจำตัวผู้เสียภาษี': c.taxId,
  'สาขา': c.branchCode || 'สำนักงานใหญ่',
  'ที่อยู่': c.address,
  'เบอร์โทรศัพท์': c.phone,
  'อีเมล': c.email,
  'เครดิตเทอม (วัน)': c.creditDays,
  'จำนวนธุรกรรม': c.totalTransactions || 0,
  'ยอดคงค้าง (บาท)': c.balanceDue || 0,
}));
const wsContacts = XLSX.utils.json_to_sheet(contactsData);
XLSX.utils.book_append_sheet(wb, wsContacts, 'Contacts');

// Sheet: Products
const productsData = initialProducts.map(p => ({
  'ID': p.id,
  'รหัสสินค้า': p.code,
  'ชื่อสินค้า/บริการ': p.name,
  'ประเภท': p.type,
  'หมวดหมู่': p.category,
  'หน่วยนับ': p.unit,
  'ราคาขาย (บาท)': p.unitPrice,
  'ราคาทุน (บาท)': p.costPrice || 0,
  'จำนวนคงเหลือ': p.stockQty,
  'จุดเตือนสั่งซื้อ': p.minStockAlert,
  'รายละเอียด': p.description || '',
}));
const wsProducts = XLSX.utils.json_to_sheet(productsData);
XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');

// Sheet: Documents Summary
const docsData = initialDocuments.map(d => ({
  'ID': d.id,
  'ประเภทเอกสาร': d.type,
  'เลขที่เอกสาร': d.documentNo,
  'วันที่ออกเอกสาร': d.issueDate,
  'วันครบกำหนด': d.dueDate || '',
  'ชื่อลูกค้า/ซัพพลายเออร์': d.contactName,
  'เลขประจำตัวผู้เสียภาษี': d.contactTaxId,
  'ที่อยู่คู่ค้า': d.contactAddress,
  'ยอดก่อนภาษี (Subtotal)': d.subtotal,
  'ภาษีมูลค่าเพิ่ม (VAT 7%)': d.vatAmount,
  'ยอดรวมทั้งสิ้น (Grand Total)': d.grandTotal,
  'หัก ณ ที่จ่าย (WHT)': d.whtAmount || 0,
  'ยอดชำระสุทธิ (Net Total)': d.netTotal || d.grandTotal,
  'สถานะ': d.status,
  'เลขอ้างอิง (Ref No)': d.referenceNo || '',
  'หมายเหตุ': d.notes || '',
}));
const wsDocs = XLSX.utils.json_to_sheet(docsData);
XLSX.utils.book_append_sheet(wb, wsDocs, 'Documents');

// Sheet: Document Items Detail
const docItemsData = [];
initialDocuments.forEach(d => {
  (d.items || []).forEach((item, idx) => {
    docItemsData.push({
      'เลขที่เอกสาร': d.documentNo,
      'ประเภทเอกสาร': d.type,
      'วันที่': d.issueDate,
      'ลูกค้า/คู่ค้า': d.contactName,
      'ลำดับที่': idx + 1,
      'รหัสสินค้า': item.productCode || '',
      'ชื่อรายการสินค้า/บริการ': item.description,
      'จำนวน': item.quantity,
      'หน่วย': item.unit || '',
      'ราคาต่อหน่วย': item.unitPrice,
      'ส่วนลด (บาท)': item.discount || 0,
      'จำนวนเงิน (บาท)': item.total,
    });
  });
});
const wsDocItems = XLSX.utils.json_to_sheet(docItemsData);
XLSX.utils.book_append_sheet(wb, wsDocItems, 'Doc_Items');

// Sheet: Chart of Accounts
const coaData = initialChartOfAccounts.map(c => ({
  'รหัสบัญชี': c.code,
  'ชื่อบัญชี': c.name,
  'หมวดบัญชี': c.category,
  'ประเภทเดบิต/เครดิตปกติ': c.normalBalance,
  'คำอธิบาย': c.description || '',
}));
const wsCoa = XLSX.utils.json_to_sheet(coaData);
XLSX.utils.book_append_sheet(wb, wsCoa, 'ChartOfAccounts');

// Sheet: Journal Entries
const jvData = [];
initialJournalEntries.forEach(j => {
  (j.entries || []).forEach((entry, idx) => {
    jvData.push({
      'เลขที่ใบสำคัญ': j.entryNo,
      'วันที่': j.date,
      'คำอธิบายรายการ': j.description,
      'เอกสารอ้างอิง': j.referenceNo || '',
      'ลำดับ': idx + 1,
      'รหัสบัญชี': entry.accountCode,
      'ชื่อบัญชี': entry.accountName,
      'เดบิต (Debit)': entry.debit || 0,
      'เครดิต (Credit)': entry.credit || 0,
    });
  });
});
const wsJv = XLSX.utils.json_to_sheet(jvData);
XLSX.utils.book_append_sheet(wb, wsJv, 'JournalEntries');

// Sheet: Bank Accounts
const bankData = initialBankAccounts.map(b => ({
  'ID': b.id,
  'ธนาคาร': b.bankName,
  'ชื่อบัญชี': b.accountName,
  'เลขที่บัญชี': b.accountNo,
  'สาขา': b.branch,
  'ประเภทบัญชี': b.accountType,
  'ยอดเงินคงเหลือ': b.balance,
  'บัญชีหลัก': b.isDefault ? 'ใช่ (Default)' : 'ไม่ใช่',
}));
const wsBank = XLSX.utils.json_to_sheet(bankData);
XLSX.utils.book_append_sheet(wb, wsBank, 'BankAccounts');

// Save Excel files
const latestExcelPath = path.join(backupsDir, 'warsgate_accounting_backup_latest.xlsx');
const datedExcelPath = path.join(backupsDir, `warsgate_accounting_backup_${dateStr}.xlsx`);

XLSX.writeFile(wb, latestExcelPath);
XLSX.writeFile(wb, datedExcelPath);

console.log(`✅ [Excel Backup] Created:`);
console.log(`   - ${latestExcelPath}`);
console.log(`   - ${datedExcelPath}`);

// 4. Create README in backups directory
const readmeContent = `# WARSGATE Accounting System - Database Backups (สำรองฐานข้อมูล)

ไดเรกทอรีนี้บรรจุไฟล์สำรองฐานข้อมูลทั้งหมดของระบบบัญชี **บริษัท วอร์สเกต จำกัด** 
เพื่อป้องกันการสูญหายของข้อมูลในกรณีที่เกิดเหตุขัดข้องกับเซิร์ฟเวอร์หรือต้องการย้ายเครื่อง

## 📁 ไฟล์สำรองข้อมูลล่าสุด (Latest Backups)

1. **\`warsgate_backup_latest.json\`** (และไฟล์ตามวันที่ \`warsgate_backup_${dateStr}.json\`)
   - ไฟล์ JSON ครบถ้วน 100% รวมเอกสารทั้งหมด, รายการสินค้า, ลูกค้า, ผังบัญชี, เลขที่เอกสารรัน
   - ใช้สำหรับกู้คืนระบบ (Restore) ผ่านทางหน้าเว็บ หรือผ่านสคริปต์อัตโนมัติ

2. **\`warsgate_accounting_backup_latest.xlsx\`** (และไฟล์ตามวันที่ \`warsgate_accounting_backup_${dateStr}.xlsx\`)
   - ไฟล์ Excel สรุปข้อมูลแยก Sheet ชัดเจน ได้แก่:
     - **Company**: ข้อมูลองค์กร และเลขประจำตัวผู้เสียภาษี
     - **Contacts**: รายชื่อลูกค้า / ซัพพลายเออร์ และยอดคงเหลือ
     - **Products**: แคตตาล็อกสินค้า, ราคาขาย, ราคาทุน, สต็อกคงเหลือ
     - **Documents**: สรุปเอกสารบัญชีทุกฉบับ (ใบเสนอราคา, ใบแจ้งหนี้, ใบเสร็จ, ใบส่งของชั่วคราว, ใบสั่งซื้อ ฯลฯ)
     - **Doc_Items**: รายการสินค้าย่อยในเอกสารแต่ละใบ
     - **ChartOfAccounts**: ผังบัญชี 5 หมวด
     - **JournalEntries**: สมุดรายวันทั่วไป
     - **BankAccounts**: บัญชีธนาคาร

## 🚀 คำสั่งสำรองและกู้คืนข้อมูลผ่าน Terminal

- **สำรองข้อมูลทันที**:
  \`\`\`bash
  npm run backup
  \`\`\`
- **ตรวจสอบ / กู้คืนข้อมูล**:
  \`\`\`bash
  npm run restore
  \`\`\`

## 🌐 สำรองและกู้คืนข้อมูลผ่านหน้าเว็บ (Web UI)
ผู้ใช้งานสามารถกดเข้าไปที่เมนู **"ตั้งค่าระบบ (Settings)" -> "สำรอง & กู้คืนข้อมูล (Backup & Restore)"** เพื่อดาวน์โหลดไฟล์ JSON / Excel หรือเลือกอัปโหลดไฟล์ JSON เพื่อกู้คืนข้อมูลได้ทันทีในคลิกเดียว

---
*สร้างอัตโนมัติเมื่อ: ${timestampIso} โดย WARSGATE Accounting Backup Utility*
`;

fs.writeFileSync(path.join(backupsDir, 'README.md'), readmeContent, 'utf8');

console.log(`\n🎉 Backup completed successfully! (${initialDocuments.length} documents, ${initialContacts.length} contacts, ${initialProducts.length} products)`);
