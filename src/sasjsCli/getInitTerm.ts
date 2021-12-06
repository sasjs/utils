import { readFile, getAbsolutePath } from '../file'
import { Configuration, SASJsFileType, Target } from '../types'
import { chunk } from '../utils'

interface getInitTermParams {
  configuration?: Configuration
  target?: Target
  type: SASJsFileType
  buildSourceFolder: string
}
export const getInitTerm = async ({
  configuration,
  target,
  type,
  buildSourceFolder
}: getInitTermParams) => {
  const { content: init, filePath: initPath } = await getInit({
    target,
    configuration,
    buildSourceFolder,
    type
  })

  const { content: term, filePath: termPath } = await getTerm({
    target,
    configuration,
    buildSourceFolder,
    type
  })

  const startUpVars = getVars(type, target, configuration)

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

interface getInitTermParam {
  configuration?: Configuration
  target?: Target
  buildSourceFolder: string
  type: SASJsFileType
}

export const getInit = async ({
  target,
  configuration,
  buildSourceFolder,
  type
}: getInitTermParam): Promise<{ content: string; filePath: string }> => {
  let initContent = '',
    filePath = ''

  const program =
    type === SASJsFileType.service
      ? target?.serviceConfig?.initProgram ??
        configuration?.serviceConfig?.initProgram
      : type === SASJsFileType.job
      ? target?.jobConfig?.initProgram ?? configuration?.jobConfig?.initProgram
      : type === SASJsFileType.test
      ? target?.testConfig?.initProgram ??
        configuration?.testConfig?.initProgram
      : undefined
  if (program) {
    filePath = getAbsolutePath(program, buildSourceFolder)
    initContent = await readFile(filePath)
  }

  const content = initContent
    ? `\n* ${type}Init start;\n${initContent}\n* ${type}Init end;`
    : ''

  return {
    content,
    filePath
  }
}

export const getTerm = async ({
  target,
  configuration,
  buildSourceFolder,
  type
}: getInitTermParam): Promise<{ content: string; filePath: string }> => {
  let termContent = '',
    filePath = ''

  const program =
    type === SASJsFileType.service
      ? target?.serviceConfig?.termProgram ??
        configuration?.serviceConfig?.termProgram
      : type === SASJsFileType.job
      ? target?.jobConfig?.termProgram ?? configuration?.jobConfig?.termProgram
      : type === SASJsFileType.test
      ? target?.testConfig?.termProgram ??
        configuration?.testConfig?.termProgram
      : undefined
  if (program) {
    filePath = getAbsolutePath(program, buildSourceFolder)
    termContent = await readFile(filePath)
  }

  const content = termContent
    ? `\n* ${type}Term start;\n${termContent}\n* ${type}Term end;`
    : ''

  return {
    content,
    filePath
  }
}
