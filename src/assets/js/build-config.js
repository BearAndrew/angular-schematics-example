const fs = require('fs-extra');
const { execSync } = require('child_process');

// 读取 myfile.txt 文件的内容
const fileContent = fs.readFileSync('config.txt', 'utf-8');

// 按行分割文件内容
const commands = fileContent.split('\n');

let dir = '';

// 逐行执行指令
commands.forEach((command, index) => {
  if (index === 0) {
    dir = command;
  } else if (command.trim() !== '' && command.startsWith('ng')) {
    execSync(command.trim(), { stdio: 'inherit' });
  }
});


// 讀取檔案
const filePath = 'src/appspec.yml';
const appspecContent = fs.readFileSync(filePath, 'utf8');

// 修改檔案內容
const modifiedContent = appspecContent.replace('/etc/nginx', '/etc/nginx/' + dir);

// 寫入修改後的內容
fs.writeFileSync(filePath, modifiedContent, 'utf8');
