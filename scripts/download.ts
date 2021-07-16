/**
 * Download all jetbrains icons to temp folder
 * Downloader logic is extract from https://intellij-icons.jetbrains.design/
 **/
import { downloadImageToTemp, fetchIconData, getSVGIconPath } from './fileUtils'

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
  
  await downloadImageToTemp(iconUrls)
}

downloadAllIcons()

