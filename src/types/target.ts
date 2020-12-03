import { ServerType } from './serverType'

export interface Target {
  name: string
  serverUrl: string
  serverType: ServerType
  appLoc: string
  buildOutputFileName: string
  deployServicePack: boolean
  tgtBuildInit: string
  tgtBuildTerm: string
  tgtBuildVars: { [key: string]: string }
  tgtDeployVars: { [key: string]: string }
  tgtServiceVars: { [key: string]: string }
  tgtDeployScripts: string[]
  tgtMacros: string[]
  tgtServices: string[]
  tgtServiceInit: string
  jobs: string[]
  assetPaths: string[]
  streamWeb: boolean
  streamWebFolder: string
  webSourcePath: string
  programFolders: string[]
}
