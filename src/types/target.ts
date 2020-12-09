import { ServerType } from './serverType'

export interface AuthInfo {
  access_token: string
  refresh_token: string
  client: string
  secret: string
}

export interface Target {
  name: string
  serverUrl: string
  serverType: ServerType
  appLoc: string
  useComputeApi?: boolean
  contextName?: string
  authInfo?: AuthInfo
  buildOutputFileName?: string
  deployServicePack?: boolean
  tgtBuildInit?: string
  tgtBuildTerm?: string
  tgtBuildVars?: { [key: string]: string }
  tgtDeployVars?: { [key: string]: string }
  tgtServiceVars?: { [key: string]: string }
  tgtDeployScripts?: string[]
  tgtMacros?: string[]
  tgtServices?: string[]
  tgtServiceInit?: string
  tgtServiceTerm?: string
  jobs?: string[]
  jobInit?: string
  jobTerm?: string
  assetPaths?: string[]
  streamWeb?: boolean
  streamWebFolder?: string
  webSourcePath?: string
  programFolders?: string[]
}