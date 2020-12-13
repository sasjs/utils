import {
  BuildConfig,
  DeployConfig,
  ServiceConfig,
  JobConfig,
  StreamConfig
} from './config'
import { ServerType } from './serverType'
import {
  validateTargetName,
  validateServerUrl,
  validateServerType,
  validateAppLoc,
  validateBuildConfig,
  validateDeployConfig,
  validateServiceConfig,
  validateJobConfig,
  validateStreamConfig
} from './targetValidators'

interface TargetInterface {
  name: string
  serverUrl: string
  serverType: ServerType
  appLoc: string
  buildConfig?: BuildConfig
  deployConfig?: DeployConfig
  serviceConfig?: ServiceConfig
  jobConfig?: JobConfig
  streamConfig?: StreamConfig
  macroFolders: string[]
  programFolders: string[]
}

export class Target implements TargetInterface {
  get name(): string {
    return this._name
  }
  private _name = ''

  get serverUrl(): string {
    return this._serverUrl
  }
  private _serverUrl = ''

  get serverType(): ServerType {
    return this._serverType
  }
  private _serverType = ServerType.SasViya

  get appLoc(): string {
    return this._appLoc
  }
  private _appLoc = ''

  get buildConfig(): BuildConfig {
    return this._buildConfig
  }
  private _buildConfig: BuildConfig = {
    macroVars: {},
    initProgram: '',
    termProgram: '',
    buildOutputFileName: ''
  }

  get deployConfig(): DeployConfig {
    return this._deployConfig
  }
  private _deployConfig: DeployConfig = {
    deployServicePack: false,
    deployScripts: []
  }

  get serviceConfig(): ServiceConfig {
    return this._serviceConfig
  }
  private _serviceConfig: ServiceConfig = {
    macroVars: {},
    initProgram: '',
    termProgram: '',
    serviceFolders: []
  }

  get jobConfig(): JobConfig {
    return this._jobConfig
  }
  private _jobConfig: JobConfig = {
    macroVars: {},
    initProgram: '',
    termProgram: '',
    jobFolders: []
  }

  get streamConfig(): StreamConfig {
    return this._streamConfig
  }
  private _streamConfig: StreamConfig = {
    assetPaths: [],
    streamWeb: false,
    streamWebFolder: '',
    webSourcePath: ''
  }

  get macroFolders(): string[] {
    return this._macroFolders
  }
  private _macroFolders: string[] = []

  get programFolders(): string[] {
    return this._programFolders
  }
  private _programFolders: string[] = []

  constructor(json: any) {
    try {
      if (!json) {
        throw new Error('Invalid target: Input JSON is null or undefined.')
      }

      this._name = validateTargetName(json.name)
      this._serverUrl = validateServerUrl(json.serverUrl)
      this._serverType = validateServerType(json.serverType)
      this._appLoc = validateAppLoc(json.appLoc)

      if (json.buildConfig) {
        this._buildConfig = validateBuildConfig(json.buildConfig)
      }

      if (json.deployConfig) {
        this._deployConfig = validateDeployConfig(json.deployConfig)
      }

      if (json.serviceConfig) {
        this._serviceConfig = validateServiceConfig(json.serviceConfig)
      }

      if (json.jobConfig) {
        this._jobConfig = validateJobConfig(json.jobConfig)
      }

      if (json.streamConfig) {
        this._streamConfig = validateStreamConfig(json.streamConfig)
      }

      if (json.macroFolders && json.macroFolders.length) {
        this._macroFolders = json.macroFolders
      }

      if (json.programFolders && json.programFolders.length) {
        this._programFolders = json.programFolders
      }
    } catch (e) {
      throw new Error(`Error parsing target: ${(e as Error).message}`)
    }
  }
}
