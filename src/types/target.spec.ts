import { ServerType } from './serverType'
import { Target } from './target'

describe('Target', () => {
  it('should throw an error with null JSON', () => {
    expect(() => new Target(null)).toThrowError(
      'Error parsing target: Invalid target: Input JSON is null or undefined.'
    )
  })

  it('should throw an error with undefined JSON', () => {
    expect(() => new Target(undefined)).toThrowError(
      'Error parsing target: Invalid target: Input JSON is null or undefined.'
    )
  })

  it('should throw an error with an invalid name', () => {
    expect(() => new Target({ name: '' })).toThrowError(
      'Error parsing target: Invalid target name'
    )
  })

  it('should throw an error with an invalid server URL', () => {
    expect(
      () => new Target({ name: 'test', serverUrl: 'gibberish' })
    ).toThrowError('Error parsing target: Invalid server URL')
  })

  it('should throw an error with an invalid server type', () => {
    expect(
      () => new Target({ name: 'test', serverUrl: '', serverType: 'garbage' })
    ).toThrowError('Error parsing target: Invalid server type')
  })

  it('should throw an error with an invalid appLoc', () => {
    expect(
      () =>
        new Target({
          name: 'test',
          serverUrl: '',
          serverType: ServerType.Sas9,
          appLoc: ''
        })
    ).toThrowError('Error parsing target: Invalid app location')
  })

  it('should set defaults with an empty build config', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      buildConfig: {}
    })

    expect(target.buildConfig).toBeTruthy()
    expect(target.buildConfig!.buildOutputFileName).toEqual('test.sas')
    expect(target.buildConfig!.initProgram).toEqual('')
    expect(target.buildConfig!.termProgram).toEqual('')
    expect(target.buildConfig!.macroVars).toEqual({})
  })

  it('should create an instance when the JSON is valid', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      contextName: 'Test Context',
      syncFolder: ''
    })

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.name).toEqual('test')
    expect(target.serverUrl).toEqual('')
    expect(target.serverType).toEqual(ServerType.Sas9)
    expect(target.appLoc).toEqual('/test')
    expect(target.contextName).toEqual('Test Context')
    expect(target.syncFolder).toBeUndefined()
  })

  it('should create an instance when the JSON is valid and contains sasjsBuildFolder', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      sasjsBuildFolder: 'sasjsbuild'
    })

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.name).toEqual('test')
    expect(target.serverUrl).toEqual('')
    expect(target.serverType).toEqual(ServerType.Sas9)
    expect(target.appLoc).toEqual('/test')
    expect(target.sasjsBuildFolder).toEqual('sasjsbuild')
  })

  it('should convert an instance to JSON when containing sasjsBuildFolder', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      sasjsBuildFolder: 'sasjsbuild'
    })

    const json = target.toJson()
    expect(json).toBeTruthy()
    expect(json.name).toEqual('test')
    expect(json.serverUrl).toEqual('')
    expect(json.serverType).toEqual(ServerType.Sas9)
    expect(json.appLoc).toEqual('/test')
    expect(json.sasjsBuildFolder).toEqual('sasjsbuild')
  })

  it('should create an instance when the JSON is valid and contains sasjsResultsFolder', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      sasjsResultsFolder: 'sasjsresults'
    })

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.name).toEqual('test')
    expect(target.serverUrl).toEqual('')
    expect(target.serverType).toEqual(ServerType.Sas9)
    expect(target.appLoc).toEqual('/test')
    expect(target.sasjsResultsFolder).toEqual('sasjsresults')
  })

  it('should convert an instance to JSON containing sasjsResultsFolder', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      sasjsResultsFolder: 'sasjsresults'
    })

    const json = target.toJson()
    expect(json).toBeTruthy()
    expect(json.name).toEqual('test')
    expect(json.serverUrl).toEqual('')
    expect(json.serverType).toEqual(ServerType.Sas9)
    expect(json.appLoc).toEqual('/test')
    expect(json.sasjsResultsFolder).toEqual('sasjsresults')
  })

  it('should create an instance when the JSON is valid and contains syncDirectories', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      syncDirectories: [{ local: 'local', remote: 'remote' }]
    })

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.name).toEqual('test')
    expect(target.serverUrl).toEqual('')
    expect(target.serverType).toEqual(ServerType.Sas9)
    expect(target.appLoc).toEqual('/test')
    expect(target.syncDirectories).toEqual([
      { local: 'local', remote: 'remote' }
    ])
  })

  it('should convert an instance to JSON containing syncDirectories', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      syncDirectories: [{ local: 'local', remote: 'remote' }]
    })

    const json = target.toJson()
    expect(json).toBeTruthy()
    expect(json.name).toEqual('test')
    expect(json.serverUrl).toEqual('')
    expect(json.serverType).toEqual(ServerType.Sas9)
    expect(json.appLoc).toEqual('/test')
    expect(json.syncDirectories).toEqual([{ local: 'local', remote: 'remote' }])
  })

  it('should convert an instance to json containing build config', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      buildConfig: {
        buildOutputFileName: 'test',
        initProgram: 'init',
        termProgram: 'term'
      }
    })

    const json = target.toJson()
    expect(json).toBeTruthy()
    expect(json.buildConfig).toBeTruthy()
    expect(json.buildConfig!.buildOutputFileName).toEqual('test')
    expect(json.buildConfig!.initProgram).toEqual('init')
    expect(json.buildConfig!.termProgram).toEqual('term')
    expect(json.buildConfig!.macroVars).toEqual({})
  })

  it('should convert an instance to json containing service config', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      serviceConfig: {
        serviceFolders: ['test'],
        initProgram: 'init',
        termProgram: 'term',
        macroVars: {}
      }
    })

    const json = target.toJson()
    expect(json).toBeTruthy()
    expect(json.serviceConfig).toBeTruthy()
    expect(json.serviceConfig!.serviceFolders).toEqual(['test'])
    expect(json.serviceConfig!.initProgram).toEqual('init')
    expect(json.serviceConfig!.termProgram).toEqual('term')
    expect(json.serviceConfig!.macroVars).toEqual({})
  })

  it('should convert an instance to json containing stream config', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      streamConfig: {
        streamWebFolder: 'test',
        streamWeb: false,
        webSourcePath: 'test',
        streamServiceName: 'test',
        assetPaths: []
      }
    })

    const json = target.toJson()
    expect(json).toBeTruthy()
    expect(json.streamConfig).toBeTruthy()
    expect(json.streamConfig!.streamWebFolder).toEqual('test')
    expect(json.streamConfig!.streamWeb).toEqual(false)
    expect(json.streamConfig!.webSourcePath).toEqual('test')
    expect(json.streamConfig!.streamServiceName).toEqual('test')
    expect(json.streamConfig!.assetPaths).toEqual([])
  })

  it('should convert an instance to json containing service config', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      testConfig: {
        initProgram: 'init',
        termProgram: 'term',
        macroVars: {},
        testSetUp: '',
        testTearDown: ''
      }
    })

    const json = target.toJson()
    expect(json).toBeTruthy()
    expect(json.testConfig).toBeTruthy()
    expect(json.testConfig!.initProgram).toEqual('init')
    expect(json.testConfig!.termProgram).toEqual('term')
    expect(json.testConfig!.macroVars).toEqual({})
    expect(json.testConfig!.testSetUp).toEqual('')
    expect(json.testConfig!.testTearDown).toEqual('')
  })

  it('should create an instance with deploy config when the JSON is valid', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      deployConfig: {
        deployServicePack: true,
        deployScripts: ['foo', 'bar']
      }
    })

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.deployConfig).toBeTruthy()
    expect(target.deployConfig!.deployServicePack).toEqual(true)
    expect(target.deployConfig!.deployScripts).toEqual(['foo', 'bar'])
  })

  it('should convert to json containing deploy config with the deployServicePack is equal to false', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      deployConfig: {
        deployServicePack: false,
        deployScripts: []
      }
    })

    const json = target.toJson()
    expect(json.deployConfig!.deployServicePack).toEqual(false)
  })

  it('should create an instance with service config when the JSON is valid', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      serviceConfig: {
        serviceFolders: [],
        initProgram: 'init',
        termProgram: 'term'
      }
    })

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.serviceConfig).toBeTruthy()
    expect(target.serviceConfig!.serviceFolders).toEqual([])
    expect(target.serviceConfig!.initProgram).toEqual('init')
    expect(target.serviceConfig!.termProgram).toEqual('term')
    expect(target.serverName).toEqual('SASApp')
    expect(target.repositoryName).toEqual('Foundation')
  })

  it('should convert an instance to json containing job config', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      jobConfig: {
        jobFolders: [],
        initProgram: 'init',
        termProgram: 'term'
      }
    })

    const json = target.toJson()

    expect(json).toBeTruthy()
    expect(json.jobConfig).toBeTruthy()
    expect(json.jobConfig!.jobFolders).toEqual([])
    expect(json.jobConfig!.initProgram).toEqual('init')
    expect(json.jobConfig!.termProgram).toEqual('term')
  })

  it('should create an instance with doc config when the JSON is valid', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      docConfig: {
        displayMacroCore: true,
        dataControllerUrl: 'https://test.com',
        enableLineage: false,
        outDirectory: '.'
      }
    })

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.docConfig).toBeTruthy()
    expect(target.docConfig!.displayMacroCore).toEqual(true)
    expect(target.docConfig!.dataControllerUrl).toEqual('https://test.com')
    expect(target.docConfig!.enableLineage).toEqual(false)
    expect(target.docConfig!.outDirectory).toEqual('.')
  })

  it('should create an instance with stream config when the JSON is valid', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      streamConfig: {
        assetPaths: [],
        streamWeb: true,
        streamWebFolder: '.',
        webSourcePath: '.'
      }
    })

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.streamConfig).toBeTruthy()
    expect(target.streamConfig!.assetPaths).toEqual([])
    expect(target.streamConfig!.streamWeb).toEqual(true)
    expect(target.streamConfig!.streamWebFolder).toEqual('.')
    expect(target.streamConfig!.webSourcePath).toEqual('.')
  })

  it('should create an instance with test config when the JSON is valid', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      testConfig: {
        initProgram: 'init',
        termProgram: 'term',
        macroVars: {
          testVar: 'testValue'
        },
        testSetUp: 'testSetup',
        testTearDown: 'testTearDown'
      }
    })

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.testConfig).toBeTruthy()
    expect(target.testConfig!.initProgram).toEqual('init')
    expect(target.testConfig!.termProgram).toEqual('term')
    expect(target.testConfig!.macroVars).toEqual({
      testVar: 'testValue'
    })
    expect(target.testConfig!.testSetUp).toEqual('testSetup')
    expect(target.testConfig!.testTearDown).toEqual('testTearDown')
  })

  it('should create an instance with macro folders when the JSON is valid', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      macroFolders: ['foo']
    })

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.macroFolders).toEqual(['foo'])
  })

  it('should create an instance with program folders when the JSON is valid', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      programFolders: ['foo']
    })

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.programFolders).toEqual(['foo'])
  })

  it('should create an instance with binary folders when the JSON is valid', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      binaryFolders: ['foo']
    })

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.binaryFolders).toEqual(['foo'])
  })

  it('should create an instance with the minimum set of attributes', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.SasViya,
      appLoc: '/test'
    })

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.name).toEqual('test')
    expect(target.serverUrl).toEqual('')
    expect(target.serverType).toEqual(ServerType.SasViya)
    expect(target.appLoc).toEqual('/test')
  })

  it('should create an instance with the auth config when available', () => {
    const authConfig = {
      access_token: 'T35T',
      refresh_token: 'R3FR35H',
      client: 'CL13NT',
      secret: '53CR3T'
    }
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.SasViya,
      appLoc: '/test',
      authConfig
    })

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.name).toEqual('test')
    expect(target.serverUrl).toEqual('')
    expect(target.serverType).toEqual(ServerType.SasViya)
    expect(target.appLoc).toEqual('/test')
    expect(target.authConfig).toEqual(authConfig)
  })

  it('should create an instance with the auth config for sas9 when available', () => {
    const authConfigSas9 = {
      userName: 'TestUser',
      password: 'hello-world'
    }
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      authConfigSas9
    })

    expect(target.authConfigSas9).toEqual(authConfigSas9)
  })

  it('should convert to JSON with minimal attributes', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.SasViya,
      appLoc: '/test'
    })

    const json = target.toJson()

    expect(json.name).toEqual(target.name)
    expect(json.serverUrl).toEqual(target.serverUrl)
    expect(json.serverType).toEqual(target.serverType)
    expect(json.appLoc).toEqual(target.appLoc)
    expect(json.authConfig).toBeUndefined()
    expect(json.authConfigSas9).toBeUndefined()
    expect(json.buildConfig).toEqual({
      initProgram: '',
      termProgram: '',
      buildOutputFileName: `${target.name}.sas`,
      macroVars: {}
    })
    expect(json.jobConfig).toEqual({
      jobFolders: [],
      initProgram: '',
      termProgram: '',
      macroVars: {}
    })
    expect(json.serviceConfig).toEqual({
      serviceFolders: [],
      initProgram: '',
      termProgram: '',
      macroVars: {}
    })
    expect(json.streamConfig).toEqual({
      streamWebFolder: '',
      streamWeb: false,
      webSourcePath: '',
      assetPaths: [],
      streamServiceName: ''
    })
    expect(json.deployConfig).toEqual({
      deployScripts: [],
      deployServicePack: true
    })
    expect(json.testConfig).toEqual({
      initProgram: '',
      termProgram: '',
      macroVars: {},
      testSetUp: '',
      testTearDown: ''
    })
  })

  it('should convert to JSON without default attributes', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.SasViya,
      appLoc: '/test'
    })

    const json = target.toJson(false)

    expect(json.name).toEqual(target.name)
    expect(json.serverUrl).toEqual(target.serverUrl)
    expect(json.serverType).toEqual(target.serverType)
    expect(json.appLoc).toEqual(target.appLoc)
    expect(json.deployConfig).toEqual({
      deployServicePack: true,
      deployScripts: []
    })
    expect(json.authConfig).toEqual(undefined)
    expect(json.buildConfig).toEqual(undefined)
    expect(json.jobConfig).toEqual(undefined)
    expect(json.serviceConfig).toEqual(undefined)
    expect(json.streamConfig).toEqual(undefined)
  })

  it('should return a JSON which contains authConfig whose value should be equal to authConfig that was passed in creation of target', () => {
    const authConfig = {
      access_token: 'T35T',
      refresh_token: 'R3FR35H',
      client: 'CL13NT',
      secret: '53CR3T'
    }
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      authConfig
    })
    const json = target.toJson()
    expect(target.authConfig).toEqual(authConfig)
  })

  it('should return a JSON which contains authConfigSas9 whose value should be equal to authConfigSas9 that was passed in creation of target', () => {
    const authConfigSas9 = {
      userName: 'TestUser',
      password: 'Hello-World'
    }
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      authConfigSas9
    })
    const json = target.toJson()
    expect(target.authConfigSas9).toEqual(authConfigSas9)
  })

  it('should include context name in JSON when server type is SASVIYA', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.SasViya,
      appLoc: '/test',
      contextName: 'Test Context'
    })

    const json = target.toJson()

    expect(json.name).toEqual(target.name)
    expect(json.serverUrl).toEqual(target.serverUrl)
    expect(json.serverType).toEqual(target.serverType)
    expect(json.appLoc).toEqual(target.appLoc)
    expect(json.contextName).toEqual(target.contextName)
    expect(json.serverName).toBeUndefined()
    expect(json.repositoryName).toBeUndefined()
  })

  it('should include server name and repository name in JSON when server type is SAS9', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      serverName: 'Test Server',
      repositoryName: 'Test Repository'
    })

    const json = target.toJson()

    expect(json.name).toEqual(target.name)
    expect(json.serverUrl).toEqual(target.serverUrl)
    expect(json.serverType).toEqual(target.serverType)
    expect(json.appLoc).toEqual(target.appLoc)
    expect(json.contextName).toBeUndefined()
    expect(json.serverName).toEqual(target.serverName)
    expect(json.repositoryName).toEqual(target.repositoryName)
  })

  it('should combine configuration and target configs', () => {
    const defaultConfig = { initProgram: '', macroVars: {}, termProgram: '' }

    const configurationBuildConfig = {
      buildOutputFileName: 'test',
      ...defaultConfig
    }
    const targetBuildConfig = {
      buildOutputFolder: 'test',
      buildResultsFolder: 'test'
    }

    const targetServiceConfig = {
      serviceFolders: []
    }

    const configurationJobConfig = { ...defaultConfig, jobFolders: [] }

    const configurationTestConfig = {
      ...defaultConfig,
      testSetUp: 'confTest',
      testTearDown: 'confTest'
    }
    const targetTestConfig = {
      testSetUp: 'targetTest'
    }

    const targetDocConfig = {
      displayMacroCore: true,
      enableLineage: false,
      outDirectory: 'test',
      dataControllerUrl: 'https://test',
      doxyContent: {
        favIcon: 'test',
        footer: 'test',
        header: 'test',
        layout: 'test',
        logo: 'test',
        readMe: 'test',
        stylesheet: 'test',
        path: 'test'
      }
    }

    const configurationDeployConfig = {
      deployServicePack: true,
      deployScripts: []
    }

    const configurationStreamConfig = {
      assetPaths: [],
      streamLogo: 'assets/angular-logo.png',
      streamServiceName: 'Angular',
      streamWeb: false,
      streamWebFolder: 'web',
      webSourcePath: 'dist'
    }
    const targetStreamConfig = {
      streamWeb: true
    }

    const configurationAuthConfig = {
      access_token: 'confTest',
      refresh_token: 'confTest',
      client: 'confTest',
      secret: 'confTest'
    }
    const targetAuthConfig = {
      access_token: 'targetTest',
      refresh_token: 'targetTest',
      client: 'targetTest',
      secret: 'targetTest'
    }

    const target = new Target(
      {
        name: 'test',
        serverUrl: '',
        serverType: ServerType.Sas9,
        appLoc: '/test',
        serverName: 'Test Server',
        repositoryName: 'Test Repository',
        streamConfig: targetStreamConfig,
        buildConfig: targetBuildConfig,
        serviceConfig: targetServiceConfig,
        testConfig: targetTestConfig,
        docConfig: targetDocConfig,
        authConfig: targetAuthConfig
      },
      {
        streamConfig: configurationStreamConfig,
        buildConfig: configurationBuildConfig,
        jobConfig: configurationJobConfig,
        testConfig: configurationTestConfig,
        deployConfig: configurationDeployConfig,
        authConfig: configurationAuthConfig
      }
    )

    const json = target.toJson()

    expect(json.streamConfig).toEqual({
      ...configurationStreamConfig,
      ...targetStreamConfig
    })
    expect(json.buildConfig).toEqual({
      ...configurationBuildConfig,
      ...targetBuildConfig
    })
    expect(json.serviceConfig).toEqual({
      ...defaultConfig,
      ...targetServiceConfig
    })
    expect(json.jobConfig).toEqual(configurationJobConfig)
    expect(json.testConfig).toEqual({
      ...configurationTestConfig,
      ...targetTestConfig
    })
    expect(json.docConfig).toEqual(targetDocConfig)
    expect(json.deployConfig).toEqual(configurationDeployConfig)
    expect(json.authConfig).toEqual(targetAuthConfig)
  })
})
