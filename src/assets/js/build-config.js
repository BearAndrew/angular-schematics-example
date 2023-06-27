const fs = require('fs-extra');
const { execSync } = require('child_process');

// 讀取 config.txt 文件的内容
const fileContent = fs.readFileSync('config.txt', 'utf-8');

// 按行分割文件内容
const commands = fileContent.split('\n');

let dir = '';

// 設定行為：新增或刪除
let action;

// 更新nginx config, 將config.txt中的nginx設定複製到assets/default
// 取出設定檔
let start = false;
let nginxDefault = '';
commands.some((command) => {
  if (command.trim() !== '' && command.startsWith('server') || start) {
    start = true;
    nginxDefault += command + '\n';
  }
});

// 讀取appsepc檔案
const defaultFilePath = 'src/assets/default';
fs.writeFileSync(defaultFilePath, nginxDefault, 'utf8');

// 逐行执行ng指令
commands.some((command, index) => {
  if (index === 0) {
    dir = command.split(':')[0];
    action = command.split(':')[1];
    return action === 'false';
  } else if (command.trim() !== '' && command.startsWith('ng')) {
    execSync(command.trim(), { stdio: 'inherit' });
  }
});

// 讀取appsepc檔案
const filePath = 'src/appspec.yml';
const appspecContent = fs.readFileSync(filePath, 'utf8');

// 修改appspec檔案內容
let modifiedContent = appspecContent.replace('/etc/nginx/projects/', '/etc/nginx/projects/' + dir);

// 判斷action是否為false, 是的話代表刪除該用戶資料及nginx設定
if (action === 'false') {
  //1.修改delete_user的檔案路徑
  const scriptFilePath = 'src/scripts/delete_user';
  const scriptContent = fs.readFileSync(scriptFilePath, 'utf8');
  let newScriptContent = scriptContent.replace('/etc/nginx/sites-available/', '/etc/nginx/sites-available/' + dir);
  newScriptContent = newScriptContent.replace('/etc/nginx/projects', '/etc/nginx/projects/' + dir);

  fs.writeFileSync(scriptFilePath, newScriptContent, 'utf8');
  //2.修改appspec.yml 要加入呼叫刪除的script片段
  modifiedContent = modifiedContent.replace('start_server', 'delete_user');
} else {
  //1.修改start_server的檔案路徑
  const scriptFilePath = 'src/scripts/start_server';
  const scriptContent = fs.readFileSync(scriptFilePath, 'utf8');
  const newScriptContent = scriptContent.replace('/etc/nginx/projects', '/etc/nginx/projects/' + dir);

  fs.writeFileSync(scriptFilePath, newScriptContent, 'utf8');
}

// 寫入修改後的內容
fs.writeFileSync(filePath, modifiedContent, 'utf8');
