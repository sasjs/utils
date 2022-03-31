import validUrl from 'valid-url'
import { ServerType, HttpsAgentOptions } from '.'
import {
  DocConfig,
  AuthConfig,
  AuthConfigSas9,
  BuildConfig,
  DeployConfig,
  JobConfig,
  ServiceConfig,
  StreamConfig,
  TestConfig
} from './config'

const DEFAULT_CONTEXT_NAME = 'SAS Job Execution compute context'
const DEFAULT_SERVER_NAME = 'SASApp'
const DEFAULT_REPOSITORY_NAME = 'Foundation'

export const validateServerType = (serverType: any): ServerType => {
  if (!serverType) {
    throw new Error(
      'Invalid server type: `serverType` cannot be null or undefined.'
    )
  }

  if (
    !(
      serverType === ServerType.Sas9 ||
      serverType === ServerType.SasViya ||
      serverType === ServerType.Sasjs
    )
  ) {
    throw new Error(
      `Invalid server type: Supported values for  \`serverType\` are ${ServerType.SasViya}, ${ServerType.Sas9} and ${ServerType.Sasjs}.`
    )
  }

  return serverType as ServerType
}

export const validateTargetName = (targetName: string): string => {
  if (!targetName) {
    throw new Error(
      'Invalid target name: `name` cannot be empty, null or undefined.'
    )
  }

  if (targetName.trim().includes(' ')) {
    throw new Error('Invalid target name: `name` cannot include spaces.')
  }

  if (!/^[a-zA-Z0-9\-]+$/i.test(targetName)) {
    throw new Error(
      'Invalid target name: `name` can only contain alphanumeric characters and dashes.'
    )
  }

  return targetName
}

export const validateServerUrl = (serverUrl: string): string => {
  if (serverUrl === null || serverUrl === undefined) {
    serverUrl = ''
  }

  if (
    serverUrl !== '' &&
    !validUrl.isHttpUri(serverUrl) &&
    !validUrl.isHttpsUri(serverUrl)
  ) {
    throw new Error(
      'Invalid server URL: `serverUrl` should either be an empty string or a valid URL of the form http(s)://your-server.com(:port).'
    )
  }

  return serverUrl
}

export const validateHttpsAgentOptions = (
  httpsAgentOptions: HttpsAgentOptions
): HttpsAgentOptions | undefined => {
  if (!httpsAgentOptions) return

  if (typeof httpsAgentOptions !== 'object') {
    throw new Error(
      'Invalid value: `httpsAgentOptions` should either be an empty or an object of `HttpsAgentOptions`'
    )
  }

  if (
    httpsAgentOptions.allowInsecureRequests === null ||
    httpsAgentOptions.allowInsecureRequests === undefined
  ) {
    httpsAgentOptions.allowInsecureRequests = false
  } else if (typeof httpsAgentOptions.allowInsecureRequests !== 'boolean') {
    throw new Error(
      'Invalid value: `httpsAgentOptions.allowInsecureRequests` should either be an empty or a boolean'
    )
  }

  if (typeof httpsAgentOptions.caPath !== 'string') {
    httpsAgentOptions.caPath = undefined
  }

  if (typeof httpsAgentOptions.keyPath !== 'string') {
    httpsAgentOptions.keyPath = undefined
  }

  if (typeof httpsAgentOptions.certPath !== 'string') {
    httpsAgentOptions.certPath = undefined
  }

  return httpsAgentOptions
}

export const validateAppLoc = (appLoc: string): string => {
  if (!appLoc) {
    throw new Error(
      'Invalid app location: `appLoc` cannot be empty, null or undefined.'
    )
  }

  if (!appLoc.startsWith('/')) {
    throw new Error('Invalid app location: `appLoc` must start with a `/`.')
  }

  return appLoc
}

export const validateDocConfig = (docConfig: DocConfig): DocConfig => {
  if (!docConfig) {
    docConfig = {}
  }

  if (typeof docConfig.displayMacroCore !== 'boolean') {
    docConfig.displayMacroCore = undefined
  }

  if (typeof docConfig.enableLineage !== 'boolean') {
    docConfig.enableLineage = undefined
  }

  if (typeof docConfig.outDirectory !== 'string') {
    docConfig.outDirectory = undefined
  }

  if (typeof docConfig.dataControllerUrl === 'string') {
    if (
      docConfig.dataControllerUrl !== '' &&
      !validUrl.isHttpUri(docConfig.dataControllerUrl) &&
      !validUrl.isHttpsUri(docConfig.dataControllerUrl)
    ) {
      throw new Error(
        'Invalid Data Controller Url: `dataControllerUrl` should either be an empty string or a valid URL of the form http(s)://your-server.com(:port).'
      )
    }
  } else {
    docConfig.dataControllerUrl = undefined
  }

  return docConfig
}

export const validateAuthConfig = (authConfig: AuthConfig): AuthConfig => {
  if (!authConfig) {
    throw new Error('Invalid auth config: JSON cannot be null or undefined.')
  }

  return authConfig
}

