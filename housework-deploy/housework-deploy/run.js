const { execSync } = require('child_process');
const path = require('path');

const npmCmd = '"D:\\Downloads\\Software\\Software Installation\\QClaw\\v0.2.28.587\\resources\\openclaw\\config\\bin\\node\\npm.cmd"';

try {
  console.log('Installing dependencies...');
  const result = execSync(`${npmCmd} install`, {
    cwd: path.join(__dirname),
    stdio: 'inherit',
    timeout: 300000
  });
  console.log('Install complete!');
} catch (e) {
  console.error('Failed:', e.message);
  process.exit(1);
}
