import path from 'path'
import {
  JobConfig,
  ServiceConfig,
  SASJsFileType,
  Target,
  readFile,
  Configuration,
  CompileTree,
  removeHeader
} from '..'
import * as internalModule from '../sasjsCli/getInitTerm'
import { mockGetProgram } from '../sasjsCli/getInitTerm'
import { loadDependenciesFile } from './loadDependenciesFile'
import { DependencyHeader, getAllDependencies } from './'

const fakeInit = `/**
  @file serviceinit.sas
  @brief this file is called with every service
  @details  This file is included in *every* service, *after* the macros and *before* the service code.

  ${DependencyHeader.Macro}
  @li mf_abort.sas

**/

options
  DATASTMTCHK=ALLKEYWORDS /* some sites have this enabled */
  PS=MAX /* reduce log size slightly */
;
%put service is starting!!;`

const fakeTerm = `/**
  @file serviceterm.sas
  @brief this file is called at the end of every service
  @details  This file is included at the *end* of every service.

  ${DependencyHeader.Macro}
  @li mf_abort.sas
  @li mf_existds.sas

**/

%put service is finishing.  Thanks, SASjs!;`

const fakeJobInit = `/**
  @file
  @brief This code is inserted into the beginning of each Viya Job.
  @details Inserted during the \`sasjs compile\` step.  Add any code here that
  should go at the beginning of every deployed job.

  The path to this file should be listed in the \`jobInit\` property of the
  sasjsconfig file.

  ${DependencyHeader.DeprecatedInclude}
  @li test.sas TEST

  ${DependencyHeader.Macro}
  @li examplemacro.sas

**/

%example(Job Init is executing!)

%let mylib=WORK;`

const fakeProgramLines = [
  'filename TEST temp;',
  'data _null_;',
  'file TEST lrecl=32767;',
  "put '%put ''Hello, world!'';';",
  'run;'
]

const jobConfig = (root: boolean = true): JobConfig => ({
  initProgram: '',
  termProgram: '',
  jobFolders: [],
  macroVars: root
    ? {
        macrovar1: 'macro job value configuration 1',
        macrovar2: 'macro job value configuration 2'
      }
    : {
        macrovar2: 'macro job value target 2',
        macrovar3: 'macro job value target 3'
      }
})

const serviceConfig = (root: boolean = true): ServiceConfig => ({
  initProgram: '',
  termProgram: '',
  serviceFolders: [],
  macroVars: root
    ? {
        macrovar1: 'macro service value configuration 1',
        macrovar2: 'macro service value configuration 2'
      }
    : {
        macrovar2: 'macro service value target 2',
        macrovar3: 'macro service value target 3'
      }
})

const compiledVars = (type: 'Job' | 'Service') => `* ${type} Variables start;

%let macrovar1=macro ${type.toLowerCase()} value configuration 1;
%let macrovar2=macro ${type.toLowerCase()} value target 2;
%let macrovar3=macro ${type.toLowerCase()} value target 3;

* ${type} Variables end;`

const root = path.join(__dirname, '..', '..')
const macroCorePath = path.join(root, 'node_modules', '@sasjs', 'core')
const buildSourceFolder = ''

const testFiles = path.join(__dirname, 'testFiles')
const servicePath = path.join(testFiles, './service.sas')
const target: Target = {
  jobConfig: jobConfig(false),
  serviceConfig: serviceConfig(false)
} as Target
const configuration: Configuration = {
  jobConfig: jobConfig(),
  serviceConfig: serviceConfig()
}

let compileTree = new CompileTree(
  path.join(process.cwd(), 'test_compileTree.json')
)

