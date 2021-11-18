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
  let init, initPath
  let term, termPath

  if (type === SASJsFileType.service) {
    ;({ content: init, filePath: initPath } = await getServiceInit({
      target,
      configuration,
      buildSourceFolder
    }))
    ;({ content: term, filePath: termPath } = await getServiceTerm({
      target,
      configuration,
      buildSourceFolder
    }))
  } else if (type === SASJsFileType.job) {
    ;({ content: init, filePath: initPath } = await getJobInit({
      target,
      configuration,
      buildSourceFolder
    }))
    ;({ content: term, filePath: termPath } = await getJobTerm({
      target,
      configuration,
      buildSourceFolder
    }))
  } else {
    ;({ content: init, filePath: initPath } = await getTestInit({
      target,
      configuration,
      buildSourceFolder
    }))
    ;({ content: term, filePath: termPath } = await getTestTerm({
      target,
      configuration,
      buildSourceFolder
    }))
  }

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
}
export const getServiceInit = async ({
  target,
  configuration,
  buildSourceFolder
}: getInitTermParam): Promise<{ content: string; filePath: string }> => {
  let serviceInitContent = '',
    filePath = ''
  const program =
    target?.serviceConfig?.initProgram ??
    configuration?.serviceConfig?.initProgram
  if (program) {
    filePath = getAbsolutePath(program, buildSourceFolder)
    serviceInitContent = await readFile(filePath)
  }

  const content = serviceInitContent
    ? `\n* ServiceInit start;\n${serviceInitContent}\n* ServiceInit end;`
    : ''

  return {
    content,
    filePath
  }
}

export const getServiceTerm = async ({
  target,
  configuration,
  buildSourceFolder
}: getInitTermParam): Promise<{ content: string; filePath: string }> => {
  let serviceTermContent = '',
    filePath = ''
  const program =
    target?.serviceConfig?.termProgram ??
    configuration?.serviceConfig?.termProgram
  if (program) {
    filePath = getAbsolutePath(program, buildSourceFolder)
    serviceTermContent = await readFile(filePath)
  }

  const content = serviceTermContent
    ? `\n* ServiceTerm start;\n${serviceTermContent}\n* ServiceTerm end;`
    : ''
  return {
    content,
    filePath
  }
}

export const getJobInit = async ({
  target,
  configuration,
  buildSourceFolder
}: getInitTermParam): Promise<{ content: string; filePath: string }> => {
  let jobInitContent = '',
    filePath = ''
  const program =
    target?.jobConfig?.initProgram ?? configuration?.jobConfig?.initProgram
  if (program) {
    filePath = getAbsolutePath(program, buildSourceFolder)
    jobInitContent = await readFile(filePath)
  }

  const content = jobInitContent
    ? `\n* JobInit start;\n${jobInitContent}\n* JobInit end;`
    : ''
  return {
    content,
    filePath
  }
}

export const getJobTerm = async ({
  target,
  configuration,
  buildSourceFolder
}: getInitTermParam): Promise<{ content: string; filePath: string }> => {
  let jobTermContent = '',
    filePath = ''
  const program =
    target?.jobConfig?.termProgram ?? configuration?.jobConfig?.termProgram
  if (program) {
    filePath = getAbsolutePath(program, buildSourceFolder)
    jobTermContent = await readFile(filePath)
  }

  const content = jobTermContent
    ? `\n* JobTerm start;\n${jobTermContent}\n* JobTerm end;`
    : ''
  return {
    content,
    filePath
  }
}

export const getTestInit = async ({
  target,
  configuration,
  buildSourceFolder
}: getInitTermParam): Promise<{ content: string; filePath: string }> => {
  let testInitContent = '',
    filePath = ''
  const program =
    target?.testConfig?.initProgram ?? configuration?.testConfig?.initProgram
  if (program) {
    filePath = getAbsolutePath(program, buildSourceFolder)
    testInitContent = await readFile(filePath)
  }

  const content = testInitContent
    ? `\n* TestInit start;\n${testInitContent}\n* TestInit end;`
    : ''
  return {
    content,
    filePath
  }
}

export const getTestTerm = async ({
  target,
  configuration,
  buildSourceFolder
}: getInitTermParam): Promise<{ content: string; filePath: string }> => {
  let testTermContent = '',
    filePath = ''
  const program =
    target?.testConfig?.termProgram ?? configuration?.testConfig?.termProgram
  if (program) {
    filePath = getAbsolutePath(program, buildSourceFolder)

    testTermContent = await readFile(filePath)
  }

  const content = testTermContent
    ? `\n* TestTerm start;\n${testTermContent}\n* TestTerm end;`
    : ''
  return {
    content,
    filePath
  }
}
