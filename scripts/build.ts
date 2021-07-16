import { execSync } from 'child_process'
import fs from 'fs-extra'
import * as path from 'path'
import async from 'async'
import pkg from '../package.json'
import { sets } from './sets'
// @ts-ignore
import gen from 'webfonts-generator'
import { downloadImageToTemp, getSVGIconPathFromJavaAttr } from './fileUtils'

const e = (cmd: string) => execSync(cmd, { stdio: 'inherit' })

;(async () => {
  for (const set of sets) {
    const START_CODEPOINT = 0xe000
  
    const name = set.name
    const displayName = set.display
  
    fs.removeSync('builtIcons')
    fs.ensureDirSync('temp/dist')
    fs.ensureDirSync('temp/builtIcons')
    fs.ensureDirSync(`build/${name}`)
    fs.emptyDirSync(`build/${name}`)
    
    // download all icons
    const iconUrls = (await async.map(Object.entries(set.icons), async ([, v]) => {
      const url = await getSVGIconPathFromJavaAttr(v)
      if (!url) { throw url }
      return url
    })).filter(Boolean) as string[]
    
    await downloadImageToTemp(iconUrls)
  
    const icons = await async.map(Object.entries(set.icons), async ([k, v]) => {
      k = k.replace('codicon:', '')
      
      const svgIconPath = path.join(__dirname, '../temp', await getSVGIconPathFromJavaAttr(v) as string)
      const targetPath = path.join(__dirname, `../temp/builtIcons/${k}.svg`)
  
      fs.copyFileSync(svgIconPath!, targetPath)
  
      return k
    })
  
    e('npx svgo -f temp/builtIcons/ --config svgo-config.yml')
  
    gen(
      {
        files: icons.map((i) => `./temp/builtIcons/${i}.svg`),
        dest: `./temp/dist`,
        types: ['woff'],
        fontName: name,
        css: false,
        html: true,
        startCodepoint: START_CODEPOINT,
        fontHeight: 1000,
        normalize: true,
      },
      (error: any) => {
        if (error) {
          console.log('Font creation failed.', error)
          process.exit(1)
        }
  
        fs.copyFileSync(`./temp/dist/${name}.woff`, `build/${name}/${name}.woff`)
      }
    )
  
    fs.writeJSONSync(
      `build/${name}/${name}.json`,
      {
        fonts: [
          {
            id: name,
            src: [
              {
                path: `./${name}.woff`,
                format: 'woff',
              },
            ],
            weight: 'normal',
            style: 'normal',
          },
        ],
  
        iconDefinitions: Object.fromEntries(icons.map((i, idx) => [i, { fontCharacter: formatUnicode(START_CODEPOINT + idx) }])),
      },
      { spaces: 2 }
    )
  
    fs.writeJSONSync(
      `build/${name}/package.json`,
      {
        name: name,
        publisher: 'antfu',
        version: pkg.version,
        displayName: `${displayName} Product Icons`,
        description: `${displayName} Product Icons for VS Code`,
        icon: 'icon.png',
        categories: ['Themes'],
        engines: {
          vscode: pkg.engines.vscode,
        },
        license: 'MIT',
        keywords: ['icon', 'theme', 'product', 'product-icon-theme'],
        extensionKind: ['ui'],
        contributes: {
          productIconThemes: [
            {
              id: name,
              label: `${displayName} Icons`,
              path: `./${name}.json`,
            },
          ],
        },
        repository: {
          type: 'git',
          url: 'https://github.com/antfu/vscode-icons-carbon.git',
        },
        bugs: {
          url: 'https://github.com/antfu/vscode-icons-carbon/issues',
        },
        author: {
          name: 'Yukai Huang',
        },
      },
      { spaces: 2 }
    )
  
    fs.copySync('README.md', `build/${name}/README.md`)
    fs.copySync('icon.png', `build/${name}/icon.png`)
  }
})();


function formatUnicode(unicode: number) {
  return '\\' + unicode.toString(16)
}
