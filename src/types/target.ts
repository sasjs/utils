import {
  DocConfig,
  AuthConfig,
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
  validateDocConfig,
  validateAppLoc,
  validateBuildConfig,
  validateDeployConfig,
  validateServiceConfig,
  validateJobConfig,
  validateStreamConfig,
  validateContextName,
  validateServerName,
  validateRepositoryName,
  validateAuthConfig
} from './targetValidators'

interface TargetInterface {
  name: string
  serverUrl: string
  serverType: ServerType
  contextName?: string
  serverName?: string
  repositoryName?: string
  appLoc: string
  docConfig?: DocConfig
  authConfig?: AuthConfig
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
  private _name

  get serverUrl(): string {
    return this._serverUrl
  }
  private _serverUrl

  get serverType(): ServerType {
    return this._serverType
  }
  private _serverType = ServerType.SasViya

  get appLoc(): string {
    return this._appLoc
  }
  private _appLoc

  get docConfig(): DocConfig | undefined {
    return this._docConfig
  }
  private _docConfig: DocConfig | undefined

  get authConfig(): AuthConfig | undefined {
    return this._authConfig
  }
  private _authConfig: AuthConfig | undefined

  get buildConfig(): BuildConfig | undefined {
    return this._buildConfig
  }
  private _buildConfig: BuildConfig | undefined

  get deployConfig(): DeployConfig | undefined {
    return this._deployConfig
  }
  private _deployConfig: DeployConfig | undefined

  get serviceConfig(): ServiceConfig | undefined {
    return this._serviceConfig
  }
  private _serviceConfig: ServiceConfig | undefined

  get jobConfig(): JobConfig | undefined {
    return this._jobConfig
  }
  private _jobConfig: JobConfig | undefined

  get streamConfig(): StreamConfig | undefined {
    return this._streamConfig
  }
  private _streamConfig: StreamConfig | undefined

  get macroFolders(): string[] {
    return this._macroFolders
  }
  private _macroFolders: string[] = []

  get programFolders(): string[] {
    return this._programFolders
  }
  private _programFolders: string[] = []

  get contextName(): string {
    return this._contextName
  }
  private _contextName: string

  get serverName(): string {
    return this._serverName
  }
  private _serverName: string

  get repositoryName(): string {
    return this._repositoryName
  }
  private _repositoryName: string

  constructor(json: any) {
    try {
      if (!json) {
        throw new Error('Invalid target: Input JSON is null or undefined.')
      }

      this._name = validateTargetName(json.name)
      this._serverUrl = validateServerUrl(json.serverUrl)
      this._serverType = validateServerType(json.serverType)
      this._appLoc = validateAppLoc(json.appLoc)
      this._contextName = validateContextName(
        json.contextName,
        this._serverType
      )
      this._serverName = validateServerName(json.serverName, this._serverType)
      this._repositoryName = validateRepositoryName(
        json.repositoryName,
        this._serverType
      )

      if (json.docConfig) {
        this._docConfig = validateDocConfig(json.docConfig)
      }

      if (json.authConfig) {
        this._authConfig = validateAuthConfig(json.authConfig)
      }

      if (json.buildConfig) {
        this._buildConfig = validateBuildConfig(json.buildConfig, this._name)
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

  toJson(): TargetInterface {
    const json: TargetInterface = {
      name: this.name,
      serverUrl: this.serverUrl,
      serverType: this.serverType,
      appLoc: this.appLoc,
      macroFolders: this.macroFolders,
      programFolders: this.programFolders,
      docConfig: this.docConfig || {
        displayMacroCore: true,
        outDirectory: '',
        dataControllerUrl: ''
      },
      authConfig: this.authConfig || {
        access_token: '',
        refresh_token: '',
        client: '',
        secret: ''
      },
      buildConfig: this.buildConfig || {
        initProgram: '',
        termProgram: '',
        buildOutputFileName: `${this.name}.sas`,
        macroVars: {}
      },
      jobConfig: this.jobConfig || {
        jobFolders: [],
        initProgram: '',
        termProgram: '',
        macroVars: {}
      },
      serviceConfig: this.serviceConfig || {
        serviceFolders: [],
        initProgram: '',
        termProgram: '',
        macroVars: {}
      },
      streamConfig: this.streamConfig || {
        streamWebFolder: '',
        streamWeb: false,
        webSourcePath: '',
        assetPaths: []
      },
      deployConfig: this.deployConfig || {
        deployScripts: [],
        deployServicePack: false
      }
    }

    if (this.serverType === ServerType.SasViya) {
      json.contextName = this.contextName
    } else {
      json.serverName = this.serverName
      json.repositoryName = this.repositoryName
    }

    return json
  }
}
