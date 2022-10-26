import path from 'path'
import { isFolder, listFilesInFolder, listSubFoldersInFolder } from '../file'
import {
  getInitialCode,
  getCompiledMacrosCode,
  generateCodeForFileCreation
} from './internal/helper'

export const generateCompileProgram = async (folderPath: string) => {
  const compiledMacrosCode = await getCompiledMacrosCode(['mf_mkdir.sas'])

  const initialProgramContent = getInitialCode()

  const folderCreationCode = await fileAndDirectoryCreationCode(folderPath)

  return compiledMacrosCode + initialProgramContent + folderCreationCode
}

const fileAndDirectoryCreationCode = async (
  resourcePath: string,
  pathRelativeTo: string = resourcePath,
  resultCode: string = ''
) => {
  if (!(await isFolder(resourcePath))) {
    resultCode += await generateCodeForFileCreation(
      resourcePath,
      pathRelativeTo
    )
    return resultCode
  }

  const files = await listFilesInFolder(resourcePath)
  for (const file of files) {
    resultCode = await fileAndDirectoryCreationCode(
      path.join(resourcePath, file),
      pathRelativeTo,
      resultCode
    )
  }

  const subFolders = await listSubFoldersInFolder(resourcePath)
  for (const folder of subFolders) {
    const folderPath = path.join(resourcePath, folder)

    resultCode = `${resultCode}
%mf_mkdir(&fsTarget${folderPath.replace(pathRelativeTo, '')})
`

    resultCode = await fileAndDirectoryCreationCode(
      folderPath,
      pathRelativeTo,
      resultCode
    )
  }

  return resultCode
}
