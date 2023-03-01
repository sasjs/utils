import {
  DocConfig,
  BuildConfig,
  DeployConfig,
  ServiceConfig,
  JobConfig,
  StreamConfig,
  AuthConfig,
  TestConfig,
  SyncDirectoryMap
} from './config'
import { ServerType } from './serverType'
import { TargetJson } from './target'
import { HttpsAgentOptions } from './httpsAgentOptions'

export interface Configuration {
  $schema?: string
  sasjsBuildFolder?: string
  sasjsResultsFolder?: string
  httpsAgentOptions?: HttpsAgentOptions
  docConfig?: DocConfig
  buildConfig?: BuildConfig
  deployConfig?: DeployConfig
  serviceConfig?: ServiceConfig
  authConfig?: AuthConfig
  jobConfig?: JobConfig
  streamConfig?: StreamConfig
  macroFolders?: string[]
  programFolders?: string[]
  binaryFolders?: string[]
  serverType?: ServerType
  targets?: TargetJson[]
  defaultTarget?: string
  testConfig?: TestConfig
  syncFolder?: string
  syncDirectories?: SyncDirectoryMap[]
}