export const validateAuthConfigSas9 = (
  authConfigSas9: AuthConfigSas9
): AuthConfigSas9 => {
  if (!authConfigSas9) {
    throw new Error(
      'Invalid auth config for sas9: JSON cannot be null or undefined.'
    )
  }
  if (!authConfigSas9.userName || !authConfigSas9.password) {
    throw new Error(
      'Invalid auth config for sas9: userName and password can not be empty'
    )
  }

  return authConfigSas9
}

export const validateBuildConfig = (
  buildConfig: BuildConfig,
  defaultName: string
): BuildConfig => {
  if (!buildConfig) {
    throw new Error('Invalid build config: JSON cannot be null or undefined.')
  }
  if (!buildConfig.buildResultsFolder) {
    buildConfig.buildResultsFolder = 'sasjsresults'
  }

  if (!buildConfig.buildOutputFolder) {
    buildConfig.buildOutputFolder = 'sasjsbuild'
  }

  if (!buildConfig.buildOutputFileName) {
    buildConfig.buildOutputFileName = `${defaultName}.sas`
  }

  if (!buildConfig.initProgram) {
    buildConfig.initProgram = ''
  }

  if (!buildConfig.termProgram) {
    buildConfig.termProgram = ''
  }

  if (!buildConfig.macroVars) {
    buildConfig.macroVars = {}
  }

  return buildConfig
}

export const validateServiceConfig = (
  serviceConfig: ServiceConfig
): ServiceConfig => {
  if (!serviceConfig) {
    throw new Error('Invalid service config: JSON cannot be null or undefined.')
  }

  if (!serviceConfig.initProgram) {
    serviceConfig.initProgram = ''
  }

  if (!serviceConfig.termProgram) {
    serviceConfig.termProgram = ''
  }

  if (!serviceConfig.serviceFolders) {
    serviceConfig.serviceFolders = []
  }

  if (!serviceConfig.macroVars) {
    serviceConfig.macroVars = {}
  }

  return serviceConfig
}

export const validateTestConfig = (testConfig: TestConfig): TestConfig => {
  if (!testConfig) {
    throw new Error('Invalid test config: JSON cannot be null or undefined.')
  }

  if (!testConfig.initProgram) testConfig.initProgram = ''
  if (!testConfig.termProgram) testConfig.termProgram = ''
  if (!testConfig.macroVars) testConfig.macroVars = {}
  if (!testConfig.testSetUp) testConfig.testSetUp = ''
  if (!testConfig.testTearDown) testConfig.testTearDown = ''

  return testConfig
}

export const validateJobConfig = (jobConfig: JobConfig): JobConfig => {
  if (!jobConfig) {
    throw new Error('Invalid job config: JSON cannot be null or undefined.')
  }

  if (!jobConfig.initProgram) {
    jobConfig.initProgram = ''
  }

  if (!jobConfig.termProgram) {
    jobConfig.termProgram = ''
  }

  if (!jobConfig.jobFolders) {
    jobConfig.jobFolders = []
  }

  if (!jobConfig.macroVars) {
    jobConfig.macroVars = {}
  }

  return jobConfig
}

export const validateDeployConfig = (
  deployConfig: DeployConfig
): DeployConfig => {
  if (!deployConfig) {
    throw new Error('Invalid deploy config: JSON cannot be null or undefined.')
  }

  deployConfig.deployServicePack = !!deployConfig.deployServicePack

  if (!deployConfig.deployScripts) {
    deployConfig.deployScripts = []
  }

  return deployConfig
}

export const validateStreamConfig = (
  streamConfig: StreamConfig
): StreamConfig => {
  if (!streamConfig) {
    throw new Error('Invalid stream config: JSON cannot be null or undefined.')
  }

  if (streamConfig.streamWeb !== true && streamConfig.streamWeb !== false) {
    throw new Error(
      'Invalid stream config: `streamWeb` cannot be a non-boolean value.'
    )
  }

  if (streamConfig.streamWeb && !streamConfig.streamWebFolder) {
    throw new Error(
      'Invalid stream config: `streamWebFolder` cannot be empty, null or undefined when `streamWeb` is true.'
    )
  }

  if (streamConfig.streamWeb && !streamConfig.webSourcePath) {
    throw new Error(
      'Invalid stream config: `webSourcePath` cannot be empty, null or undefined.'
    )
  }

  if (streamConfig.streamLogo && typeof streamConfig.streamLogo !== 'string') {
    streamConfig.streamLogo = undefined
  }

  if (!streamConfig.assetPaths) {
    streamConfig.assetPaths = []
  }

  if (!streamConfig.streamServiceName) {
    streamConfig.streamServiceName = 'clickme'
  }

  return streamConfig
}

export const validateContextName = (
  contextName: string,
  serverType: ServerType
): string => {
  if (serverType === ServerType.SasViya && !contextName) {
    return DEFAULT_CONTEXT_NAME
  }

  return contextName
}

export const validateServerName = (
  serverName: string,
  serverType: ServerType
): string => {
  if (serverType === ServerType.Sas9 && !serverName) {
    return DEFAULT_SERVER_NAME
  }

  return serverName
}

export const validateRepositoryName = (
  repositoryName: string,
  serverType: ServerType
): string => {
  if (serverType === ServerType.Sas9 && !repositoryName) {
    return DEFAULT_REPOSITORY_NAME
  }

  return repositoryName
}
