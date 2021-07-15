import axios from 'axios'
import fs from 'fs-extra'
import * as path from 'path'

const BASE_URL = 'https://intellij-icons.jetbrains.design/'

function iconPath(set: string, section: string) { return `icons/${set}/${section}` }

const instance = axios.create({
  baseURL: BASE_URL,
})

export type JBIconSet = {
  set: string;
  areas: string[];
  sections: string[];
  icons: JBIcon[]
}
  
export type JBIcon = {
  name: string;
  set: string;
  area: string;
  section: string;
  variants: number,
  dark: boolean;
  hiDPI: boolean;
  sizes: [number, number][]; 
  kind: 'svg' | 'png';
  java: string;
}

export const fetchIconData: () => Promise<JBIconSet[]> = async () => {
  const dataPath = path.join(__dirname, '../temp/data.json')
  if (fs.existsSync(dataPath)) {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  }

  return instance.get('/data.json').then(response => {
    fs.writeFileSync(dataPath, response.data)
    return response.data
  })
}

export const getSVGIconPath = (icon: JBIcon) => {
  let { name, section, dark, kind, set } = icon

  const darkStr = '_dark'
  if (section !== '') {
    section += '/'
  }

  const normal = `${iconPath(set, section)}${name}.${kind}`

  if (dark) {
    const dark = `${iconPath(set, section)}${name}${darkStr}.${kind}`
    return {
      normal,
      dark,
    }
  } else {
    return {
      normal,
      dark: null,
    }
  }
}

let icons: JBIcon[] | undefined
export const getSVGIconPathFromJavaAttr = async (javaAttr: string, variant = 'normal') => {
  if (!icons) {
    const data = await fetchIconData()
    icons = data.reduce((acc, iconSet) => {
      return acc.concat(iconSet.icons)
    }, [] as JBIcon[])
  }

  const icon = icons.find(icon => icon.java === javaAttr)
  if (!icon) {
    return null
  }

  const { normal, dark } = getSVGIconPath(icon)
  if (variant === 'normal') {
    return normal
  } else if (variant === 'dark') {
    return dark
  } else {
    return null
  } 
}
