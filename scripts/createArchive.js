import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const psScript = path.join(__dirname, 'makeZip.ps1');

try {
  console.log(`[Archive] Invoking PowerShell packaging script: ${psScript}`);
  execSync(`powershell -ExecutionPolicy Bypass -File "${psScript}"`, { stdio: 'inherit' });
} catch (error) {
  console.error('[Archive] Failed to execute makeZip.ps1:', error);
  process.exit(1);
}
