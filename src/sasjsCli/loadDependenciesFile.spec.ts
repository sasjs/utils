import path from 'path'
import {
  JobConfig,
  ServiceConfig,
  SASJsFileType,
  Target,
  readFile,
  Configuration
} from '..'
import * as internalModule from '../sasjsCli/getInitTerm'
import { loadDependenciesFile } from './loadDependenciesFile'

const fakeInit = `/**
  @file serviceinit.sas
  @brief this file is called with every service
  @details  This file is included in *every* service, *after* the macros and *before* the service code.

  <h4> SAS Macros </h4>
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

  <h4> SAS Macros </h4>
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

  <h4> SAS Programs </h4>
  @li test.sas TEST

  <h4> SAS Macros </h4>
  @li examplemacro.sas

**/

%example(Job Init is executing!)

%let mylib=WORK;`

const fakeJobInit2 = `/**
  @file
  @brief This code is inserted into the beginning of each Viya Job.
  @details Inserted during the \`sasjs compile\` step.  Add any code here that
  should go at the beginning of every deployed job.

  The path to this file should be listed in the \`jobInit\` property of the
  sasjsconfig file.

  <h4> SAS Includes </h4>
  @li test.sas TEST

  <h4> SAS Macros </h4>
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
describe('loadDependenciesFile', () => {
  let fileContent: string
  beforeAll(async () => {
    fileContent = await readFile(servicePath)
  })

  test('it should load dependencies for a service with <h4> SAS MAcros </h4>', async () => {
    jest.spyOn(internalModule, 'getInit').mockImplementation(() =>
      Promise.resolve({
        content: `\n* ServiceInit start;\n${fakeInit}\n* ServiceInit end;`,
        filePath: ''
      })
    )
    jest.spyOn(internalModule, 'getTerm').mockImplementation(() =>
      Promise.resolve({
        content: `\n* ServiceTerm start;\n${fakeTerm}\n* ServiceTerm end;`,
        filePath: ''
      })
    )

    const dependencies = await loadDependenciesFile({
      target,
      configuration,
      fileContent,
      macroFolders: [],
      programFolders: [],
      type: SASJsFileType.service,
      buildSourceFolder,
      macroCorePath,
      binaryFolders: []
    })

    expect(dependencies).toStartWith(compiledVars('Service'))
    expect(/\* ServiceInit start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceInit end;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)
    expect(/%macro mf_existds/.test(dependencies)).toEqual(true)
  })

  test('it should load dependencies for a job <h4> SAS MAcros </h4>', async () => {
    jest.spyOn(internalModule, 'getInit').mockImplementation(() =>
      Promise.resolve({
        content: `\n* JobInit start;\n${fakeInit}\n* JobInit end;`,
        filePath: ''
      })
    )
    jest.spyOn(internalModule, 'getTerm').mockImplementation(() =>
      Promise.resolve({
        content: `\n* JobTerm start;\n${fakeTerm}\n* JobTerm end;`,
        filePath: ''
      })
    )

    const dependencies = await loadDependenciesFile({
      target,
      configuration,
      fileContent,
      macroFolders: [],
      programFolders: [],
      type: SASJsFileType.job,
      buildSourceFolder,
      macroCorePath,
      binaryFolders: []
    })

    expect(dependencies).toStartWith(compiledVars('Job'))
    expect(/\* JobInit start;/.test(dependencies)).toEqual(true)
    expect(/\* JobInit end;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)
    expect(/%macro mf_existds/.test(dependencies)).toEqual(true)
  })

  test('it should load programs for a service with <h4> SAS Programs </h4>', async () => {
    jest.spyOn(internalModule, 'getInit').mockImplementation(() =>
      Promise.resolve({
        content: `\n* ServiceInit start;\n${fakeJobInit}\n* ServiceInit end;`,
        filePath: ''
      })
    )
    jest.spyOn(internalModule, 'getTerm').mockImplementation(() =>
      Promise.resolve({
        content: `\n* ServiceTerm start;\n${fakeTerm}\n* ServiceTerm end;`,
        filePath: ''
      })
    )

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
      binaryFolders: []
    })

    expect(dependencies).toStartWith(compiledVars('Service'))
    expect(/\* ServiceInit start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceInit end;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)
    expect(/%macro mf_existds/.test(dependencies)).toEqual(true)
  })

  test('it should load programs for a job <h4> SAS Programs </h4>', async () => {
    jest.spyOn(internalModule, 'getInit').mockImplementation(() =>
      Promise.resolve({
        content: `\n* JobInit start;\n${fakeJobInit}\n* JobInit end;`,
        filePath: ''
      })
    )
    jest.spyOn(internalModule, 'getTerm').mockImplementation(() =>
      Promise.resolve({
        content: `\n* JobTerm start;\n${fakeTerm}\n* JobTerm end;`,
        filePath: ''
      })
    )

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
      binaryFolders: []
    })

    expect(dependencies).toStartWith(compiledVars('Job'))
    expect(/\* JobInit start;/.test(dependencies)).toEqual(true)
    expect(/\* JobInit end;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)
    expect(/%macro mf_existds/.test(dependencies)).toEqual(true)
  })

  test('it should load programs for a service with <h4> SAS Includes </h4>', async () => {
    jest.spyOn(internalModule, 'getInit').mockImplementation(() =>
      Promise.resolve({
        content: `\n* ServiceInit start;\n${fakeJobInit2}\n* ServiceInit end;`,
        filePath: ''
      })
    )
    jest.spyOn(internalModule, 'getTerm').mockImplementation(() =>
      Promise.resolve({
        content: `\n* ServiceTerm start;\n${fakeTerm}\n* ServiceTerm end;`,
        filePath: ''
      })
    )

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
      binaryFolders: []
    })

    expect(dependencies).toStartWith(compiledVars('Service'))
    expect(/\* ServiceInit start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceInit end;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* ServiceTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)
    expect(/%macro mf_existds/.test(dependencies)).toEqual(true)
  })

  test('it should load programs for a job <h4> SAS Includes </h4>', async () => {
    jest.spyOn(internalModule, 'getInit').mockImplementation(() =>
      Promise.resolve({
        content: `\n* JobInit start;\n${fakeJobInit2}\n* JobInit end;`,
        filePath: ''
      })
    )
    jest.spyOn(internalModule, 'getTerm').mockImplementation(() =>
      Promise.resolve({
        content: `\n* JobTerm start;\n${fakeTerm}\n* JobTerm end;`,
        filePath: ''
      })
    )

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
      binaryFolders: []
    })

    expect(dependencies).toStartWith(compiledVars('Job'))
    expect(/\* JobInit start;/.test(dependencies)).toEqual(true)
    expect(/\* JobInit end;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)
    expect(/%macro mf_existds/.test(dependencies)).toEqual(true)
  })

  test("it should load dependencies for a job having jobInit's <h4> SAS Programs </h4>", async () => {
    jest.spyOn(internalModule, 'getInit').mockImplementation(() =>
      Promise.resolve({
        content: `\n* JobInit start;\n${fakeJobInit}\n* JobInit end;`,
        filePath: ''
      })
    )
    jest.spyOn(internalModule, 'getTerm').mockImplementation(() =>
      Promise.resolve({
        content: `\n* JobTerm start;\n${fakeTerm}\n* JobTerm end;`,
        filePath: ''
      })
    )

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
      binaryFolders: []
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

  test("it should load dependencies for a job having jobTerm's <h4> SAS Programs </h4>", async () => {
    jest.spyOn(internalModule, 'getInit').mockImplementation(() =>
      Promise.resolve({
        content: `\n* JobInit start;\n${fakeInit}\n* JobInit end;`,
        filePath: ''
      })
    )
    jest.spyOn(internalModule, 'getTerm').mockImplementation(() =>
      Promise.resolve({
        content: `\n* JobTerm start;\n${fakeJobInit}\n* JobTerm end;`,
        filePath: ''
      })
    )

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
      binaryFolders: []
    })

    expect(dependencies).toStartWith(compiledVars('Job'))
    expect(/\* JobInit start;/.test(dependencies)).toEqual(true)
    expect(/\* JobInit end;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm start;/.test(dependencies)).toEqual(true)
    expect(/\* JobTerm end;/.test(dependencies)).toEqual(true)
    expect(/%macro examplemacro/.test(dependencies)).toEqual(true)
    expect(/%macro doesnothing/.test(dependencies)).toEqual(true)
    expect(/%macro mf_abort/.test(dependencies)).toEqual(true)

    expect(dependencies).toEqual(
      expect.stringContaining(fakeProgramLines.join('\n'))
    )
  })

  test("it should load dependencies for a service having serviceInit's <h4> SAS Programs </h4>", async () => {
    jest.spyOn(internalModule, 'getInit').mockImplementation(() =>
      Promise.resolve({
        content: `\n* ServiceInit start;\n${fakeJobInit}\n* ServiceInit end;`,
        filePath: ''
      })
    )
    jest.spyOn(internalModule, 'getTerm').mockImplementation(() =>
      Promise.resolve({
        content: `\n* ServiceTerm start;\n${fakeTerm}\n* ServiceTerm end;`,
        filePath: ''
      })
    )

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
      binaryFolders: []
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

  test("it should load dependencies for a service having serviceTerm's <h4> SAS Programs </h4>", async () => {
    jest.spyOn(internalModule, 'getInit').mockImplementation(() =>
      Promise.resolve({
        content: `\n* ServiceInit start;\n${fakeInit}\n* ServiceInit end;`,
        filePath: ''
      })
    )
    jest.spyOn(internalModule, 'getTerm').mockImplementation(() =>
      Promise.resolve({
        content: `\n* ServiceTerm start;\n${fakeJobInit}\n* ServiceTerm end;`,
        filePath: ''
      })
    )

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
      binaryFolders: []
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
})