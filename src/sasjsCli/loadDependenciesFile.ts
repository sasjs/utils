import { readFile } from '../file'
import { Configuration, SASJsFileType, Target } from '../types'
import { asyncForEach } from '../utils'
import {
  getDependencyPaths,
  getInitTerm,
  getDependencies,
  DependencyType
} from './'

interface loadDependenciesParams {
  filePath?: string
  fileContent: string
  configuration?: Configuration
  target?: Target
  type: SASJsFileType
  programFolders: string[]
  macroFolders: string[]
  buildSourceFolder: string
  binaryFolders: string[]
  macroCorePath: string
}

export const loadDependenciesFile = async ({
  filePath,
  fileContent,
  configuration,
  target,
  type,
  programFolders,
  macroFolders,
  buildSourceFolder,
  macroCorePath,
  binaryFolders
}: loadDependenciesParams) => {
  const { init, initPath, term, termPath, startUpVars } = await getInitTerm({
    configuration,
    target,
    fileType: type,
    buildSourceFolder
  })

  fileContent = `\n* ${type} start;\n${fileContent}\n* ${type} end;`

  const fileDependencyPaths = await getDependencyPaths(
    `${fileContent}\n${init}\n${term}`,
    macroFolders,
    macroCorePath
  )

  const initDependencyPaths = await getDependencyPaths(
    init,
    macroFolders,
    macroCorePath
  )

  const termDependencyPaths = await getDependencyPaths(
    term,
    macroFolders,
    macroCorePath
  )

  const allDependencyPaths = [
    ...initDependencyPaths,
    ...fileDependencyPaths,
    ...termDependencyPaths
  ]

  const initProgramDependencies = await getDependencies(
    initPath,
    init,
    programFolders,
    DependencyType.Include
  )

  const termProgramDependencies = await getDependencies(
    termPath,
    term,
    programFolders,
    DependencyType.Include
  )

  const programDependencies = await getDependencies(
    filePath,
    fileContent,
    programFolders,
    DependencyType.Include
  )

  const binariesDeps = await getDependencies(
    filePath,
    fileContent,
    binaryFolders,
    DependencyType.Binary
  )

  const dependenciesContent = await getAllDependencies(allDependencyPaths)

  fileContent = `* SAS Macros start;\n${initProgramDependencies}\n${termProgramDependencies}\n${dependenciesContent}\n* SAS Macros end;\n* SAS Includes start;\n${programDependencies}\n* SAS Includes end;\n* Binary Files start;\n${binariesDeps}\n* Binary Files end;\n
  ${init}${fileContent}${term}`

  fileContent = `* ${type} Variables start;\n${startUpVars}\n* ${type} Variables end;\n${fileContent}`

  return fileContent
}

const getAllDependencies = async (filePaths: string[]): Promise<string> => {
  let dependenciesContent: string[] = []
  await asyncForEach([...new Set(filePaths)], async (filePath) => {
    const depFileContent = await readFile(filePath)
    dependenciesContent.push(depFileContent)
  })

  return dependenciesContent.join('\n')
}
