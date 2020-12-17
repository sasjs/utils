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
    expect(target.buildConfig.buildOutputFileName).toEqual('test.sas')
    expect(target.buildConfig.initProgram).toEqual('')
    expect(target.buildConfig.termProgram).toEqual('')
    expect(target.buildConfig.macroVars).toEqual({})
  })

  it('should create an instance when the JSON is valid', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.Sas9,
      appLoc: '/test',
      contextName: 'Test Context'
    })

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.name).toEqual('test')
    expect(target.serverUrl).toEqual('')
    expect(target.serverType).toEqual(ServerType.Sas9)
    expect(target.appLoc).toEqual('/test')
    expect(target.contextName).toEqual('Test Context')
  })

  it('should create an instance with build config when the JSON is valid', () => {
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

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.name).toEqual('test')
    expect(target.serverUrl).toEqual('')
    expect(target.serverType).toEqual(ServerType.Sas9)
    expect(target.appLoc).toEqual('/test')
    expect(target.buildConfig).toBeTruthy()
    expect(target.buildConfig.buildOutputFileName).toEqual('test')
    expect(target.buildConfig.initProgram).toEqual('init')
    expect(target.buildConfig.termProgram).toEqual('term')
    expect(target.buildConfig.macroVars).toEqual({})
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
    expect(target.deployConfig.deployServicePack).toEqual(true)
    expect(target.deployConfig.deployScripts).toEqual(['foo', 'bar'])
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
    expect(target.serviceConfig.serviceFolders).toEqual([])
    expect(target.serviceConfig.initProgram).toEqual('init')
    expect(target.serviceConfig.termProgram).toEqual('term')
    expect(target.serverName).toEqual('SASApp')
    expect(target.repositoryName).toEqual('Foundation')
  })

  it('should create an instance with job config when the JSON is valid', () => {
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

    expect(target).toBeTruthy()
    expect(target instanceof Target).toEqual(true)
    expect(target.jobConfig).toBeTruthy()
    expect(target.jobConfig.jobFolders).toEqual([])
    expect(target.jobConfig.initProgram).toEqual('init')
    expect(target.jobConfig.termProgram).toEqual('term')
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
    expect(target.streamConfig.assetPaths).toEqual([])
    expect(target.streamConfig.streamWeb).toEqual(true)
    expect(target.streamConfig.streamWebFolder).toEqual('.')
    expect(target.streamConfig.webSourcePath).toEqual('.')
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

  it('should throw an error when trying to access an undefined build config', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.SasViya,
      appLoc: '/test'
    })

    expect(() => target.buildConfig).toThrowError(
      'Build config has not been defined for build target test.'
    )
  })

  it('should throw an error when trying to access an undefined deploy config', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.SasViya,
      appLoc: '/test'
    })

    expect(() => target.deployConfig).toThrowError(
      'Deploy config has not been defined for build target test.'
    )
  })

  it('should throw an error when trying to access an undefined job config', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.SasViya,
      appLoc: '/test'
    })

    expect(() => target.jobConfig).toThrowError(
      'Job config has not been defined for build target test.'
    )
  })

  it('should throw an error when trying to access an undefined service config', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.SasViya,
      appLoc: '/test'
    })

    expect(() => target.serviceConfig).toThrowError(
      'Service config has not been defined for build target test.'
    )
  })

  it('should throw an error when trying to access an undefined stream config', () => {
    const target = new Target({
      name: 'test',
      serverUrl: '',
      serverType: ServerType.SasViya,
      appLoc: '/test'
    })

    expect(() => target.streamConfig).toThrowError(
      'Stream config has not been defined for build target test.'
    )
  })
})
