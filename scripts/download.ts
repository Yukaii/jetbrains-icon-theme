/**
 * Download all jetbrains icons to temp folder
 * Downloader logic is extract from https://intellij-icons.jetbrains.design/
 **/
import async from 'async'
import axios from 'axios'
import fs from 'fs-extra'
import * as path from 'path'
import { fetchIconData, getSVGIconPath } from './fileUtils'

const BASE_URL = 'https://intellij-icons.jetbrains.design/'

const instance = axios.create({
  baseURL: BASE_URL,
})

const downloadAllIcons = async () => {
  const data = await fetchIconData()
  
  const iconUrls: string[] = []

  data.forEach((iconSet) => {
    iconSet.icons.forEach(icon => {          
      if (icon.kind !== 'svg') {
        return
      }

      const { normal, dark } = getSVGIconPath(icon)
      
      iconUrls.push(normal)

      if (dark) {
        iconUrls.push(dark)
      }
    })
  })
  
  fs.ensureDirSync(path.join(__dirname, '../temp'))

  await async.eachLimit(iconUrls, 10, async (url) => {
    const response = await instance.get(encodeURI(url), { responseType: 'blob' })
    const dir = path.dirname(url)

    fs.ensureDirSync(path.join(__dirname, '../temp', dir))
    const filepath = path.join(__dirname, '../temp', url)

    fs.writeFileSync(filepath, response.data)
  })
}

downloadAllIcons()

