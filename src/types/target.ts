import {
  DocConfig,
  AuthConfig,
  AuthConfigSas9,
  BuildConfig,
  DeployConfig,
  ServiceConfig,
  JobConfig,
  StreamConfig,
  TestConfig
} from './config'
import { ServerType } from './serverType'
import {
  validateTargetName,
  validateServerUrl,
  validateServerType,
  validateDocConfig,
  validateAllowInsecureRequests,
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
  validateTestConfig
} from './targetValidators'

export interface TargetJson {
  name: string
  serverUrl: string
  serverType: ServerType
  allowInsecureRequests: boolean
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
  macroFolders: string[]
  programFolders: string[]
  isDefault?: boolean
  testConfig?: TestConfig
}

export class Target implements TargetJson {
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

  get allowInsecureRequests(): boolean {
    return this._allowInsecureRequests
  }
  private _allowInsecureRequests

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

  get testConfig(): TestConfig | undefined {
    return this._testConfig
  }
  private _testConfig: TestConfig | undefined

  constructor(json: any) {
    try {
      if (!json) {
        throw new Error('Invalid target: Input JSON is null or undefined.')
      }

      this._name = validateTargetName(json.name)
      this._serverUrl = validateServerUrl(json.serverUrl)
      this._serverType = validateServerType(json.serverType)
      this._allowInsecureRequests = validateAllowInsecureRequests(
        json.allowInsecureRequests
      )
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

      if (json.authConfigSas9) {
        this._authConfigSas9 = validateAuthConfigSas9(json.authConfigSas9)
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

      if (json.testConfig) {
        this._testConfig = validateTestConfig(json.testConfig)
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

  toJson(withDefaults: boolean = true): TargetJson {
    const json: TargetJson = {
      name: this.name,
      serverUrl: this.serverUrl,
      serverType: this.serverType,
      allowInsecureRequests: this.allowInsecureRequests,
      appLoc: this.appLoc,
      macroFolders: this.macroFolders,
      programFolders: this.programFolders,
      docConfig: this.docConfig
    }

    if (this.authConfig) {
      json.authConfig = this.authConfig
    }

    if (this.authConfigSas9) {
      json.authConfigSas9 = this.authConfigSas9
    }

    if (this.buildConfig) {
      json.buildConfig = this.buildConfig
    } else if (withDefaults)
      json.buildConfig = {
        initProgram: '',
        termProgram: '',
        buildOutputFileName: `${this.name}.sas`,
        buildOutputFolder: 'sasjsbuild',
        buildResultsFolder: 'sasjsresults',
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

    if (this.deployConfig) {
      json.deployConfig = this.deployConfig
    } else if (withDefaults)
      json.deployConfig = {
        deployScripts: [],
        deployServicePack: false
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
    } else {
      json.serverName = this.serverName
      json.repositoryName = this.repositoryName
    }

    return json
  }
}
