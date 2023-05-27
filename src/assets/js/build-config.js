const fs = require('fs-extra');
const { execSync } = require('child_process');

// 读取 myfile.txt 文件的内容
const fileContent = fs.readFileSync('config.txt', 'utf-8');

// 按行分割文件内容
const commands = fileContent.split('\n');

// 逐行执行指令
commands.forEach((command) => {
  if (command.trim() !== '') {
    execSync(command.trim(), { stdio: 'inherit' });
  }
});
