import validUrl from 'valid-url'
import { ServerType } from '.'
import {
  BuildConfig,
  DeployConfig,
  JobConfig,
  ServiceConfig,
  StreamConfig
} from './config'

export const validateServerType = (serverType: any): ServerType => {
  if (!serverType) {
    throw new Error(
      'Invalid server type: `serverType` cannot be null or undefined.'
    )
  }

  if (!(serverType === ServerType.Sas9 || serverType === ServerType.SasViya)) {
    throw new Error(
      `Invalid server type: Supported values for  \`serverType\` are ${ServerType.SasViya} and ${ServerType.Sas9}.`
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

  if (!/^[a-zA-Z0-9]+$/i.test(targetName)) {
    throw new Error(
      'Invalid target name: `name` can only contain alphanumeric characters.'
    )
  }

  return targetName
}

export const validateServerUrl = (serverUrl: string): string => {
  if (serverUrl === null || serverUrl === undefined) {
    throw new Error(
      'Invalid server URL: `serverUrl` cannot be null or undefined.'
    )
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

export const validateBuildConfig = (
  buildConfig: BuildConfig,
  defaultName: string
): BuildConfig => {
  if (!buildConfig) {
    throw new Error('Invalid build config: JSON cannot be null or undefined.')
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

  if (
    deployConfig.deployServicePack !== true &&
    deployConfig.deployServicePack !== false
  ) {
    throw new Error(
      'Invalid deploy config: `deployServicePack` cannot be a non-boolean value.'
    )
  }

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

  if (!streamConfig.webSourcePath) {
    throw new Error(
      'Invalid stream config: `webSourcePath` cannot be empty, null or undefined.'
    )
  }

  if (!streamConfig.assetPaths) {
    streamConfig.assetPaths = []
  }

  return streamConfig
}
