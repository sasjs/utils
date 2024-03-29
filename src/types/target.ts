import {
  DocConfig,
  AuthConfig,
  AuthConfigSas9,
  BuildConfig,
  DeployConfig,
  ServiceConfig,
  JobConfig,
  StreamConfig,
  TestConfig,
  SyncDirectoryMap,
  ConfigTypes
} from './config'
import { ServerType } from './serverType'
import { HttpsAgentOptions } from './httpsAgentOptions'
import {
  validateTargetName,
  validateServerUrl,
  validateServerType,
  validateDocConfig,
  validateHttpsAgentOptions,
  validateAppLoc,
  validateBuildConfig,
  validateDeployConfig,
  validateServiceConfig,
  validateJobConfig,
  validateStreamConfig,
  validateContextName,
  validateServerName,
  validateRepositoryName,
  validateAuthConfig,
  validateAuthConfigSas9,
  validateTestConfig,
  validateSyncFolder,
  validateSyncDirectories,
  validateSasjsBuildFolder,
  validateSasjsResultsFolder,
  DEFAULT_SASJS_BUILD_FOLDER,
  DEFAULT_SASJS_RESULTS_FOLDER
} from './targetValidators'
import { Configuration } from '../types/configuration'

export interface TargetJson {
  name: string
  serverUrl: string
  serverType: ServerType
  httpsAgentOptions?: HttpsAgentOptions
  contextName?: string
  serverName?: string
  repositoryName?: string
  appLoc: string
  docConfig?: DocConfig
  authConfig?: AuthConfig
  authConfigSas9?: AuthConfigSas9
  buildConfig?: BuildConfig
  deployConfig?: DeployConfig
  serviceConfig?: ServiceConfig
  jobConfig?: JobConfig
  streamConfig?: StreamConfig
  macroFolders?: string[]
  programFolders?: string[]
  binaryFolders?: string[]
  isDefault?: boolean
  testConfig?: TestConfig
  syncDirectories?: SyncDirectoryMap[]
  sasjsBuildFolder?: string
  sasjsResultsFolder?: string
}

export class Target implements TargetJson {
  private _config

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

  get httpsAgentOptions(): HttpsAgentOptions | undefined {
    return this._httpsAgentOptions
  }
  private _httpsAgentOptions

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

  get authConfigSas9(): AuthConfigSas9 | undefined {
    return this._authConfigSas9
  }
  private _authConfigSas9: AuthConfigSas9 | undefined

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

  get macroFolders(): string[] | undefined {
    return this._macroFolders
  }
  private _macroFolders: string[] | undefined

  get programFolders(): string[] | undefined {
    return this._programFolders
  }
  private _programFolders: string[] | undefined

  get binaryFolders(): string[] | undefined {
    return this._binaryFolders
  }
  private _binaryFolders: string[] | undefined

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

  get testConfig(): TestConfig | undefined {
    return this._testConfig
  }
  private _testConfig: TestConfig | undefined

  get syncFolder(): string | undefined {
    return this._syncFolder
  }
  private _syncFolder: string | undefined

  get syncDirectories(): SyncDirectoryMap[] | undefined {
    return this._syncDirectories
  }
  private _syncDirectories: SyncDirectoryMap[] | undefined

  get sasjsBuildFolder(): string | undefined {
    return this._sasjsBuildFolder
  }
  private _sasjsBuildFolder: string | undefined

  get sasjsResultsFolder(): string | undefined {
    return this._sasjsResultsFolder
  }
  private _sasjsResultsFolder: string | undefined

