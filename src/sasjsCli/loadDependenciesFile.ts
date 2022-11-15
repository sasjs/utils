import { readFile } from '../file'
import { Configuration, SASJsFileType, Target, ServerType } from '../types'
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
  const { init, initPath, term, termPath, startUpVars, initLeaf, termLeaf } =
    await getInitTerm({
      configuration,
      target,
      fileType: type,
      buildSourceFolder,
      compileTree
    })

  if (type !== SASJsFileType.file) {
    fileContent = `\n* ${type} start;\n${fileContent}\n* ${type} end;`
  }

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
    compileTree,
    initLeaf
  )

  const termDependencyPaths = await getDependencyPaths(
    term,
    macroFolders,
    macroCorePath,
    compileTree,
    termLeaf
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

  // There is no need to add any wrapping comments for file content if SASJsFileType===File
  if (type === SASJsFileType.file) {
    fileContent = [
      initProgramDependencies,
      termProgramDependencies,
      dependenciesContent,
      programDependencies,
      binariesDeps,
      fileContent
    ]
      .filter((content: string) => content.length)
      .join('\n')
  } else {
    fileContent = `* SAS Macros start;\n${initProgramDependencies}\n${termProgramDependencies}\n${dependenciesContent}\n* SAS Macros end;\n* SAS Includes start;\n${programDependencies}\n* SAS Includes end;\n* Binary Files start;\n${binariesDeps}\n* Binary Files end;\n
    ${init}${fileContent}${term}`

    fileContent = `* ${type} Variables start;\n${startUpVars}\n* ${type} Variables end;\n${fileContent}`
  }

  if (
    (type === SASJsFileType.service || type === SASJsFileType.test) &&
    target
  ) {
    fileContent = `${await getPreCodeForServicePack(
      target.serverType,
      macroCorePath
    )}\n${fileContent}`
  }

  return fileContent
}

export const getAllDependencies = async (
  filePaths: string[],
  compileTree?: CompileTree
): Promise<string> => {
  let dependenciesContent: string[] = []

  await asyncForEach([...new Set(filePaths)], async (filePath) => {
    let depFileContent = ''

    if (compileTree && Object.keys(compileTree).length) {
      depFileContent = await compileTree.getDepContent(filePath)
    } else {
      depFileContent = await readFile(filePath)
    }

    dependenciesContent.push(depFileContent)
  })

  return dependenciesContent.join('\n')
}

export async function getPreCodeForServicePack(
  serverType: ServerType,
  macroCorePath: string
) {
  let content = ''

  switch (serverType) {
    case ServerType.SasViya:
      content += await readFile(`${macroCorePath}/base/mf_getuser.sas`)
      content += await readFile(`${macroCorePath}/base/mp_jsonout.sas`)
      content += await readFile(`${macroCorePath}/viya/mv_webout.sas`)
      content +=
        '/* if calling viya service with _job param, _program will conflict */\n' +
        '/* so we provide instead as __program */\n' +
        '%global __program _program;\n' +
        '%let _program=%sysfunc(coalescec(&__program,&_program));\n' +
        '%macro webout(action,ds,dslabel=,fmt=,missing=NULL,showmeta=NO,maxobs=MAX);\n' +
        '  %mv_webout(&action,ds=&ds,dslabel=&dslabel,fmt=&fmt\n' +
        '    ,missing=&missing\n' +
        '    ,showmeta=&showmeta\n' +
        '    ,maxobs=&maxobs\n' +
        '  )' +
        '%mend;\n'

      break

    case ServerType.Sas9:
      content += await readFile(`${macroCorePath}/base/mf_getuser.sas`)
      content += await readFile(`${macroCorePath}/base/mp_jsonout.sas`)
      content += await readFile(`${macroCorePath}/meta/mm_webout.sas`)
      content +=
        '  %macro webout(action,ds,dslabel=,fmt=,missing=NULL,showmeta=NO,maxobs=MAX);\n' +
        '    %mm_webout(&action,ds=&ds,dslabel=&dslabel,fmt=&fmt\n' +
        '      ,missing=&missing\n' +
        '      ,showmeta=&showmeta\n' +
        '      ,maxobs=&maxobs\n' +
        '    )' +
        '  %mend;\n'

      break

    case ServerType.Sasjs:
      content += await readFile(`${macroCorePath}/base/mf_getuser.sas`)
      content += await readFile(`${macroCorePath}/base/mp_jsonout.sas`)
      content += await readFile(`${macroCorePath}/server/ms_webout.sas`)

      content +=
        '  %macro webout(action,ds,dslabel=,fmt=,missing=NULL,showmeta=NO,maxobs=MAX);\n' +
        '    %ms_webout(&action,ds=&ds,dslabel=&dslabel,fmt=&fmt\n' +
        '      ,missing=&missing\n' +
        '      ,showmeta=&showmeta\n' +
        '      ,maxobs=&maxobs\n' +
        '    )' +
        '  %mend;\n'

      break
  }

  content +=
    '/* provide additional debug info */\n' +
    '%global _program;\n' +
    '%put &=syscc;\n' +
    '%put user=%mf_getuser();\n' +
    '%put pgm=&_program;\n' +
    '%put timestamp=%sysfunc(datetime(),datetime19.);\n'

  return content
}
