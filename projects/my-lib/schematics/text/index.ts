import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { Text } from './schema';

export function modifyHtml(options: Text): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const filePath = `/src/app/${options.path}/${options.path}.component.html`;
    const fileContent = tree.read(filePath)?.toString('utf-8');

    if (fileContent) {
      // 產生 layout code
      let modifiedContent = `<${options.tag} class="
      text-[${options.fontsize}] ${' '}
      font-[${options.fontweight}] ${' '}
      font-[${options.fontfamily}] ${' '}
      text-[${options.color}] ${' '}
      text-${options.textalign} ${' '}
      p-[${options.padding}] ${' '}
      m-[${options.margin}] ${' '}
      bg-[${options.backgroundcolor}]">
      ${options.content}
      </${options.tag}>\n`;


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
