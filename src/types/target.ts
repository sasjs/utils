import { ServerType } from './serverType'

export interface Config {
  macroVars: { [key: string]: string }
  initProgram: string
  termProgram: string
}

export interface BuildConfig extends Config {
  buildOutputFileName: string
}

export interface DeployConfig {
  deployServicePack: boolean
  deployScripts: string[]
}

export interface ServiceConfig extends Config {
  serviceFolders: string[]
}

export interface JobConfig extends Config {
  jobFolders: string[]
}

export interface StreamConfig {
  assetPaths: string[]
  streamWeb: boolean
  streamWebFolder: string
  webSourcePath: string
}

export interface Target {
  name: string
  serverUrl: string
  serverType: ServerType
  appLoc: string
  buildConfig: BuildConfig
  deployConfig: DeployConfig
  //   deployVars: { [key: string]: string }
  serviceConfig: ServiceConfig
  jobConfig: JobConfig
  streamConfig: StreamConfig
  macroFolders: string[]
  programFolders: string[]
}
