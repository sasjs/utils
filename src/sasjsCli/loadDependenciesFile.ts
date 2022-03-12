import { readFile } from '../file'
import { Configuration, SASJsFileType, Target } from '../types'
import { asyncForEach } from '../utils'
import {
  getDependencyPaths,
  getInitTerm,
  getDependencies,
  DependencyType
} from './'
import { CompileTree } from '../compileTree'

interface LoadDependenciesParams {
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
  compileTree: CompileTree
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
  binaryFolders,
  compileTree
}: LoadDependenciesParams) => {
  const { init, initPath, term, termPath, startUpVars } = await getInitTerm({
    configuration,
    target,
    fileType: type,
    buildSourceFolder,
    compileTree
  })

  fileContent = `\n* ${type} start;\n${fileContent}\n* ${type} end;`

  const fileDependencyPaths = await getDependencyPaths(
    `${fileContent}\n${init}\n${term}`,
    macroFolders,
    macroCorePath,
    compileTree
  )

  const initDependencyPaths = await getDependencyPaths(
    init,
    macroFolders,
    macroCorePath,
    compileTree
  )

  const termDependencyPaths = await getDependencyPaths(
    term,
    macroFolders,
    macroCorePath,
    compileTree
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
    DependencyType.Include,
    compileTree
  )

  const termProgramDependencies = await getDependencies(
    termPath,
    term,
    programFolders,
    DependencyType.Include,
    compileTree
  )

  const programDependencies = await getDependencies(
    filePath,
    fileContent,
    programFolders,
    DependencyType.Include,
    compileTree
  )

  const binariesDeps = await getDependencies(
    filePath,
    fileContent,
    binaryFolders,
    DependencyType.Binary,
    compileTree
  )

  const dependenciesContent = await getAllDependencies(
    allDependencyPaths,
    compileTree
  )

  fileContent = `* SAS Macros start;\n${initProgramDependencies}\n${termProgramDependencies}\n${dependenciesContent}\n* SAS Macros end;\n* SAS Includes start;\n${programDependencies}\n* SAS Includes end;\n* Binary Files start;\n${binariesDeps}\n* Binary Files end;\n
  ${init}${fileContent}${term}`

  fileContent = `* ${type} Variables start;\n${startUpVars}\n* ${type} Variables end;\n${fileContent}`

  return fileContent
}

export const getAllDependencies = async (
  filePaths: string[],
  compileTree?: CompileTree
): Promise<string> => {
  let dependenciesContent: string[] = []
  await asyncForEach([...new Set(filePaths)], async filePath => {
    let depFileContent = ''

    if (compileTree && Object.keys(compileTree).length) {
      const compiledFile = compileTree.getLeaf(filePath)

      if (compiledFile) {
        depFileContent = compiledFile.content
      } else {
        depFileContent = await readFile(filePath)

        compileTree.addLeaf({
          content: depFileContent,
          dependencies: [],
          location: filePath
        })
      }
    } else {
      depFileContent = await readFile(filePath)
    }

    dependenciesContent.push(depFileContent)
  })

  return dependenciesContent.join('\n')
}
