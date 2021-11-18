import uniqBy from 'lodash.uniqby'
import { getList, validateFileRef, validateProgramsList } from './'

export const getProgramList = (
  fileContent: string
): { fileName: string; fileRef: string }[] => {
  const includesHeader = fileContent.includes('<h4> SAS Includes </h4>')
    ? '<h4> SAS Includes </h4>'
    : '<h4> SAS Programs </h4>'
  const programListName = getList(includesHeader, fileContent)
  const programList = programListName.map((l) => {
    const [fileName, fileRef] = l.split(' ').filter((f: string) => !!f)

    if (!fileName) {
      throw new Error(
        `SAS Program ${fileName} is missing file name. Please specify SAS program dependencies in the format: @li <filename> <fileref>`
      )
    }

    if (fileName && !fileRef) {
      throw new Error(
        `SAS Program ${fileName} is missing fileref. Please specify SAS program dependencies in the format: @li <filename> <fileref>`
      )
    }

    validateFileRef(fileRef)
    return { fileName, fileRef }
  })

  validateProgramsList(programList)

  return uniqBy(programList, 'fileName')
}
