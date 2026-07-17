import fs from 'fs';
import path from 'path';
import os from 'os';

// Get local IPv4 address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        // Return first wireless or ethernet IP
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const targetIp = getLocalIp();
console.log(`Detected local IP address: ${targetIp}`);

const clientDir = path.resolve('.');
const srcDir = path.join(clientDir, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const fileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.html', '.css'];

walkDir(srcDir, (filePath) => {
  const ext = path.extname(filePath);
  if (!fileExtensions.includes(ext)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Replace localhost:5000 or any other IP:5000 with targetIp:5000
  const regex = /http:\/\/(localhost|192\.168\.\d+\.\d+):5000/g;
  if (regex.test(content)) {
    content = content.replace(regex, `http://${targetIp}:5000`);
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${path.relative(clientDir, filePath)}`);
  }
});

// Also update vite.config.js just in case
const viteConfigPath = path.join(clientDir, 'vite.config.js');
if (fs.existsSync(viteConfigPath)) {
  let content = fs.readFileSync(viteConfigPath, 'utf8');
  const regex = /http:\/\/(localhost|192\.168\.\d+\.\d+):5000/g;
  if (regex.test(content)) {
    content = content.replace(regex, `http://${targetIp}:5000`);
    fs.writeFileSync(viteConfigPath, content, 'utf8');
    console.log(`Updated: vite.config.js`);
  }
}

console.log('IP update complete.');
