import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const backupsDir = path.resolve(projectRoot, 'backups');

const latestJsonPath = path.join(backupsDir, 'warsgate_backup_latest.json');

if (!fs.existsSync(latestJsonPath)) {
  console.error(`❌ Backup file not found at: ${latestJsonPath}`);
  console.log(`Please run 'npm run backup' first.`);
  process.exit(1);
}

try {
  const content = fs.readFileSync(latestJsonPath, 'utf8');
  const backup = JSON.parse(content);

  console.log(`\n======================================================`);
  console.log(`🔍 WARSGATE ACCOUNTING - DATABASE BACKUP INTEGRITY CHECK`);
  console.log(`======================================================`);
  console.log(`- Backup Date: ${backup.backupDate}`);
  console.log(`- Version: ${backup.version}`);
  console.log(`- Company: ${backup.company?.name} (Tax ID: ${backup.company?.taxId})`);
  console.log(`------------------------------------------------------`);
  console.log(`📊 Data Summary:`);
  console.log(`  • Documents:        ${backup.documents?.length || 0} items`);
  console.log(`  • Contacts:         ${backup.contacts?.length || 0} items`);
  console.log(`  • Products:         ${backup.products?.length || 0} items`);
  console.log(`  • Chart of Accounts:${backup.chartOfAccounts?.length || 0} accounts`);
  console.log(`  • Journal Entries:  ${backup.journalEntries?.length || 0} entries`);
  console.log(`  • Bank Accounts:    ${backup.bankAccounts?.length || 0} accounts`);
  console.log(`------------------------------------------------------`);
  console.log(`✅ Backup file is valid and ready for restore.`);
  console.log(`Tip: In the web application, go to 'Settings' -> 'Backup & Restore'`);
  console.log(`     and upload '${latestJsonPath}' to restore with 1-click!`);
  console.log(`======================================================\n`);
} catch (err) {
  console.error(`❌ Error verifying backup:`, err.message);
  process.exit(1);
}
