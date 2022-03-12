import { readFile, getAbsolutePath } from '../file'
import {
  Configuration,
  ServiceConfig,
  JobConfig,
  TestConfig,
  SASJsFileType,
  Target
} from '../types'
import { chunk } from '../utils'
import { capitalizeFirstChar } from '../formatter'
import { CompileTree } from '../compileTree'

export enum ProgramType {
  Init = 'init',
  Term = 'term'
}
interface getInitTermParams {
  configuration?: Configuration
  target?: Target
  fileType: SASJsFileType
  buildSourceFolder: string
  compileTree?: CompileTree
}
export const getInitTerm = async ({
  configuration,
  target,
  fileType,
  buildSourceFolder,
  compileTree
}: getInitTermParams) => {
  const { content: init, filePath: initPath } = await getProgram(
    {
      target,
      configuration,
      buildSourceFolder,
      fileType
    },
    ProgramType.Init,
    compileTree
  )

  const { content: term, filePath: termPath } = await getProgram(
    {
      target,
      configuration,
      buildSourceFolder,
      fileType
    },
    ProgramType.Term,
    compileTree
  )

  const startUpVars = getVars(fileType, target, configuration)

  return {
    init,
    initPath,
    term,
    termPath,
    startUpVars
  }
}

const getVars = (
  varType: SASJsFileType,
  target?: Target,
  configuration?: Configuration
) => {
  const getInternalVars = (config?: Configuration | Target) =>
    varType === SASJsFileType.service
      ? config?.serviceConfig?.macroVars
      : varType === SASJsFileType.job
      ? config?.jobConfig?.macroVars
      : varType === SASJsFileType.test
      ? config?.testConfig?.macroVars
      : {}

  const targetVars = getInternalVars(target)

  const commonServiceVars = getInternalVars(configuration)

  return convertVarsToSasFormat({ ...commonServiceVars, ...targetVars })
}
const convertVarsToSasFormat = (vars: { [key: string]: string }): string => {
  const entries = Object.entries(vars)
  let varsContent = '\n'
  for (const [name, value] of entries) {
    const chunks = chunk(value)
    const chunkedString = chunks.join('%trim(\n)')
    varsContent += `%let ${name}=${chunkedString};\n`
  }

  return varsContent
}

export const getProgram = async (
  { target, configuration, buildSourceFolder, fileType }: getInitTermParams,
  programType: ProgramType,
  compileTree?: CompileTree
): Promise<{ content: string; filePath: string }> => {
  let programContent = '',
    filePath = ''

  let program: string | undefined = undefined
  let targetConfig: ServiceConfig | JobConfig | TestConfig | undefined =
    undefined
  let rootConfig: ServiceConfig | JobConfig | TestConfig | undefined = undefined

  switch (fileType) {
    case SASJsFileType.service:
      targetConfig = target?.serviceConfig
      rootConfig = configuration?.serviceConfig

      break
    case SASJsFileType.job:
      targetConfig = target?.jobConfig
      rootConfig = configuration?.jobConfig

      break
    case SASJsFileType.test:
      targetConfig = target?.testConfig
      rootConfig = configuration?.testConfig

      break
  }

  program =
    (targetConfig &&
      (targetConfig as unknown as { [key: string]: string })[
        `${programType}Program`
      ]) ||
    (rootConfig &&
      (rootConfig as unknown as { [key: string]: string })[
        `${programType}Program`
      ])

  if (program) {
    filePath = getAbsolutePath(program, buildSourceFolder)

    if (compileTree && Object.keys(compileTree).length) {
      programContent = await compileTree.getDepContent(filePath)
    } else {
      programContent = await readFile(filePath)
    }
  }

  const content = programContent
    ? `\n* ${fileType}${capitalizeFirstChar(
        programType
      )} start;\n${programContent}\n* ${fileType}${capitalizeFirstChar(
        programType
      )} end;`
    : ''

  return {
    content,
    filePath
  }
}

export const mockGetProgram = (
  module: {
    getProgram: (param: getInitTermParams, programType: ProgramType) => {}
  },
  fakeInit: string,
  fakeTerm: string
) => {
  jest.spyOn(module, 'getProgram').mockImplementation((params, programType) =>
    programType === ProgramType.Init
      ? Promise.resolve({
          content: `\n* ${params.fileType}Init start;\n${fakeInit}\n* ${params.fileType}Init end;`,
          filePath: ''
        })
      : Promise.resolve({
          content: `\n* ${params.fileType}Term start;\n${fakeTerm}\n* ${params.fileType}Term end;`,
          filePath: ''
        })
  )
}
