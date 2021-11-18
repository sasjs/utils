import { readFile } from '../file'
import { Configuration, SASJsFileType, Target } from '../types'
import { asyncForEach } from '../utils'
import { getDependencyPaths, getInitTerm, getProgramDependencies } from './'

interface loadDependenciesParams {
  filePath?: string
  fileContent: string
  configuration?: Configuration
  target?: Target
  type: SASJsFileType
  programFolders: string[]
  macroFolders: string[]
  buildSourceFolder: string
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
  macroCorePath
}: loadDependenciesParams) => {
  const { init, initPath, term, termPath, startUpVars } = await getInitTerm({
    configuration,
    target,
    type,
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

  const initProgramDependencies = await getProgramDependencies(
    init,
    programFolders,
    initPath
  )
  const termProgramDependencies = await getProgramDependencies(
    term,
    programFolders,
    termPath
  )

  const programDependencies = await getProgramDependencies(
    fileContent,
    programFolders,
    filePath
  )

  const dependenciesContent = await getDependencies(allDependencyPaths)

  fileContent = `* Dependencies start;\n${initProgramDependencies}\n${termProgramDependencies}\n${dependenciesContent}\n* Dependencies end;\n* Programs start;\n${programDependencies}\n*Programs end;${init}${fileContent}${term}`

  fileContent = `* ${type} Variables start;\n${startUpVars}\n*${type} Variables end;\n${fileContent}`

  return fileContent
}

const getDependencies = async (filePaths: string[]): Promise<string> => {
  let dependenciesContent: string[] = []
  await asyncForEach([...new Set(filePaths)], async (filePath) => {
    const depFileContent = await readFile(filePath)
    dependenciesContent.push(depFileContent)
  })

  return dependenciesContent.join('\n')
}