describe('loadDependenciesFile', () => {
  let fileContent: string
  beforeAll(async () => {
    fileContent = await readFile(servicePath)
  })

  test(`it should load dependencies for a service with ${DependencyHeader.Macro}`, async () => {
    mockGetProgram(internalModule, fakeInit, fakeTerm)

    const dependencies = await loadDependenciesFile({
      target,
      configuration,
      fileContent,
      macroFolders: [],
      programFolders: [],
      type: SASJsFileType.service,
      buildSourceFolder,
      macroCorePath,
      binaryFolders: [],
      compileTree
    })

    expect(dependencies).toStartWith(compiledVars('Service'))
    expect(/\* ServiceInit start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceInit end;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)
    expect(/%macro mf_existds/.test(dependencies)).toEqual(true)
  })

  test(`it should load dependencies for a job ${DependencyHeader.Macro}`, async () => {
    mockGetProgram(internalModule, fakeInit, fakeTerm)

    const dependencies = await loadDependenciesFile({
      target,
      configuration,
      fileContent,
      macroFolders: [],
      programFolders: [],
      type: SASJsFileType.job,
      buildSourceFolder,
      macroCorePath,
      binaryFolders: [],
      compileTree
    })

    expect(dependencies).toStartWith(compiledVars('Job'))
    expect(/\* JobInit start;/.test(dependencies)).toEqual(true)
    expect(/\* JobInit end;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)
    expect(/%macro mf_existds/.test(dependencies)).toEqual(true)
  })

  test(`it should load programs for a service with ${DependencyHeader.DeprecatedInclude}`, async () => {
    mockGetProgram(internalModule, fakeInit, fakeTerm)

    const dependencies = await loadDependenciesFile({
      target,
      configuration,
      fileContent,
      macroFolders: [path.join(testFiles, './macros')],
      programFolders: [
        path.join(testFiles, './'),
        path.join(testFiles, './services')
      ],
      type: SASJsFileType.service,
      buildSourceFolder,
      macroCorePath,
      binaryFolders: [],
      compileTree
    })

    expect(dependencies).toStartWith(compiledVars('Service'))
    expect(/\* ServiceInit start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceInit end;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)
    expect(/%macro mf_existds/.test(dependencies)).toEqual(true)
  })

  test(`it should load programs for a job ${DependencyHeader.DeprecatedInclude}`, async () => {
    mockGetProgram(internalModule, fakeInit, fakeTerm)

    const dependencies = await loadDependenciesFile({
      target,
      configuration,
      fileContent,
      macroFolders: [path.join(testFiles, './macros')],
      programFolders: [
        path.join(testFiles, './'),
        path.join(testFiles, './services')
      ],
      type: SASJsFileType.job,
      buildSourceFolder,
      macroCorePath,
      binaryFolders: [],
      compileTree
    })

    expect(dependencies).toStartWith(compiledVars('Job'))
    expect(/\* JobInit start;/.test(dependencies)).toEqual(true)
    expect(/\* JobInit end;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)
    expect(/%macro mf_existds/.test(dependencies)).toEqual(true)
  })

  test(`it should load programs for a service with ${DependencyHeader.Include}`, async () => {
    mockGetProgram(internalModule, fakeInit, fakeTerm)

    const dependencies = await loadDependenciesFile({
      target,
      configuration,
      fileContent,
      macroFolders: [path.join(testFiles, './macros')],
      programFolders: [
        path.join(testFiles, './'),
        path.join(testFiles, './services')
      ],
      type: SASJsFileType.service,
      buildSourceFolder,
      macroCorePath,
      binaryFolders: [],
      compileTree
    })

    expect(dependencies).toStartWith(compiledVars('Service'))
    expect(/\* ServiceInit start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceInit end;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)
    expect(/%macro mf_existds/.test(dependencies)).toEqual(true)
  })

  test(`it should load programs for a job ${DependencyHeader.Include}`, async () => {
    mockGetProgram(internalModule, fakeInit, fakeTerm)

    const dependencies = await loadDependenciesFile({
      target,
      configuration,
      fileContent,
      macroFolders: [path.join(testFiles, './macros')],
      programFolders: [
        path.join(testFiles, './'),
        path.join(testFiles, './services')
      ],
      type: SASJsFileType.job,
      buildSourceFolder,
      macroCorePath,
      binaryFolders: [],
      compileTree
    })

    expect(dependencies).toStartWith(compiledVars('Job'))
    expect(/\* JobInit start;/.test(dependencies)).toEqual(true)
    expect(/\* JobInit end;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)
    expect(/%macro mf_existds/.test(dependencies)).toEqual(true)
  })

  test(`it should load dependencies for a job having jobInit's ${DependencyHeader.DeprecatedInclude}`, async () => {
    mockGetProgram(internalModule, fakeJobInit, fakeTerm)

    const dependencies = await loadDependenciesFile({
      target,
      configuration,
      fileContent,
      macroFolders: [path.join(testFiles, './macros')],
      programFolders: [
        path.join(testFiles, './'),
        path.join(testFiles, './services')
      ],
      type: SASJsFileType.job,
      buildSourceFolder,
      macroCorePath,
      binaryFolders: [],
      compileTree
    })

    expect(dependencies).toStartWith(compiledVars('Job'))
    expect(/\* JobInit start;/.test(dependencies)).toEqual(true)
    expect(/\* JobInit end;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro examplemacro/.test(dependencies)).toEqual(true)
    expect(/%macro doesnothing/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)
    expect(/%macro mf_existds/.test(dependencies)).toEqual(true)

    expect(dependencies).toEqual(
      expect.stringContaining(fakeProgramLines.join('\n'))
    )
  })

  test(`it should load dependencies for a job having jobTerm's ${DependencyHeader.DeprecatedInclude}`, async () => {
    mockGetProgram(internalModule, fakeJobInit, fakeTerm)

    const dependencies = await loadDependenciesFile({
      target,
      configuration,
      fileContent,
      macroFolders: [path.join(testFiles, './macros')],
      programFolders: [
        path.join(testFiles, './'),
        path.join(testFiles, './services')
      ],
      type: SASJsFileType.job,
      buildSourceFolder,
      macroCorePath,
      binaryFolders: [],
      compileTree
    })

    expect(dependencies).toStartWith(compiledVars('Job'))
    expect(/\* JobInit start;/.test(dependencies)).toEqual(true)
    expect(/\* JobInit end;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro examplemacro/.test(dependencies)).toEqual(true)
    expect(/%macro doesnothing/.test(dependencies)).toEqual(true) //?
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)

    expect(dependencies).toEqual(
      expect.stringContaining(fakeProgramLines.join('\n'))
    )
  })

  test(`it should load dependencies for a service having serviceInit's ${DependencyHeader.DeprecatedInclude}`, async () => {
    mockGetProgram(internalModule, fakeJobInit, fakeTerm)

    const dependencies = await loadDependenciesFile({
      target,
      configuration,
      fileContent,
      macroFolders: [path.join(testFiles, './macros')],
      programFolders: [
        path.join(testFiles, './'),
        path.join(testFiles, './services')
      ],
      type: SASJsFileType.service,
      buildSourceFolder,
      macroCorePath,
      binaryFolders: [],
      compileTree
    })

    expect(dependencies).toStartWith(compiledVars('Service'))
    expect(/\* ServiceInit start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceInit end;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro examplemacro/.test(dependencies)).toEqual(true)
    expect(/%macro doesnothing/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)
    expect(/%macro mf_existds/.test(dependencies)).toEqual(true)

    expect(dependencies).toEqual(
      expect.stringContaining(fakeProgramLines.join('\n'))
    )
  })

  test(`it should load dependencies for a service having serviceTerm's ${DependencyHeader.DeprecatedInclude}`, async () => {
    mockGetProgram(internalModule, fakeInit, fakeJobInit)

    const dependencies = await loadDependenciesFile({
      target,
      configuration,
      fileContent,
      macroFolders: [path.join(testFiles, './macros')],
      programFolders: [
        path.join(testFiles, './'),
        path.join(testFiles, './services')
      ],
      type: SASJsFileType.service,
      buildSourceFolder,
      macroCorePath,
      binaryFolders: [],
      compileTree
    })

    expect(dependencies).toStartWith(compiledVars('Service'))
    expect(/\* ServiceInit start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceInit end;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro examplemacro/.test(dependencies)).toEqual(true)
    expect(/%macro doesnothing/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)

    expect(dependencies).toEqual(
      expect.stringContaining(fakeProgramLines.join('\n'))
    )
  })

  it(
    'should not add any comments to file content if the SASJsFileType=' +
      SASJsFileType.file,
    async () => {
      const testFileContent = 'test file content'
      const dependencies = await loadDependenciesFile({
        target,
        configuration,
        fileContent: testFileContent,
        macroFolders: [],
        programFolders: [],
        type: SASJsFileType.file,
        buildSourceFolder,
        macroCorePath,
        binaryFolders: [],
        compileTree
      })

      expect(dependencies).toEqual(testFileContent)
    }
  )
})

