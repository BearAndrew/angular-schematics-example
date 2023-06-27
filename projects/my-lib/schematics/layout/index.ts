import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { Layout } from './schema';

export function modifyHtml(options: Layout): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const filePath = `/src/app/${options.path}/${options.path}.component.html`;
    const fileContent = tree.read(filePath)?.toString('utf-8');

    if (fileContent) {
      // 產生 layout code
      let girdCount = options.type == 'grid' ? `-${options.count}` : ''; // 若為 grid 需在 direction 後加上 count
      let inversDir = options.direction == 'row' ? 'col' : 'row';
      let direction = options.type == 'grid' ? inversDir : options.direction;
      let modifiedContent = `<div class="${options.type} ${options.type}-${direction}${girdCount}">\n`;
      for (let i = 1 ; i <= options.count; i++) {
        modifiedContent += options.direction + '_arg' + i + '\n';
      }
      modifiedContent += '</div>';


      // 判斷是否要在指定字串的位置生成 code
      if (options.replace) {
        modifiedContent = fileContent.replace(options.replace, modifiedContent);
      } else {
        modifiedContent = fileContent + '\n' + modifiedContent;
      }

      tree.overwrite(filePath, modifiedContent);
      context.logger.info(`Modified ${filePath}`);
    } else {
      context.logger.error(`File ${filePath} not found.`);
    }

    return tree;
  };
}
