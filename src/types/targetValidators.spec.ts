import {
  DocConfig,
  AuthConfig,
  AuthConfigSas9,
  BuildConfig,
  DeployConfig,
  JobConfig,
  ServiceConfig,
  StreamConfig,
  TestConfig
} from './config'
import { ServerType } from './serverType'
import { HttpsAgentOptions } from './httpsAgentOptions'
import {
  validateTargetName,
  validateServerType,
  validateHttpsAgentOptions,
  validateAppLoc,
  validateServerUrl,
  validateBuildConfig,
  validateDeployConfig,
  validateServiceConfig,
  validateJobConfig,
  validateStreamConfig,
  validateContextName,
  validateServerName,
  validateRepositoryName,
  validateAuthConfig,
  validateDocConfig,
  validateTestConfig,
  validateAuthConfigSas9
} from './targetValidators'

describe('validateTargetName', () => {
  it('should throw an error with null target name', () => {
    expect(() => validateTargetName(null as unknown as string)).toThrowError(
      'Invalid target name: `name` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error with undefined target name', () => {
    expect(() =>
      validateTargetName(undefined as unknown as string)
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
      'Invalid target name: `name` can only contain alphanumeric characters and dashes.'
    )
  })

  it('should return target name when valid', () => {
    expect(validateTargetName('validTargetName')).toEqual('validTargetName')
  })

  it('should return target name when it includes dashes', () => {
    expect(validateTargetName('valid-target-name')).toEqual('valid-target-name')
  })
})

describe('validateServerType', () => {
  it('should throw an error when server type is null', () => {
    expect(() =>
      validateServerType(null as unknown as ServerType)
    ).toThrowError(
      'Invalid server type: `serverType` cannot be null or undefined.'
    )
  })

  it('should throw an error when server type is undefined', () => {
    expect(() =>
      validateServerType(undefined as unknown as ServerType)
    ).toThrowError(
      'Invalid server type: `serverType` cannot be null or undefined.'
    )
  })

  it('should throw an error when server type is not SAS9 or SASViya', () => {
    expect(() =>
      validateServerType('garbage' as unknown as ServerType)
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
    expect(() => validateAppLoc(null as unknown as string)).toThrowError(
      'Invalid app location: `appLoc` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when appLoc is undefined', () => {
    expect(() => validateAppLoc(undefined as unknown as string)).toThrowError(
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
  it('should set server URL to the empty string when it is null', () => {
    expect(validateServerUrl(null as unknown as string)).toEqual('')
  })

  it('should set server URL to the empty string when it is undefined', () => {
    expect(validateServerUrl(undefined as unknown as string)).toEqual('')
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

describe('validateHttpsAgentOptions', () => {
  it('should set httpsAgentOptions to undefined when it is null', () => {
    expect(
      validateHttpsAgentOptions(null as unknown as HttpsAgentOptions)
    ).toBeUndefined()
  })

  it('should set httpsAgentOptions to undefined when it is undefined', () => {
    expect(
      validateHttpsAgentOptions(undefined as unknown as HttpsAgentOptions)
    ).toBeUndefined()
  })

  it('should remove invalid property types of httpsAgentOptions', () => {
    expect(
      validateHttpsAgentOptions({
        caPath: true,
        keyPath: 123,
        certPath: {}
      } as unknown as HttpsAgentOptions)
    ).toEqual({ allowInsecureRequests: false })
  })

  it('should throw an error when httpsAgentOptions is not an object', () => {
    expect(() =>
      validateHttpsAgentOptions('some-string' as unknown as HttpsAgentOptions)
    ).toThrowError(
      'Invalid value: `httpsAgentOptions` should either be an empty or an object of `HttpsAgentOptions`'
    )
    expect(() =>
      validateHttpsAgentOptions(true as unknown as HttpsAgentOptions)
    ).toThrowError(
      'Invalid value: `httpsAgentOptions` should either be an empty or an object of `HttpsAgentOptions`'
    )
  })

  it('should return httpsAgentOptions when valid', () => {
    const allowInsecureRequestsOptions = { allowInsecureRequests: true }
    expect(validateHttpsAgentOptions(allowInsecureRequestsOptions)).toEqual(
      allowInsecureRequestsOptions
    )

    const caPathOptions = {
      allowInsecureRequests: false,
      caPath: 'path/to/ca/file'
    }
    expect(validateHttpsAgentOptions(caPathOptions)).toEqual(caPathOptions)
  })
})

describe('validateBuildConfig', () => {
  it('should throw an error when input JSON is null', () => {
    expect(() =>
      validateBuildConfig(null as unknown as BuildConfig, 'test')
    ).toThrowError('Invalid build config: JSON cannot be null or undefined.')
  })

  it('should throw an error when input JSON is undefined', () => {
    expect(() =>
      validateBuildConfig(undefined as unknown as BuildConfig, 'test')
    ).toThrowError('Invalid build config: JSON cannot be null or undefined.')
  })

  it('should use the default when build output filename is undefined', () => {
    expect(validateBuildConfig({} as unknown as BuildConfig, 'test')).toEqual({
      buildOutputFolder: 'sasjsbuild',
      buildResultsFolder: 'sasjsresults',
      buildOutputFileName: 'test.sas',
      initProgram: '',
      termProgram: '',
      macroVars: {}
    })
  })

  it('should set the init program to the empty string if null', () => {
    expect(
      validateBuildConfig(
        {
          buildOutputFolder: 'sasjsbuild',
          buildResultsFolder: 'sasjsresults',
          buildOutputFileName: 'test.sas',
          initProgram: null
        } as unknown as BuildConfig,
        'test'
      )
    ).toEqual({
      buildOutputFolder: 'sasjsbuild',
      buildResultsFolder: 'sasjsresults',
      buildOutputFileName: 'test.sas',
      initProgram: '',
      termProgram: '',
      macroVars: {}
    })
  })

  it('should set the term program to the empty string if null', () => {
    expect(
      validateBuildConfig(
        {
          buildOutputFolder: 'sasjsbuild',
          buildResultsFolder: 'sasjsresults',
          buildOutputFileName: 'output.sas',
          initProgram: 'test',
          termProgram: null
        } as unknown as BuildConfig,
        'test'
      )
    ).toEqual({
      buildOutputFolder: 'sasjsbuild',
      buildResultsFolder: 'sasjsresults',
      buildOutputFileName: 'output.sas',
      initProgram: 'test',
      termProgram: '',
      macroVars: {}
    })
  })

  it('should return the build config when valid', () => {
    expect(
      validateBuildConfig(
        {
          buildOutputFolder: 'sasjsbuild',
          buildResultsFolder: 'sasjsresults',
          buildOutputFileName: 'output.sas',
          initProgram: 'test',
          termProgram: 'test',
          macroVars: { foo: 'bar' }
        },
        'test'
      )
    ).toEqual({
      buildOutputFolder: 'sasjsbuild',
      buildResultsFolder: 'sasjsresults',
      buildOutputFileName: 'output.sas',
      initProgram: 'test',
      termProgram: 'test',
      macroVars: { foo: 'bar' }
    })
  })

  it('should initialise the macro vars if not present', () => {
    expect(
      validateBuildConfig(
        {
          buildOutputFolder: 'sasjsbuild',
          buildResultsFolder: 'sasjsresults',
          buildOutputFileName: 'test',
          initProgram: 'test',
          termProgram: 'test'
        } as unknown as BuildConfig,
        'test'
      )
    ).toEqual({
      buildOutputFolder: 'sasjsbuild',
      buildResultsFolder: 'sasjsresults',
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
      validateDeployConfig(null as unknown as DeployConfig)
    ).toThrowError('Invalid deploy config: JSON cannot be null or undefined.')
  })

  it('should throw an error when deployConfig is undefined', () => {
    expect(() =>
      validateDeployConfig(undefined as unknown as DeployConfig)
    ).toThrowError('Invalid deploy config: JSON cannot be null or undefined.')
  })

  it('should throw an error when deployServicePack is non-boolean', () => {
    expect(
      validateDeployConfig({
        deployServicePack: 'test',
        deployScripts: []
      } as unknown as DeployConfig)
    ).toEqual({
      deployServicePack: true,
      deployScripts: []
    })
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
      validateDeployConfig({
        deployServicePack: true
      } as unknown as DeployConfig)
    ).toEqual({
      deployServicePack: true,
      deployScripts: []
    })
  })
})

describe('validateServiceConfig', () => {
  it('should throw an error when input JSON is null', () => {
    expect(() =>
      validateServiceConfig(null as unknown as ServiceConfig)
    ).toThrowError('Invalid service config: JSON cannot be null or undefined.')
  })

  it('should throw an error when input JSON is undefined', () => {
    expect(() =>
      validateServiceConfig(undefined as unknown as ServiceConfig)
    ).toThrowError('Invalid service config: JSON cannot be null or undefined.')
  })

  it('should set the init program to the empty string if null', () => {
    expect(
      validateServiceConfig({
        serviceFolders: [],
        initProgram: null
      } as unknown as ServiceConfig)
    ).toEqual({
      serviceFolders: [],
      initProgram: '',
      termProgram: '',
      macroVars: {}
    })
  })

  it('should set the term program to the empty string if null', () => {
    expect(
      validateServiceConfig({
        serviceFolders: [],
        initProgram: 'test',
        termProgram: ''
      } as unknown as ServiceConfig)
    ).toEqual({
      serviceFolders: [],
      initProgram: 'test',
      termProgram: '',
      macroVars: {}
    })
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
      validateServiceConfig({
        initProgram: 'init',
        termProgram: 'term'
      } as unknown as ServiceConfig)
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
    expect(() => validateJobConfig(null as unknown as JobConfig)).toThrowError(
      'Invalid job config: JSON cannot be null or undefined.'
    )
  })

  it('should throw an error when input JSON is undefined', () => {
    expect(() =>
      validateJobConfig(undefined as unknown as JobConfig)
    ).toThrowError('Invalid job config: JSON cannot be null or undefined.')
  })

  it('should set the init program to the empty string if null', () => {
    expect(
      validateJobConfig({
        jobFolders: [],
        initProgram: null
      } as unknown as JobConfig)
    ).toEqual({
      jobFolders: [],
      initProgram: '',
      termProgram: '',
      macroVars: {}
    })
  })

  it('should set the term program to the empty string if null', () => {
    expect(
      validateJobConfig({
        jobFolders: [],
        initProgram: 'test',
        termProgram: ''
      } as unknown as JobConfig)
    ).toEqual({
      jobFolders: [],
      initProgram: 'test',
      termProgram: '',
      macroVars: {}
    })
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
      validateJobConfig({
        initProgram: 'init',
        termProgram: 'term'
      } as unknown as JobConfig)
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
      validateStreamConfig(null as unknown as StreamConfig)
    ).toThrowError('Invalid stream config: JSON cannot be null or undefined.')
  })

  it('should throw an error when input JSON is undefined', () => {
    expect(() =>
      validateStreamConfig(undefined as unknown as StreamConfig)
    ).toThrowError('Invalid stream config: JSON cannot be null or undefined.')
  })

  it('should throw an error when streamWeb is a non-boolean value', () => {
    expect(() =>
      validateStreamConfig({ streamWeb: 'foo' } as unknown as StreamConfig)
    ).toThrowError(
      'Invalid stream config: `streamWeb` cannot be a non-boolean value.'
    )
  })

  it('should throw an error when streamWeb is true and a streamWebFolder is not specified', () => {
    expect(() =>
      validateStreamConfig({
        streamWeb: true,
        streamWebFolder: ''
      } as unknown as StreamConfig)
    ).toThrowError(
      'Invalid stream config: `streamWebFolder` cannot be empty, null or undefined when `streamWeb` is true.'
    )
  })

  it('should throw an error when webSourcePath is empty', () => {
    expect(() =>
      validateStreamConfig({
        streamWeb: true,
        streamWebFolder: '.',
        webSourcePath: ''
      } as unknown as StreamConfig)
    ).toThrowError(
      'Invalid stream config: `webSourcePath` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when webSourcePath is null', () => {
    expect(() =>
      validateStreamConfig({
        streamWeb: true,
        streamWebFolder: '.',
        webSourcePath: null
      } as unknown as StreamConfig)
    ).toThrowError(
      'Invalid stream config: `webSourcePath` cannot be empty, null or undefined.'
    )
  })

  it('should throw an error when webSourcePath is undefined', () => {
    expect(() =>
      validateStreamConfig({
        streamWeb: true,
        streamWebFolder: '.',
        webSourcePath: undefined
      } as unknown as StreamConfig)
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
        assetPaths: [],
        streamServiceName: 'streamWebApp'
      })
    ).toEqual({
      streamWeb: true,
      streamWebFolder: '.',
      webSourcePath: '.',
      assetPaths: [],
      streamServiceName: 'streamWebApp'
    })
  })

  it('should initialise the asset paths if not set', () => {
    expect(
      validateStreamConfig({
        streamWeb: true,
        streamWebFolder: '.',
        webSourcePath: '.',
        assetPaths: [],
        streamServiceName: 'test'
      })
    ).toEqual({
      streamWeb: true,
      streamWebFolder: '.',
      webSourcePath: '.',
      assetPaths: [],
      streamServiceName: 'test'
    })
  })

  it('should initialise the stream service name if not set', () => {
    expect(
      validateStreamConfig({
        streamWeb: true,
        streamWebFolder: '.',
        webSourcePath: '.'
      } as unknown as StreamConfig)
    ).toEqual({
      streamWeb: true,
      streamWebFolder: '.',
      webSourcePath: '.',
      assetPaths: [],
      streamServiceName: 'clickme'
    })
  })
})

describe('validateContextName', () => {
  it('should return the default context name when not specified', () => {
    expect(validateContextName('', ServerType.SasViya)).toEqual(
      'SAS Job Execution compute context'
    )
  })

  it('should return the context name when valid', () => {
    expect(validateContextName('Test Context', ServerType.SasViya)).toEqual(
      'Test Context'
    )
  })
})

describe('validateServerName', () => {
  it('should return the default server name when not specified', () => {
    expect(validateServerName('', ServerType.Sas9)).toEqual('SASApp')
  })

  it('should return the server name when valid', () => {
    expect(validateServerName('Test Server', ServerType.Sas9)).toEqual(
      'Test Server'
    )
  })
})

describe('validateRepositoryName', () => {
  it('should return the default repository name when not specified', () => {
    expect(validateRepositoryName('', ServerType.Sas9)).toEqual('Foundation')
  })

  it('should return the repository name when valid', () => {
    expect(validateRepositoryName('Test Repository', ServerType.Sas9)).toEqual(
      'Test Repository'
    )
  })
})

describe('validateAuthConfig', () => {
  describe('For SASVIYA', () => {
    it('should throw an error when authConfig is null', () => {
      expect(() =>
        validateAuthConfig(null as unknown as AuthConfig)
      ).toThrowError('Invalid auth config: JSON cannot be null or undefined.')
    })

    it('should return the auth config when valid', () => {
      const authConfig: AuthConfig = {
        access_token: 'T35T',
        refresh_token: 'R3FR35H',
        client: 'CL13NT',
        secret: '53CR3T'
      }
      expect(validateAuthConfig(authConfig)).toEqual(authConfig)
    })
  })
  describe('For SAS9', () => {
    it('should throw an error when authConfigSas9 is null', () => {
      expect(() =>
        validateAuthConfigSas9(null as unknown as AuthConfigSas9)
      ).toThrowError(
        'Invalid auth config for sas9: JSON cannot be null or undefined.'
      )
    })

    it('should throw an error when authConfigSas9 contains empty  userName or password', () => {
      const authConfigSas9: AuthConfigSas9 = {
        userName: '',
        password: ''
      }
      expect(() => validateAuthConfigSas9(authConfigSas9)).toThrowError(
        'Invalid auth config for sas9: userName and password can not be empty'
      )
    })

    it('should return the auth config for sas9 when valid', () => {
      const authConfigSas9: AuthConfigSas9 = {
        userName: 'TestUser',
        password: 'TestPassword'
      }
      expect(validateAuthConfigSas9(authConfigSas9)).toEqual(authConfigSas9)
    })
  })
})

describe('validateDocConfig', () => {
  it('should return the doc config when null/undefined', () => {
    expect(validateDocConfig(null as unknown as DocConfig)).toMatchObject({})
    expect(validateDocConfig(undefined as unknown as DocConfig)).toMatchObject(
      {}
    )
    expect(validateDocConfig({} as DocConfig)).toMatchObject({})
  })

  it('should return the doc config when valid', () => {
    expect(
      validateDocConfig({
        displayMacroCore: true,
        enableLineage: false,
        outDirectory: '',
        dataControllerUrl: ''
      })
    ).toEqual({
      displayMacroCore: true,
      enableLineage: false,
      outDirectory: '',
      dataControllerUrl: ''
    })

    expect(
      validateDocConfig({
        displayMacroCore: false,
        enableLineage: true,
        outDirectory: 'my-doc',
        dataControllerUrl: 'http://my-server.com:1234'
      })
    ).toEqual({
      displayMacroCore: false,
      enableLineage: true,
      outDirectory: 'my-doc',
      dataControllerUrl: 'http://my-server.com:1234'
    })

    expect(validateDocConfig({})).toEqual({
      displayMacroCore: undefined,
      enableLineage: undefined,
      outDirectory: undefined,
      dataControllerUrl: undefined
    })
  })

  it('should set dataControllerUrl to undefined when it is null/undefined', () => {
    expect(
      validateDocConfig({
        dataControllerUrl: null as unknown as string
      })
    ).toEqual({
      dataControllerUrl: undefined
    })

    expect(
      validateDocConfig({
        dataControllerUrl: undefined
      })
    ).toEqual({
      dataControllerUrl: undefined
    })
  })

  it('should throw an error when dataControllerUrl is not a valid URL', () => {
    expect(() =>
      validateDocConfig({
        dataControllerUrl: 'my-domain-name'
      })
    ).toThrowError(
      'Invalid Data Controller Url: `dataControllerUrl` should either be an empty string or a valid URL of the form http(s)://your-server.com(:port).'
    )
  })

  it('should return the dataControllerUrl when empty', () => {
    expect(
      validateDocConfig({
        dataControllerUrl: ''
      })
    ).toEqual({
      dataControllerUrl: ''
    })
  })

  it('should return the dataControllerUrl when valid', () => {
    expect(
      validateDocConfig({
        dataControllerUrl: 'http://my-server.com:1234'
      })
    ).toEqual({
      dataControllerUrl: 'http://my-server.com:1234'
    })
  })

  it('should set outDirectory to undefined when it is not string', () => {
    expect(
      validateDocConfig({
        outDirectory: null as unknown as string
      })
    ).toEqual({
      outDirectory: undefined
    })

    expect(
      validateDocConfig({
        outDirectory: false as unknown as string
      })
    ).toEqual({
      outDirectory: undefined
    })

    expect(
      validateDocConfig({
        outDirectory: undefined
      })
    ).toEqual({
      outDirectory: undefined
    })
  })

  it('should return the outDirectory when empty', () => {
    expect(
      validateDocConfig({
        outDirectory: ''
      })
    ).toEqual({
      outDirectory: ''
    })
  })

  it('should return the outDirectory when valid', () => {
    expect(
      validateDocConfig({
        outDirectory: 'my-docs'
      })
    ).toEqual({
      outDirectory: 'my-docs'
    })
  })

  it('should set displayMacroCore/enableLineage to undefined when it is not boolean', () => {
    expect(
      validateDocConfig({
        displayMacroCore: null as unknown as boolean,
        enableLineage: null as unknown as boolean
      })
    ).toEqual({
      displayMacroCore: undefined,
      enableLineage: undefined
    })

    expect(
      validateDocConfig({
        displayMacroCore: undefined,
        enableLineage: undefined
      })
    ).toEqual({
      displayMacroCore: undefined,
      enableLineage: undefined
    })
  })

  it('should return the displayMacroCore/enableLineage when valid', () => {
    expect(
      validateDocConfig({
        displayMacroCore: true,
        enableLineage: true
      })
    ).toEqual({
      displayMacroCore: true,
      enableLineage: true
    })

    expect(
      validateDocConfig({
        displayMacroCore: false,
        enableLineage: false
      })
    ).toEqual({
      displayMacroCore: false,
      enableLineage: false
    })
  })
})

describe('validateTestConfig', () => {
  it('should throw an error when input JSON is null', () => {
    expect(() =>
      validateTestConfig(null as unknown as TestConfig)
    ).toThrowError('Invalid test config: JSON cannot be null or undefined.')
  })

  it('should throw an error when input JSON is undefined', () => {
    expect(() =>
      validateTestConfig(undefined as unknown as TestConfig)
    ).toThrowError('Invalid test config: JSON cannot be null or undefined.')
  })

  let testInput = {}
  let testOutput = {
    initProgram: '',
    termProgram: '',
    macroVars: {},
    testSetUp: '',
    testTearDown: ''
  }
  const testAssertion = () =>
    expect(validateTestConfig(testInput as unknown as TestConfig)).toEqual(
      testOutput
    )

  it('should set init program to the empty string if null', () => {
    testInput = {
      ...testInput,
      initProgram: null
    }

    testAssertion()
  })

  it('should set term program to the empty string if null', () => {
    testInput = { ...testInput, initProgram: 'init', termProgram: null }
    testOutput = { ...testOutput, initProgram: 'init', termProgram: '' }

    testAssertion()
  })

  it('should initialise macro vars if not present', () => {
    testInput = { ...testInput, termProgram: 'term', macroVars: null }
    testOutput = { ...testOutput, termProgram: 'term', macroVars: {} }

    testAssertion()
  })

  it('should set test set up to the empty string if null', () => {
    testInput = { ...testInput, macroVars: {}, testSetUp: null }
    testOutput = { ...testOutput, testSetUp: '' }

    testAssertion()
  })

  it('should set test tear down to the empty string if null', () => {
    testInput = { ...testInput, testSetUp: 'testSetup', testTearDown: null }
    testOutput = { ...testOutput, testSetUp: 'testSetup', testTearDown: '' }

    testAssertion()
  })

  it('should return the service config when valid', () => {
    testInput = { ...testInput, testTearDown: 'testTearDown' }
    testOutput = { ...testOutput, testTearDown: 'testTearDown' }

    testAssertion()
  })
})