describe('getAllDependencies', () => {
  const coreBasePath = path.join(
    process.cwd(),
    'node_modules',
    '@sasjs',
    'core',
    'base'
  )
  const dep1FileName = 'mf_abort.sas'
  const dep1Path = path.join(coreBasePath, dep1FileName)
  const dep2Path = path.join(coreBasePath, 'mf_existds.sas')

  it('should get all dependencies with compile tree', async () => {
    const dep1 = `%macro mf_abort(mac=mf_abort.sas, type=deprecated, msg=, iftrue=%str(1=1)
)/*/STORE SOURCE*/;

%if not(%eval(%unquote(&iftrue))) %then %return;

%put NOTE: ///  mf_abort macro executing //;
%if %length(&mac)>0 %then %put NOTE- called by &mac;
%put NOTE - &msg;

%abort;

%mend mf_abort;`
    const expectedOutput = `${dep1}
${removeHeader(await readFile(dep2Path))}`

    compileTree = new CompileTree(
      path.join(process.cwd(), 'test_compileTree.json'),
      {
        [dep1FileName]: {
          content: dep1,
          dependencies: [],
          location: dep1FileName
        }
      }
    )

    await expect(
      getAllDependencies([dep1Path, dep2Path], compileTree)
    ).resolves.toEqual(expectedOutput)
  })

  it('should get all dependencies without compile tree', async () => {
    const expectedOutput = `${await readFile(dep1Path)}
${await readFile(dep2Path)}`

    await expect(getAllDependencies([dep1Path, dep2Path])).resolves.toEqual(
      expectedOutput
    )
  })
})
