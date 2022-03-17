import path from 'path'
import {
  Configuration,
  JobConfig,
  SASJsFileType,
  ServiceConfig,
  Target,
  TestConfig
} from '../types'
import * as internalModule from '../file'
import { getProgram, ProgramType } from './'
import { CompileTree, Leaf } from '../'

const jobConfig = (root: boolean = true): JobConfig => ({
  initProgram: root
    ? '/configuration/jobinitProgram/configuration_job_init_path'
    : '/target/jobinitProgram/target_job_init_path',
  termProgram: root
    ? '/configuration/jobtermProgram/configuration_job_term_path'
    : '/target/jobtermProgram/target_job_term_path',
  jobFolders: [],
  macroVars: {}
})

const serviceConfig = (root: boolean = true): ServiceConfig => ({
  initProgram: root
    ? '/configuration/serviceinitProgram/configuration_service_init_path'
    : '/target/serviceinitProgram/target_service_init_path',
  termProgram: root
    ? '/configuration/servicetermProgram/configuration_service_term_path'
    : '/target/servicetermProgram/target_service_term_path',
  serviceFolders: [],
  macroVars: {}
})

const testConfig = (root: boolean = true): TestConfig => ({
  initProgram: root
    ? '/configuration/testinitProgram/configuration_test_init_path'
    : '/target/testinitProgram/target_test_init_path',
  termProgram: root
    ? '/configuration/testtermProgram/configuration_test_term_path'
    : '/target/testtermProgram/target_test_term_path',
  macroVars: {},
  testSetUp: '',
  testTearDown: ''
})

const target = {
  jobConfig: jobConfig(false),
  serviceConfig: serviceConfig(false),
  testConfig: testConfig(false)
}
const configuration: Configuration = {
  jobConfig: jobConfig(),
  serviceConfig: serviceConfig(),
  testConfig: testConfig()
}
const buildSourceFolder = ''
const initFileContent = ' INIT FILE CONTENT '
const termFileContent = ' TERM FILE CONTENT '

