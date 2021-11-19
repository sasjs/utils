/**
 * Gets a list of @li items from the supplied file content with the specified header.
 * @param {string} listHeader - the header of the section to look for - e.g. <h4> SAS Macros </h4>.
 * @param {string} fileContent - the text content of the file.
 */
export const getList = (listHeader: string, fileContent: string) => {
  const hasFileHeader = fileContent.split('/**')[0] !== fileContent
  if (!hasFileHeader) return []
  const fileHeader = fileContent.split('/**')[1].split('**/')[0]

  const list = []

  const lines = fileHeader.split('\n').map((s) => (s ? s.trim() : s))
  let startIndex = null
  let endIndex = null
  for (let i = 0; i < lines.length; i++) {
    if (new RegExp(listHeader, 'i').test(lines[i])) {
      startIndex = i + 1
      break
    }
  }

  if (startIndex !== null) {
    for (let i = startIndex; i < lines.length; i++) {
      if (!lines[i]) {
        endIndex = i
        break
      }
    }
    if (endIndex !== null) {
      for (let i = startIndex; i < endIndex; i++) {
        list.push(lines[i])
      }
    }
  }

  return list
    .filter((l) => l.startsWith('@li'))
    .map((d) => d.replace(/\@li/g, ''))
    .map((d) => d.trim())
}