  constructor(json: any, config: Configuration = {}) {
    try {
      if (!json) {
        throw new Error('Invalid target: Input JSON is null or undefined.')
      }

      this._config = config
      this._name = validateTargetName(json.name)
      this._serverUrl = validateServerUrl(json.serverUrl)
      this._serverType = validateServerType(json.serverType)
      this._httpsAgentOptions = validateHttpsAgentOptions(
        json.httpsAgentOptions
      )
      this._appLoc = validateAppLoc(json.appLoc)
      this._contextName = validateContextName(
        json.contextName,
        this._serverType
      )
      this._serverName = validateServerName(json.serverName, this._serverType)
      this._syncFolder = validateSyncFolder(json.syncFolder)
      this._repositoryName = validateRepositoryName(
        json.repositoryName,
        this._serverType
      )

      if (json.docConfig) {
        this._docConfig = validateDocConfig(
          this.getConfig(ConfigTypes.Doc, json)
        )
      }

      if (json.authConfig) {
        this._authConfig = validateAuthConfig(
          this.getConfig(ConfigTypes.Auth, json)
        )
      }

      if (json.authConfigSas9) {
        this._authConfigSas9 = validateAuthConfigSas9(json.authConfigSas9)
      }

      if (json.buildConfig) {
        this._buildConfig = validateBuildConfig(
          this.getConfig(ConfigTypes.Build, json),
          this._name
        )
      }

      if (json.deployConfig) {
        this._deployConfig = validateDeployConfig(
          this.getConfig(ConfigTypes.Deploy, json)
        )
      } else {
        this._deployConfig = validateDeployConfig({
          deployServicePack: true,
          deployScripts: []
        })
      }

      if (json.serviceConfig) {
        this._serviceConfig = validateServiceConfig(
          this.getConfig(ConfigTypes.Service, json)
        )
      }

      if (json.jobConfig) {
        this._jobConfig = validateJobConfig(
          this.getConfig(ConfigTypes.Job, json)
        )
      }

      if (json.streamConfig) {
        this._streamConfig = validateStreamConfig(
          this.getConfig(ConfigTypes.Stream, json)
        )
      }

      if (json.testConfig) {
        this._testConfig = validateTestConfig(
          this.getConfig(ConfigTypes.Test, json)
        )
      }

      if (json.macroFolders && json.macroFolders.length) {
        this._macroFolders = json.macroFolders
      }

      if (json.programFolders && json.programFolders.length) {
        this._programFolders = json.programFolders
      }

      if (json.binaryFolders && json.binaryFolders.length) {
        this._binaryFolders = json.binaryFolders
      }

      if (json.syncDirectories && json.syncDirectories.length) {
        this._syncDirectories = validateSyncDirectories(json.syncDirectories)
      }

      if (json.sasjsBuildFolder) {
        this._sasjsBuildFolder = validateSasjsBuildFolder(json.sasjsBuildFolder)
      }

      if (json.sasjsResultsFolder) {
        this._sasjsResultsFolder = validateSasjsResultsFolder(
          json.sasjsResultsFolder
        )
      }
    } catch (e) {
      throw new Error(`Error parsing target: ${(e as Error).message}`)
    }
  }

  private getConfig = (key: ConfigTypes, json: { [key: string]: any }) => {
    const config = this._config[key] || {}

    return {
      ...config,
      ...json[key]
    }
  }

  toJson(withDefaults: boolean = true): TargetJson {
    const json: TargetJson = {
      name: this.name,
      serverUrl: this.serverUrl,
      serverType: this.serverType,
      httpsAgentOptions: this.httpsAgentOptions,
      appLoc: this.appLoc,
      docConfig: this.docConfig,
      deployConfig: this.deployConfig
    }

    if (this.macroFolders?.length) json.macroFolders = this.macroFolders

    if (this.programFolders?.length) json.programFolders = this.programFolders

    if (this.binaryFolders?.length) json.binaryFolders = this.binaryFolders

    if (this.authConfig) {
      json.authConfig = this.authConfig
    }

    if (this.authConfigSas9) {
      json.authConfigSas9 = this.authConfigSas9
    }

    if (this.sasjsBuildFolder) {
      json.sasjsBuildFolder = this.sasjsBuildFolder
    } else if (withDefaults) {
      json.sasjsBuildFolder = DEFAULT_SASJS_BUILD_FOLDER
    }

    if (this.sasjsResultsFolder) {
      json.sasjsResultsFolder = this.sasjsResultsFolder
    } else if (withDefaults) {
      json.sasjsResultsFolder = DEFAULT_SASJS_RESULTS_FOLDER
    }

    if (this.syncDirectories) {
      json.syncDirectories = this.syncDirectories
    } else if (withDefaults) {
      json.syncDirectories = []
    }

    if (this.buildConfig) {
      json.buildConfig = this.buildConfig
    } else if (withDefaults)
      json.buildConfig = {
        initProgram: '',
        termProgram: '',
        buildOutputFileName: `${this.name}.sas`,
        macroVars: {}
      }

    if (this.jobConfig) {
      json.jobConfig = this.jobConfig
    } else if (withDefaults)
      json.jobConfig = {
        jobFolders: [],
        initProgram: '',
        termProgram: '',
        macroVars: {}
      }

    if (this.serviceConfig) {
      json.serviceConfig = this.serviceConfig
    } else if (withDefaults)
      json.serviceConfig = {
        serviceFolders: [],
        initProgram: '',
        termProgram: '',
        macroVars: {}
      }

    if (this.streamConfig) {
      json.streamConfig = this.streamConfig
    } else if (withDefaults)
      json.streamConfig = {
        streamWebFolder: '',
        streamWeb: false,
        webSourcePath: '',
        streamServiceName: '',
        assetPaths: []
      }

    if (this.testConfig) {
      json.testConfig = this.testConfig
    } else if (withDefaults)
      json.testConfig = {
        initProgram: '',
        termProgram: '',
        macroVars: {},
        testSetUp: '',
        testTearDown: ''
      }

    if (this.serverType === ServerType.SasViya) {
      json.contextName = this.contextName
    } else if (this.serverType === ServerType.Sas9) {
      json.serverName = this.serverName
      json.repositoryName = this.repositoryName
    }

    return json
  }
}
