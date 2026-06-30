// setup.js - Run via: cmd /c "node setup.js"
// Downloads and extracts Node.js + npm to the project directory
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const { createWriteStream, createReadStream } = require('fs');
const { pipeline } = require('stream').promises;

const WORKDIR = 'C:\\Users\\BoBo\\.qclaw\\workspace-agent-a6eb3e72\\housework-app';

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      pipeline(response, file).then(() => resolve()).catch(reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Downloading Node.js...');
  const zipPath = path.join(WORKDIR, 'node.zip');
  await download('https://nodejs.org/dist/v22.12.0/node-v22.12.0-win-x64.zip', zipPath);
  console.log('Extracting...');
  
  // Use PowerShell to extract (it can handle zip natively)
  const extractCmd = `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${zipPath}', '.')"`;
  execSync(extractCmd, { cwd: WORKDIR });
  fs.unlinkSync(zipPath);
  
  // Find extracted folder
  const items = fs.readdirSync(WORKDIR);
  const nodeDir = items.find(n => n.startsWith('node-v22'));
  console.log('Extracted to:', nodeDir);
  
  // Verify
  const nodeExe = path.join(WORKDIR, nodeDir, 'node.exe');
  const ver = execSync(`"${nodeExe}" --version`, { encoding: 'utf8' });
  console.log('Node version:', ver.trim());
  
  const npmVer = execSync(`"${path.join(WORKDIR, nodeDir, 'npm.cmd')}" --version`, { encoding: 'utf8' });
  console.log('npm version:', npmVer.trim());
  
  console.log('SUCCESS');
}

main().catch(e => { console.error(e); process.exit(1); });
