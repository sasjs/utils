import {
  BuildConfig,
  DeployConfig,
  JobConfig,
  ServiceConfig,
  StreamConfig
} from './config'
import { ServerType } from './serverType'
import {
  validateTargetName,
  validateServerType,
  validateAppLoc,
  validateServerUrl,
  validateBuildConfig,
  validateDeployConfig,
  validateServiceConfig,
  validateJobConfig,
  validateStreamConfig
} from './targetValidators'

describe('validateTargetName', () => {
  it('should throw an error with null target name', () => {
    expect(() => validateTargetName((null as unknown) as string)).toThrowError(
      'Invalid target name: `name` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error with undefined target name', () => {
    expect(() =>
      validateTargetName((undefined as unknown) as string)
    ).toThrowError(
      'Invalid target name: `name` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error with a target name that contains spaces', () => {
    expect(() => validateTargetName('target name')).toThrowError(
      'Invalid target name: `name` cannot include spaces.'
    )
  })

  it('should throw an error with a target name that contains non-alphanumeric characters', () => {
    expect(() => validateTargetName('targetname#€£')).toThrowError(
      'Invalid target name: `name` can only contain alphanumeric characters.'
    )
  })

  it('should return target name when valid', () => {
    expect(validateTargetName('validTargetName')).toEqual('validTargetName')
  })
})

describe('validateServerType', () => {
  it('should throw an error when server type is null', () => {
    expect(() =>
      validateServerType((null as unknown) as ServerType)
    ).toThrowError(
      'Invalid server type: `serverType` cannot be null or undefined.'
    )
  })

  it('should throw an error when server type is undefined', () => {
    expect(() =>
      validateServerType((undefined as unknown) as ServerType)
    ).toThrowError(
      'Invalid server type: `serverType` cannot be null or undefined.'
    )
  })

  it('should throw an error when server type is not SAS9 or SASViya', () => {
    expect(() =>
      validateServerType(('garbage' as unknown) as ServerType)
    ).toThrowError(
      `Invalid server type: Supported values for  \`serverType\` are ${ServerType.SasViya} and ${ServerType.Sas9}.`
    )
  })

  it('should return the server type when it is SAS9', () => {
    expect(validateServerType(ServerType.Sas9)).toEqual(ServerType.Sas9)
  })

  it('should return the server type when it is SASViya', () => {
    expect(validateServerType(ServerType.SasViya)).toEqual(ServerType.SasViya)
  })
})

describe('validateAppLoc', () => {
  it('should throw an error when appLoc is null', () => {
    expect(() => validateAppLoc((null as unknown) as string)).toThrowError(
      'Invalid app location: `appLoc` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when appLoc is undefined', () => {
    expect(() => validateAppLoc((undefined as unknown) as string)).toThrowError(
      'Invalid app location: `appLoc` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when appLoc is empty', () => {
    expect(() => validateAppLoc('')).toThrowError(
      'Invalid app location: `appLoc` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when appLoc does not start with a slash', () => {
    expect(() => validateAppLoc('path/to/folder')).toThrowError(
      'Invalid app location: `appLoc` must start with a `/`.'
    )
  })

  it('should return the appLoc when valid', () => {
    expect(validateAppLoc('/path/to/folder')).toEqual('/path/to/folder')
  })
})

describe('validateServerUrl', () => {
  it('should throw an error when server URL is null', () => {
    expect(() => validateServerUrl((null as unknown) as string)).toThrowError(
      'Invalid server URL: `serverUrl` cannot be null or undefined.'
    )
  })

  it('should throw an error when server URL is undefined', () => {
    expect(() =>
      validateServerUrl((undefined as unknown) as string)
    ).toThrowError(
      'Invalid server URL: `serverUrl` cannot be null or undefined.'
    )
  })

  it('should throw an error when server URL is not a valid URL', () => {
    expect(() => validateServerUrl('my-domain-name')).toThrowError(
      'Invalid server URL: `serverUrl` should either be an empty string or a valid URL of the form http(s)://your-server.com(:port).'
    )
  })

  it('should return the serverUrl when empty', () => {
    expect(validateServerUrl('')).toEqual('')
  })

  it('should return the serverUrl when valid', () => {
    expect(validateServerUrl('http://my-server.com:1234')).toEqual(
      'http://my-server.com:1234'
    )
  })
})

describe('validateBuildConfig', () => {
  it('should throw an error when input JSON is null', () => {
    expect(() =>
      validateBuildConfig((null as unknown) as BuildConfig)
    ).toThrowError('Invalid build config: JSON cannot be null or undefined.')
  })

  it('should throw an error when input JSON is undefined', () => {
    expect(() =>
      validateBuildConfig((undefined as unknown) as BuildConfig)
    ).toThrowError('Invalid build config: JSON cannot be null or undefined.')
  })

  it('should throw an error when build output filename is empty', () => {
    expect(() =>
      validateBuildConfig(({
        buildOutputFileName: ''
      } as unknown) as BuildConfig)
    ).toThrowError(
      'Invalid build config: `buildOutputFileName` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when build output filename is null', () => {
    expect(() =>
      validateBuildConfig(({
        buildOutputFileName: null
      } as unknown) as BuildConfig)
    ).toThrowError(
      'Invalid build config: `buildOutputFileName` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when build output filename is undefined', () => {
    expect(() =>
      validateBuildConfig(({} as unknown) as BuildConfig)
    ).toThrowError(
      'Invalid build config: `buildOutputFileName` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when init program is empty', () => {
    expect(() =>
      validateBuildConfig(({
        buildOutputFileName: 'test',
        initProgram: ''
      } as unknown) as BuildConfig)
    ).toThrowError(
      'Invalid build config: `initProgram` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when init program is null', () => {
    expect(() =>
      validateBuildConfig(({
        buildOutputFileName: 'test',
        initProgram: null
      } as unknown) as BuildConfig)
    ).toThrowError(
      'Invalid build config: `initProgram` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when init program is undefined', () => {
    expect(() =>
      validateBuildConfig(({
        buildOutputFileName: 'test'
      } as unknown) as BuildConfig)
    ).toThrowError(
      'Invalid build config: `initProgram` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when term program is empty', () => {
    expect(() =>
      validateBuildConfig(({
        buildOutputFileName: 'test',
        initProgram: 'test',
        termProgram: ''
      } as unknown) as BuildConfig)
    ).toThrowError(
      'Invalid build config: `termProgram` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when term program is null', () => {
    expect(() =>
      validateBuildConfig(({
        buildOutputFileName: 'test',
        initProgram: 'test',
        termProgram: null
      } as unknown) as BuildConfig)
    ).toThrowError(
      'Invalid build config: `termProgram` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when term program is undefined', () => {
    expect(() =>
      validateBuildConfig(({
        buildOutputFileName: 'test',
        initProgram: 'test'
      } as unknown) as BuildConfig)
    ).toThrowError(
      'Invalid build config: `termProgram` cannot be empty, null or undefined.'
    )
  })

  it('should return the build config when valid', () => {
    expect(
      validateBuildConfig({
        buildOutputFileName: 'test',
        initProgram: 'test',
        termProgram: 'test',
        macroVars: { foo: 'bar' }
      })
    ).toEqual({
      buildOutputFileName: 'test',
      initProgram: 'test',
      termProgram: 'test',
      macroVars: { foo: 'bar' }
    })
  })

  it('should initialise the macro vars if not present', () => {
    expect(
      validateBuildConfig(({
        buildOutputFileName: 'test',
        initProgram: 'test',
        termProgram: 'test'
      } as unknown) as BuildConfig)
    ).toEqual({
      buildOutputFileName: 'test',
      initProgram: 'test',
      termProgram: 'test',
      macroVars: {}
    })
  })
})

describe('validateDeployConfig', () => {
  it('should throw an error when deployConfig is null', () => {
    expect(() =>
      validateDeployConfig((null as unknown) as DeployConfig)
    ).toThrowError('Invalid deploy config: JSON cannot be null or undefined.')
  })

  it('should throw an error when deployConfig is undefined', () => {
    expect(() =>
      validateDeployConfig((undefined as unknown) as DeployConfig)
    ).toThrowError('Invalid deploy config: JSON cannot be null or undefined.')
  })

  it('should throw an error when deployServicePack is non-boolean', () => {
    expect(() =>
      validateDeployConfig(({
        deployServicePack: 'test',
        deployScripts: []
      } as unknown) as DeployConfig)
    ).toThrowError(
      'Invalid deploy config: `deployServicePack` cannot be a non-boolean value.'
    )
  })

  it('should return the deploy config when valid', () => {
    expect(
      validateDeployConfig({
        deployServicePack: true,
        deployScripts: []
      })
    ).toEqual({
      deployServicePack: true,
      deployScripts: []
    })
  })

  it('should initialise deployScripts when not initialised', () => {
    expect(
      validateDeployConfig(({
        deployServicePack: true
      } as unknown) as DeployConfig)
    ).toEqual({
      deployServicePack: true,
      deployScripts: []
    })
  })
})

describe('validateServiceConfig', () => {
  it('should throw an error when input JSON is null', () => {
    expect(() =>
      validateServiceConfig((null as unknown) as ServiceConfig)
    ).toThrowError('Invalid service config: JSON cannot be null or undefined.')
  })

  it('should throw an error when input JSON is undefined', () => {
    expect(() =>
      validateServiceConfig((undefined as unknown) as ServiceConfig)
    ).toThrowError('Invalid service config: JSON cannot be null or undefined.')
  })

  it('should throw an error when init program is empty', () => {
    expect(() =>
      validateServiceConfig({
        serviceFolders: [],
        initProgram: '',
        termProgram: 'term',
        macroVars: {}
      })
    ).toThrowError(
      'Invalid service config: `initProgram` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when init program is null', () => {
    expect(() =>
      validateServiceConfig(({
        serviceFolders: [],
        initProgram: null,
        termProgram: 'term',
        macroVars: {}
      } as unknown) as ServiceConfig)
    ).toThrowError(
      'Invalid service config: `initProgram` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when init program is undefined', () => {
    expect(() =>
      validateServiceConfig(({
        serviceFolders: [],
        initProgram: undefined,
        termProgram: 'term',
        macroVars: {}
      } as unknown) as ServiceConfig)
    ).toThrowError(
      'Invalid service config: `initProgram` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when term program is empty', () => {
    expect(() =>
      validateServiceConfig({
        serviceFolders: [],
        initProgram: 'init',
        termProgram: '',
        macroVars: {}
      })
    ).toThrowError(
      'Invalid service config: `termProgram` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when term program is null', () => {
    expect(() =>
      validateServiceConfig(({
        serviceFolders: [],
        initProgram: 'init',
        termProgram: null,
        macroVars: {}
      } as unknown) as ServiceConfig)
    ).toThrowError(
      'Invalid service config: `termProgram` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when term program is undefined', () => {
    expect(() =>
      validateServiceConfig(({
        serviceFolders: [],
        initProgram: 'init',
        termProgram: undefined,
        macroVars: {}
      } as unknown) as ServiceConfig)
    ).toThrowError(
      'Invalid service config: `termProgram` cannot be empty, null or undefined.'
    )
  })

  it('should return the service config when valid', () => {
    expect(
      validateServiceConfig({
        serviceFolders: [],
        initProgram: 'init',
        termProgram: 'term',
        macroVars: {}
      })
    ).toEqual({
      serviceFolders: [],
      initProgram: 'init',
      termProgram: 'term',
      macroVars: {}
    })
  })

  it('should initialise the macro vars if not present', () => {
    expect(
      validateServiceConfig(({
        initProgram: 'init',
        termProgram: 'term'
      } as unknown) as ServiceConfig)
    ).toEqual({
      serviceFolders: [],
      initProgram: 'init',
      termProgram: 'term',
      macroVars: {}
    })
  })
})

describe('validateJobConfig', () => {
  it('should throw an error when input JSON is null', () => {
    expect(() =>
      validateJobConfig((null as unknown) as JobConfig)
    ).toThrowError('Invalid job config: JSON cannot be null or undefined.')
  })

  it('should throw an error when input JSON is undefined', () => {
    expect(() =>
      validateJobConfig((undefined as unknown) as JobConfig)
    ).toThrowError('Invalid job config: JSON cannot be null or undefined.')
  })

  it('should throw an error when init program is empty', () => {
    expect(() =>
      validateJobConfig({
        jobFolders: [],
        initProgram: '',
        termProgram: 'term',
        macroVars: {}
      })
    ).toThrowError(
      'Invalid job config: `initProgram` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when init program is null', () => {
    expect(() =>
      validateJobConfig(({
        serviceFolders: [],
        initProgram: null,
        termProgram: 'term',
        macroVars: {}
      } as unknown) as JobConfig)
    ).toThrowError(
      'Invalid job config: `initProgram` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when init program is undefined', () => {
    expect(() =>
      validateJobConfig(({
        serviceFolders: [],
        initProgram: undefined,
        termProgram: 'term',
        macroVars: {}
      } as unknown) as JobConfig)
    ).toThrowError(
      'Invalid job config: `initProgram` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when term program is empty', () => {
    expect(() =>
      validateJobConfig({
        jobFolders: [],
        initProgram: 'init',
        termProgram: '',
        macroVars: {}
      })
    ).toThrowError(
      'Invalid job config: `termProgram` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when term program is null', () => {
    expect(() =>
      validateJobConfig(({
        jobFolders: [],
        initProgram: 'init',
        termProgram: null,
        macroVars: {}
      } as unknown) as JobConfig)
    ).toThrowError(
      'Invalid job config: `termProgram` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when term program is undefined', () => {
    expect(() =>
      validateJobConfig(({
        jobFolders: [],
        initProgram: 'init',
        termProgram: undefined,
        macroVars: {}
      } as unknown) as JobConfig)
    ).toThrowError(
      'Invalid job config: `termProgram` cannot be empty, null or undefined.'
    )
  })

  it('should return the service config when valid', () => {
    expect(
      validateJobConfig({
        jobFolders: [],
        initProgram: 'init',
        termProgram: 'term',
        macroVars: {}
      })
    ).toEqual({
      jobFolders: [],
      initProgram: 'init',
      termProgram: 'term',
      macroVars: {}
    })
  })

  it('should initialise the macro vars if not present', () => {
    expect(
      validateJobConfig(({
        initProgram: 'init',
        termProgram: 'term'
      } as unknown) as JobConfig)
    ).toEqual({
      jobFolders: [],
      initProgram: 'init',
      termProgram: 'term',
      macroVars: {}
    })
  })
})

describe('validateStreamConfig', () => {
  it('should throw an error when input JSON is null', () => {
    expect(() =>
      validateStreamConfig((null as unknown) as StreamConfig)
    ).toThrowError('Invalid stream config: JSON cannot be null or undefined.')
  })

  it('should throw an error when input JSON is undefined', () => {
    expect(() =>
      validateStreamConfig((undefined as unknown) as StreamConfig)
    ).toThrowError('Invalid stream config: JSON cannot be null or undefined.')
  })

  it('should throw an error when streamWeb is a non-boolean value', () => {
    expect(() =>
      validateStreamConfig(({ streamWeb: 'foo' } as unknown) as StreamConfig)
    ).toThrowError(
      'Invalid stream config: `streamWeb` cannot be a non-boolean value.'
    )
  })

  it('should throw an error when streamWeb is true and a streamWebFolder is not specified', () => {
    expect(() =>
      validateStreamConfig(({
        streamWeb: true,
        streamWebFolder: ''
      } as unknown) as StreamConfig)
    ).toThrowError(
      'Invalid stream config: `streamWebFolder` cannot be empty, null or undefined when `streamWeb` is true.'
    )
  })

  it('should throw an error when webSourcePath is empty', () => {
    expect(() =>
      validateStreamConfig(({
        streamWeb: true,
        streamWebFolder: '.',
        webSourcePath: ''
      } as unknown) as StreamConfig)
    ).toThrowError(
      'Invalid stream config: `webSourcePath` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when webSourcePath is null', () => {
    expect(() =>
      validateStreamConfig(({
        streamWeb: true,
        streamWebFolder: '.',
        webSourcePath: null
      } as unknown) as StreamConfig)
    ).toThrowError(
      'Invalid stream config: `webSourcePath` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when webSourcePath is undefined', () => {
    expect(() =>
      validateStreamConfig(({
        streamWeb: true,
        streamWebFolder: '.',
        webSourcePath: undefined
      } as unknown) as StreamConfig)
    ).toThrowError(
      'Invalid stream config: `webSourcePath` cannot be empty, null or undefined.'
    )
  })

  it('should return the stream config when valid', () => {
    expect(
      validateStreamConfig({
        streamWeb: true,
        streamWebFolder: '.',
        webSourcePath: '.',
        assetPaths: []
      })
    ).toEqual({
      streamWeb: true,
      streamWebFolder: '.',
      webSourcePath: '.',
      assetPaths: []
    })
  })

  it('should initialise the asset paths if not set', () => {
    expect(
      validateStreamConfig(({
        streamWeb: true,
        streamWebFolder: '.',
        webSourcePath: '.'
      } as unknown) as StreamConfig)
    ).toEqual({
      streamWeb: true,
      streamWebFolder: '.',
      webSourcePath: '.',
      assetPaths: []
    })
  })
})
