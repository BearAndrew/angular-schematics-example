const fs = require('fs-extra');
const { execSync } = require('child_process');

// 讀取 config.txt 文件的内容
const fileContent = fs.readFileSync('config.txt', 'utf-8');

// 按行分割文件内容
const commands = fileContent.split('\n');

let dir = '';

// 設定行為：新增或刪除
let action;

// 逐行执行ng指令
commands.some((command, index) => {
  if (index === 0) {
    dir = command;
    action = dir.split(':')[1];
    return !action;
  } else if (command.trim() !== '' && command.startsWith('ng')) {
    execSync(command.trim(), { stdio: 'inherit' });
  }
});

// 讀取檔案
const filePath = 'src/appspec.yml';
const appspecContent = fs.readFileSync(filePath, 'utf8');

// 修改檔案內容
let modifiedContent = appspecContent.replace('/etc/nginx/projects/', '/etc/nginx/projects/' + dir);

// 判斷action是否為false, 是的話代表刪除該用戶資料及nginx設定
if (action) {
  //1.修改delete_user的檔案路徑
  const scriptFilePath = 'src/scripts/delete_user';
  const scriptContent = fs.readFileSync(scriptFilePath, 'utf8');
  const newScriptContent = scriptContent.replace('/etc/nginx/sites-available/', '/etc/nginx/sites-available/' + dir);
  fs.writeFileSync(scriptFilePath, newScriptContent, 'utf8');
  //2.修改appspec.yml 要加入呼叫刪除的script片段
  modifiedContent = modifiedContent.replace('start_server', 'delete_user');
}

// 寫入修改後的內容
fs.writeFileSync(filePath, modifiedContent, 'utf8');
