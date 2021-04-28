export interface Config {
  macroVars: { [key: string]: string }
  initProgram: string
  termProgram: string
}
export interface BuildConfig extends Config {
  buildOutputFileName: string
  buildOutputFolder?: string
  buildResultsFolder?: string
}
export interface ServiceConfig extends Config {
  serviceFolders: string[]
}
export interface JobConfig extends Config {
  jobFolders: string[]
}
export interface DocConfig {
  displayMacroCore?: boolean
  enableLineage?: boolean
  outDirectory?: string
  dataControllerUrl?: string
  doxyContent?: {
    favIcon?: string
    footer?: string
    header?: string
    layout?: string
    logo?: string
    readMe?: string
    stylesheet?: string
    path?: string
  }
}
export interface DeployConfig {
  deployServicePack: boolean
  deployScripts: string[]
}
export interface StreamConfig {
  assetPaths: string[]
  streamWeb: boolean
  streamWebFolder: string
  webSourcePath: string
  streamServiceName: string
}
export interface AuthConfig {
  access_token: string
  refresh_token: string
  client: string
  secret: string
}

export interface TestConfig {
  testFolders: string[]
  testJobFolders: string[]
  testServiceFolders: string[]
  initProgram: string
  termProgram: string
  macroVars: { [key: string]: string }
  testSetUp: string
  testTearDown: string
}
