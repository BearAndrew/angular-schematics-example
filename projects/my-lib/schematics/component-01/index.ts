import {
  Rule, Tree, SchematicsException,
  apply, url, applyTemplates, move,
  chain, mergeWith
} from '@angular-devkit/schematics';

import { strings, normalize, virtualFs, workspaces } from '@angular-devkit/core';
import * as ts from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';
import { Component01 } from './schema';

function createHost(tree: Tree): workspaces.WorkspaceHost {
  return {
    async readFile(path: string): Promise<string> {
      const data = tree.read(path);
      if (!data) {
        throw new SchematicsException('File not found.');
      }
      return virtualFs.fileBufferToString(data);
    },
    async writeFile(path: string, data: string): Promise<void> {
      return tree.overwrite(path, data);
    },
    async isDirectory(path: string): Promise<boolean> {
      return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
    },
    async isFile(path: string): Promise<boolean> {
      return tree.exists(path);
    },
  };
}

function addImportToAppModule(options: Component01): Rule {
  return (tree: Tree) => {
    const text = tree.read('/src/app/app.module.ts') || [];

    const sourceFile = tsquery.ast(text.toString());
    // 跟 Tree 說要更新哪個檔案
    const declarationRecorder = tree.beginUpdate('/src/app/app.module.ts');

    //#region 插入import
    // 先抓到所有的 ImportDeclaration
    const allImports = sourceFile.statements.filter(node => ts.isImportDeclaration(node))! as ts.ImportDeclaration[];
    // 找到最後一個 ImportDeclaration
    let lastImport: ts.Node | undefined;
    for (const importNode of allImports) {
      if (!lastImport || importNode.getStart() > lastImport.getStart()) {
        lastImport = importNode;
      }
    }
    // 準備好要插入的程式碼
    const importStr = `\nimport { ${strings.classify(options.name)}Component } from './${options.name}/${strings.dasherize(options.name)}.component';`;

    // 在最後一個 ImportDeclaration 結束的位置插入程式碼
    declarationRecorder.insertLeft(lastImport!.end, importStr);
    //#endregion

    //#region 插入component
    // 用 Identifier 從 SourceFile 找出較完整的字串內容
    const identifier = tsquery(sourceFile, 'PropertyAssignment[name.name="declarations"] Identifier:last-child')[0] as ts.Identifier;
    const changeText = identifier.getFullText(sourceFile);
    let toInsert = '';
    // 如果原本的字串內容有換行符號
    if (changeText.match(/^\r?\r?\n/)) {

      // 就把換行符號與字串前的空白加到字串裡
      toInsert = `,${changeText.match(/^\r?\n\s*/)![0]}${strings.classify(options.name)}Component`;
    } else {
      toInsert = `, ${strings.classify(options.name)}Component`;
    }
    declarationRecorder.insertLeft(identifier.end, toInsert);
    //#endregion

    // 把變更記錄提交給 Tree ， Tree 會自動幫我們變更
    tree.commitUpdate(declarationRecorder);
    // 重新讀取檔案並印出來看看
    // console.log(tree.read('/src/app/app.module.ts')!.toString());

    return tree;
  };
}

function addImportToAppRoutingModule(options: Component01): Rule {
  return (tree: Tree) => {
    const text = tree.read('/src/app/app-routing.module.ts') || [];

    const sourceFile = tsquery.ast(text.toString());
    // 跟 Tree 說要更新哪個檔案
    const declarationRecorder = tree.beginUpdate('/src/app/app-routing.module.ts');

    //#region 插入import
    // 先抓到所有的 ImportDeclaration
    const importDeclarations = tsquery(sourceFile, 'ImportDeclaration');
    const lastImportDeclaration = importDeclarations[importDeclarations.length - 1] as ts.ImportDeclaration;
    // 準備好要插入的程式碼
    const importStr = `\nimport { ${strings.classify(options.name)}Component } from './${options.name}/${strings.dasherize(options.name)}.component';`;
    // 在最後一個 ImportDeclaration 結束的位置插入程式碼
    declarationRecorder.insertLeft(lastImportDeclaration!.end, importStr);
    //#endregion

    //#region 插入const Routes
    // 用 Identifier 從 SourceFile 找出較完整的字串內容
    const routesArray = tsquery(sourceFile, 'VariableDeclaration[name.name="routes"] ArrayLiteralExpression')[0] as ts.ArrayLiteralExpression;
    if (routesArray && routesArray.elements.length > 0) {
      const lastRoute = routesArray.elements[routesArray.elements.length - 1];
      let toInsert = `{ path:'${options.name}', component: ${strings.classify(options.name)}Component}`;
      // 如果原本的字符串内容有换行符号
      if (lastRoute.getFullText().match(/^\r?\n/)) {
        // 就把换行符号与字符串前的空白加到字符串里
        toInsert = `,${lastRoute.getFullText().match(/^\r?\n\s*/)![0]}` + toInsert;
      } else {
        toInsert = `,` + toInsert;
      }
      declarationRecorder.insertRight(lastRoute.end, toInsert);
    } else {
      const toInsert = `{ path:'${options.name}', component: ${strings.classify(options.name)}Component}`;
      const routesArrayNode = routesArray.getChildren()[1] as ts.Node; // 获取 ArrayLiteralExpression 中的括号内节点
      declarationRecorder.insertLeft(routesArrayNode.end, toInsert);
    }
    //#endregion

    // 把變更記錄提交給 Tree ， Tree 會自動幫我們變更
    tree.commitUpdate(declarationRecorder);

    return tree;
  };
}

export function generate(options: Component01): Rule {
  return async (tree: Tree) => {
    const host = createHost(tree);
    const { workspace } = await workspaces.readWorkspace('/', host);


    const project = (options.project != null) ? workspace.projects.get(options.project) : null;
    if (!project) {
      throw new SchematicsException(`Invalid project name: ${options.project}`);
    }

    // const projectType = project.extensions.projectType === 'application' ? 'app' : 'lib';
    const projectType = 'app';

    if (options.path === undefined) {
      options.path = `${project.sourceRoot}/${projectType}/${options.name}`;
    }

    const templateSource = apply(url('./files'), [
      applyTemplates({
        classify: strings.classify,
        dasherize: strings.dasherize,
        name: options.name
      }),
      move(normalize(options.path as string))
    ]);

    return chain([
      mergeWith(templateSource),
      addImportToAppModule(options),
      addImportToAppRoutingModule(options)
    ]);
  };
}
