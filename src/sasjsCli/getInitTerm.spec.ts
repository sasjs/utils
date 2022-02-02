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

const jobConfig = (root: boolean = true): JobConfig => ({
  initProgram: root
    ? '/configuration/jobinitProgram/path'
    : '/target/jobinitProgram/path',
  termProgram: root
    ? '/configuration/jobtermProgram/path'
    : '/target/jobtermProgram/path',
  jobFolders: [],
  macroVars: {}
})

const serviceConfig = (root: boolean = true): ServiceConfig => ({
  initProgram: root
    ? '/configuration/serviceinitProgram/path'
    : '/target/serviceinitProgram/path',
  termProgram: root
    ? '/configuration/servicetermProgram/path'
    : '/target/servicetermProgram/path',
  serviceFolders: [],
  macroVars: {}
})

const testConfig = (root: boolean = true): TestConfig => ({
  initProgram: root
    ? '/configuration/testinitProgram/path'
    : '/target/testinitProgram/path',
  termProgram: root
    ? '/configuration/testtermProgram/path'
    : '/target/testtermProgram/path',
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
  describe('getInit', () => {
    describe('job', () => {
      test('should return with Init Program of Target', async () => {
        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(initFileContent))

        await expect(
          getProgram(
            {
              target: target as Target,
              buildSourceFolder,
              fileType: SASJsFileType.job
            },
            ProgramType.Init
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.job),
          filePath: jobConfig(false).initProgram.replace(/\//g, path.sep)
        })

        await expect(
          getProgram(
            {
              target: target as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.job
            },
            ProgramType.Init
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.job),
          filePath: jobConfig(false).initProgram.replace(/\//g, path.sep)
        })
      })

      test('should return with Init Program of Configuration', async () => {
        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(initFileContent))

        await expect(
          getProgram(
            {
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.job
            },
            ProgramType.Init
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.job),
          filePath: jobConfig().initProgram.replace(/\//g, path.sep)
        })

        const newtarget = { ...target, jobConfig: undefined }
        await expect(
          getProgram(
            {
              target: newtarget as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.job
            },
            ProgramType.Init
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.job),
          filePath: jobConfig().initProgram.replace(/\//g, path.sep)
        })
      })
    })

    describe('service', () => {
      test('should return with Init Program of Target', async () => {
        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(initFileContent))

        await expect(
          getProgram(
            {
              target: target as Target,
              buildSourceFolder,
              fileType: SASJsFileType.service
            },
            ProgramType.Init
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.service),
          filePath: serviceConfig(false).initProgram.replace(/\//g, path.sep)
        })

        await expect(
          getProgram(
            {
              target: target as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.service
            },
            ProgramType.Init
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.service),
          filePath: serviceConfig(false).initProgram.replace(/\//g, path.sep)
        })
      })

      test('should return with Init Program of Configuration', async () => {
        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(initFileContent))

        await expect(
          getProgram(
            {
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.service
            },
            ProgramType.Init
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.service),
          filePath: serviceConfig().initProgram.replace(/\//g, path.sep)
        })

        const newtarget = { ...target, serviceConfig: undefined }
        await expect(
          getProgram(
            {
              target: newtarget as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.service
            },
            ProgramType.Init
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.service),
          filePath: serviceConfig().initProgram.replace(/\//g, path.sep)
        })
      })
    })

    describe('test', () => {
      test('should return with Init Program of Target', async () => {
        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(initFileContent))

        await expect(
          getProgram(
            {
              target: target as Target,
              buildSourceFolder,
              fileType: SASJsFileType.test
            },
            ProgramType.Init
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.test),
          filePath: testConfig(false).initProgram.replace(/\//g, path.sep)
        })

        await expect(
          getProgram(
            {
              target: target as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.test
            },
            ProgramType.Init
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.test),
          filePath: testConfig(false).initProgram.replace(/\//g, path.sep)
        })
      })

      test('should return with Init Program of Configuration', async () => {
        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(initFileContent))

        await expect(
          getProgram(
            {
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.test
            },
            ProgramType.Init
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.test),
          filePath: testConfig().initProgram.replace(/\//g, path.sep)
        })

        const newtarget = { ...target, testConfig: undefined }
        await expect(
          getProgram(
            {
              target: newtarget as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.test
            },
            ProgramType.Init
          )
        ).resolves.toEqual({
          content: expectedInitContent(SASJsFileType.test),
          filePath: testConfig().initProgram.replace(/\//g, path.sep)
        })
      })
    })
  })

  describe('getTerm', () => {
    describe('job', () => {
      test('should return with Term Program of Target', async () => {
        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(termFileContent))

        await expect(
          getProgram(
            {
              target: target as Target,
              buildSourceFolder,
              fileType: SASJsFileType.job
            },
            ProgramType.Term
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.job),
          filePath: jobConfig(false).termProgram.replace(/\//g, path.sep)
        })

        await expect(
          getProgram(
            {
              target: target as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.job
            },
            ProgramType.Term
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.job),
          filePath: jobConfig(false).termProgram.replace(/\//g, path.sep)
        })
      })

      test('should return with Term Program of Configuration', async () => {
        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(termFileContent))

        await expect(
          getProgram(
            {
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.job
            },
            ProgramType.Term
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.job),
          filePath: jobConfig().termProgram.replace(/\//g, path.sep)
        })

        const newtarget = { ...target, jobConfig: undefined }
        await expect(
          getProgram(
            {
              target: newtarget as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.job
            },
            ProgramType.Term
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.job),
          filePath: jobConfig().termProgram.replace(/\//g, path.sep)
        })
      })
    })

    describe('service', () => {
      test('should return with Term Program of Target', async () => {
        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(termFileContent))

        await expect(
          getProgram(
            {
              target: target as Target,
              buildSourceFolder,
              fileType: SASJsFileType.service
            },
            ProgramType.Term
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.service),
          filePath: serviceConfig(false).termProgram.replace(/\//g, path.sep)
        })

        await expect(
          getProgram(
            {
              target: target as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.service
            },
            ProgramType.Term
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.service),
          filePath: serviceConfig(false).termProgram.replace(/\//g, path.sep)
        })
      })

      test('should return with Term Program of Configuration', async () => {
        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(termFileContent))

        await expect(
          getProgram(
            {
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.service
            },
            ProgramType.Term
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.service),
          filePath: serviceConfig().termProgram.replace(/\//g, path.sep)
        })

        const newtarget = { ...target, serviceConfig: undefined }
        await expect(
          getProgram(
            {
              target: newtarget as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.service
            },
            ProgramType.Term
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.service),
          filePath: serviceConfig().termProgram.replace(/\//g, path.sep)
        })
      })
    })

    describe('test', () => {
      test('should return with Term Program of Target', async () => {
        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(termFileContent))

        await expect(
          getProgram(
            {
              target: target as Target,
              buildSourceFolder,
              fileType: SASJsFileType.test
            },
            ProgramType.Term
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.test),
          filePath: testConfig(false).termProgram.replace(/\//g, path.sep)
        })

        await expect(
          getProgram(
            {
              target: target as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.test
            },
            ProgramType.Term
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.test),
          filePath: testConfig(false).termProgram.replace(/\//g, path.sep)
        })
      })

      test('should return with Term Program of Configuration', async () => {
        jest
          .spyOn(internalModule, 'readFile')
          .mockImplementation(() => Promise.resolve(termFileContent))

        await expect(
          getProgram(
            {
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.test
            },
            ProgramType.Term
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.test),
          filePath: testConfig().termProgram.replace(/\//g, path.sep)
        })

        const newtarget = { ...target, testConfig: undefined }
        await expect(
          getProgram(
            {
              target: newtarget as Target,
              configuration,
              buildSourceFolder,
              fileType: SASJsFileType.test
            },
            ProgramType.Term
          )
        ).resolves.toEqual({
          content: expectedTermContent(SASJsFileType.test),
          filePath: testConfig().termProgram.replace(/\//g, path.sep)
        })
      })
    })
  })
})

const expectedInitContent = (type: SASJsFileType) =>
  `\n* ${type}Init start;\n${initFileContent}\n* ${type}Init end;`
const expectedTermContent = (type: SASJsFileType) =>
  `\n* ${type}Term start;\n${termFileContent}\n* ${type}Term end;`