describe('getInitTerm', () => {
  let compileTree = new CompileTree('test_compileTree.json')

  describe('getInit', () => {
    describe('job', () => {
      test('should return with Init Program of Target', async () => {
        const initJobLeaf = getTestLeaf(jobConfig, false)

        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(initFileContent))

        await expect(
          getProgram(
            {
              target: target as Target,
              buildSourceFolder,
              fileType: SASJsFileType.job,
              compileTree
            },
            ProgramType.Init,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.job),
          filePath: jobConfig(false).initProgram.replace(/\//g, path.sep),
          compileTreeLeaf: initJobLeaf
        })

        await expect(
          getProgram(
            {
              target: target as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.job,
              compileTree
            },
            ProgramType.Init,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.job),
          filePath: jobConfig(false).initProgram.replace(/\//g, path.sep),
          compileTreeLeaf: initJobLeaf
        })
      })

      test('should return with Init Program of Configuration', async () => {
        const initJobLeaf = getTestLeaf(jobConfig)

        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(initFileContent))

        await expect(
          getProgram(
            {
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.job,
              compileTree
            },
            ProgramType.Init,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.job),
          filePath: jobConfig().initProgram.replace(/\//g, path.sep),
          compileTreeLeaf: initJobLeaf
        })

        compileTree = new CompileTree('test_compileTree.json', {})

        const newTarget = { ...target, jobConfig: undefined }

        await expect(
          getProgram(
            {
              target: newTarget as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.job,
              compileTree
            },
            ProgramType.Init,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.job),
          filePath: jobConfig().initProgram.replace(/\//g, path.sep),
          compileTreeLeaf: initJobLeaf
        })
      })
    })

    describe('service', () => {
      test('should return with Init Program of Target', async () => {
        const initServiceLeaf = getTestLeaf(serviceConfig, false)

        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(initFileContent))

        await expect(
          getProgram(
            {
              target: target as Target,
              buildSourceFolder,
              fileType: SASJsFileType.service,
              compileTree
            },
            ProgramType.Init,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.service),
          filePath: serviceConfig(false).initProgram.replace(/\//g, path.sep),
          compileTreeLeaf: initServiceLeaf
        })

        await expect(
          getProgram(
            {
              target: target as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.service,
              compileTree
            },
            ProgramType.Init,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.service),
          filePath: serviceConfig(false).initProgram.replace(/\//g, path.sep),
          compileTreeLeaf: initServiceLeaf
        })
      })

      test('should return with Init Program of Configuration', async () => {
        const initServiceLeaf = getTestLeaf(serviceConfig)

        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(initFileContent))

        await expect(
          getProgram(
            {
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.service,
              compileTree
            },
            ProgramType.Init,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.service),
          filePath: serviceConfig().initProgram.replace(/\//g, path.sep),
          compileTreeLeaf: initServiceLeaf
        })

        const newtarget = { ...target, serviceConfig: undefined }
        await expect(
          getProgram(
            {
              target: newtarget as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.service,
              compileTree
            },
            ProgramType.Init,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.service),
          filePath: serviceConfig().initProgram.replace(/\//g, path.sep),
          compileTreeLeaf: initServiceLeaf
        })
      })
    })

    describe('test', () => {
      test('should return with Init Program of Target', async () => {
        const initTestLeaf = getTestLeaf(testConfig, false)

        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(initFileContent))

        await expect(
          getProgram(
            {
              target: target as Target,
              buildSourceFolder,
              fileType: SASJsFileType.test,
              compileTree
            },
            ProgramType.Init,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.test),
          filePath: testConfig(false).initProgram.replace(/\//g, path.sep),
          compileTreeLeaf: initTestLeaf
        })

        await expect(
          getProgram(
            {
              target: target as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.test,
              compileTree
            },
            ProgramType.Init,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.test),
          filePath: testConfig(false).initProgram.replace(/\//g, path.sep),
          compileTreeLeaf: initTestLeaf
        })
      })

      test('should return with Init Program of Configuration', async () => {
        const initTestLeaf = getTestLeaf(testConfig)

        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(initFileContent))

        await expect(
          getProgram(
            {
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.test,
              compileTree
            },
            ProgramType.Init,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.test),
          filePath: testConfig().initProgram.replace(/\//g, path.sep),
          compileTreeLeaf: initTestLeaf
        })

        const newtarget = { ...target, testConfig: undefined }
        await expect(
          getProgram(
            {
              target: newtarget as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.test,
              compileTree
            },
            ProgramType.Init,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.test),
          filePath: testConfig().initProgram.replace(/\//g, path.sep),
          compileTreeLeaf: initTestLeaf
        })
      })
    })
  })

  describe('getTerm', () => {
    describe('job', () => {
      test('should return with Term Program of Target', async () => {
        const termJobLeaf = getTestLeaf(jobConfig, false, false)

        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(termFileContent))

        await expect(
          getProgram(
            {
              target: target as Target,
              buildSourceFolder,
              fileType: SASJsFileType.job,
              compileTree
            },
            ProgramType.Term,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.job),
          filePath: jobConfig(false).termProgram.replace(/\//g, path.sep),
          compileTreeLeaf: termJobLeaf
        })

        await expect(
          getProgram(
            {
              target: target as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.job,
              compileTree
            },
            ProgramType.Term,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.job),
          filePath: jobConfig(false).termProgram.replace(/\//g, path.sep),
          compileTreeLeaf: termJobLeaf
        })
      })

      test('should return with Term Program of Configuration', async () => {
        const termJobLeaf = getTestLeaf(jobConfig, true, false)

        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(termFileContent))

        await expect(
          getProgram(
            {
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.job,
              compileTree
            },
            ProgramType.Term,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.job),
          filePath: jobConfig().termProgram.replace(/\//g, path.sep),
          compileTreeLeaf: termJobLeaf
        })

        const newtarget = { ...target, jobConfig: undefined }
        await expect(
          getProgram(
            {
              target: newtarget as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.job,
              compileTree
            },
            ProgramType.Term,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.job),
          filePath: jobConfig().termProgram.replace(/\//g, path.sep),
          compileTreeLeaf: termJobLeaf
        })
      })
    })

    describe('service', () => {
      test('should return with Term Program of Target', async () => {
        const termServiceLeaf = getTestLeaf(serviceConfig, false, false)

        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(termFileContent))

        await expect(
          getProgram(
            {
              target: target as Target,
              buildSourceFolder,
              fileType: SASJsFileType.service,
              compileTree
            },
            ProgramType.Term,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.service),
          filePath: serviceConfig(false).termProgram.replace(/\//g, path.sep),
          compileTreeLeaf: termServiceLeaf
        })

        await expect(
          getProgram(
            {
              target: target as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.service,
              compileTree
            },
            ProgramType.Term,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.service),
          filePath: serviceConfig(false).termProgram.replace(/\//g, path.sep),
          compileTreeLeaf: termServiceLeaf
        })
      })

      test('should return with Term Program of Configuration', async () => {
        const termServiceLeaf = getTestLeaf(serviceConfig, true, false)

        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(termFileContent))

        await expect(
          getProgram(
            {
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.service,
              compileTree
            },
            ProgramType.Term,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.service),
          filePath: serviceConfig().termProgram.replace(/\//g, path.sep),
          compileTreeLeaf: termServiceLeaf
        })

        const newtarget = { ...target, serviceConfig: undefined }
        await expect(
          getProgram(
            {
              target: newtarget as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.service,
              compileTree
            },
            ProgramType.Term,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.service),
          filePath: serviceConfig().termProgram.replace(/\//g, path.sep),
          compileTreeLeaf: termServiceLeaf
        })
      })
    })

    describe('test', () => {
      test('should return with Term Program of Target', async () => {
        const termTestLeaf = getTestLeaf(testConfig, false, false)

        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(termFileContent))

        await expect(
          getProgram(
            {
              target: target as Target,
              buildSourceFolder,
              fileType: SASJsFileType.test,
              compileTree
            },
            ProgramType.Term,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.test),
          filePath: testConfig(false).termProgram.replace(/\//g, path.sep),
          compileTreeLeaf: termTestLeaf
        })

        await expect(
          getProgram(
            {
              target: target as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.test,
              compileTree
            },
            ProgramType.Term,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.test),
          filePath: testConfig(false).termProgram.replace(/\//g, path.sep),
          compileTreeLeaf: termTestLeaf
        })
      })

      test('should return with Term Program of Configuration', async () => {
        const termTestLeaf = getTestLeaf(testConfig, true, false)

        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(termFileContent))

        await expect(
          getProgram(
            {
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.test,
              compileTree
            },
            ProgramType.Term,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.test),
          filePath: testConfig().termProgram.replace(/\//g, path.sep),
          compileTreeLeaf: termTestLeaf
        })

        const newtarget = { ...target, testConfig: undefined }
        await expect(
          getProgram(
            {
              target: newtarget as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.test,
              compileTree
            },
            ProgramType.Term,
            compileTree
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.test),
          filePath: testConfig().termProgram.replace(/\//g, path.sep),
          compileTreeLeaf: termTestLeaf
        })
      })
    })
  })
})

const expectedInitContent = (type: SASJsFileType) =>
  `\n* ${type}Init start;\n${initFileContent}\n* ${type}Init end;`
const expectedTermContent = (type: SASJsFileType) =>
  `\n* ${type}Term start;\n${termFileContent}\n* ${type}Term end;`

const getTestLeaf = (
  getConfig: (root: boolean) => JobConfig | TestConfig | ServiceConfig,
  root = true,
  isTerm = true
): Leaf => ({
  content: isTerm ? initFileContent : termFileContent,
  dependencies: [],
  location: internalModule.unifyFilePath(
    getConfig(root)[`${isTerm ? 'init' : 'term'}Program`]
  )
})
