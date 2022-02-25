import { readFile, fileExists, createFile } from '../file'
import { Configuration, SASJsFileType, Target } from '../types'
import { asyncForEach } from '../utils'
import {
  getDependencyPaths,
  getInitTerm,
  getDependencies,
  DependencyType
} from './'
import path from 'path'
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
  buildDestinationFolder: string
  compileTree: CompileTree
}

// interface CompileTree {
//   [key: string]: { content: string; dependencies: string[]; location: string }
// }

// let compileTree: CompileTree = {}

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
  buildDestinationFolder,
  compileTree
}: LoadDependenciesParams) => {
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

  const dependenciesContent = await getAllDependencies(
    allDependencyPaths,
    compileTree
  )

  fileContent = `* SAS Macros start;\n${initProgramDependencies}\n${termProgramDependencies}\n${dependenciesContent}\n* SAS Macros end;\n* SAS Includes start;\n${programDependencies}\n* SAS Includes end;\n* Binary Files start;\n${binariesDeps}\n* Binary Files end;\n
  ${init}${fileContent}${term}`

  fileContent = `* ${type} Variables start;\n${startUpVars}\n* ${type} Variables end;\n${fileContent}`

  return fileContent
}

const getAllDependencies = async (
  filePaths: string[],
  compileTree?: CompileTree
): Promise<string> => {
  let dependenciesContent: string[] = []
  await asyncForEach([...new Set(filePaths)], async (filePath) => {
    const fileName = filePath.split(path.sep)[
      filePath.split(path.sep).length - 1
    ]
    let depFileContent = ''

    if (compileTree && Object.keys(compileTree).length) {
      const compiledFile = compileTree.getLeave(filePath)

      if (compiledFile) {
        console.log(`🤖[using already compiled]🤖`, compiledFile.location)

        depFileContent = compiledFile.content
      } else {
        console.log(`🤖[reading filePath]🤖`, filePath)

        depFileContent = await readFile(filePath)

        compileTree.addLeave({
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
