import {
  DocConfig,
  BuildConfig,
  DeployConfig,
  ServiceConfig,
  JobConfig,
  StreamConfig,
  AuthConfig
} from './config'
import { ServerType } from './serverType'
import { TargetJson } from './target'

export interface Configuration {
  $schema?: string
  allowInsecureRequests?: boolean
  docConfig?: DocConfig
  buildConfig?: BuildConfig
  deployConfig?: DeployConfig
  serviceConfig?: ServiceConfig
  authConfig?: AuthConfig
  jobConfig?: JobConfig
  streamConfig?: StreamConfig
  macroFolders?: string[]
  programFolders?: string[]
  serverType?: ServerType
  targets?: TargetJson[]
  defaultTarget?: string
}
