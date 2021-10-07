import * as https from 'https'
import {
  DocConfig,
  BuildConfig,
  DeployConfig,
  ServiceConfig,
  JobConfig,
  StreamConfig,
  AuthConfig,
  TestConfig
} from './config'
import { ServerType } from './serverType'
import { TargetJson } from './target'

export interface Configuration {
  $schema?: string
  httpsAgentOptions?: https.AgentOptions
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
  testConfig?: TestConfig
}
