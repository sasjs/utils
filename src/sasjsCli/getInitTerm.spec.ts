import {
  Configuration,
  JobConfig,
  SASJsFileType,
  ServiceConfig,
  Target,
  TestConfig
} from '../types'
import * as internalModule from '../file'
import { getInit, getTerm } from './'

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

describe('getInit', () => {
  describe('job', () => {
    test('should return with Init Program of Target', async () => {
      jest
        .spyOn(internalModule, 'readFile')
        .mockImplementation(() => Promise.resolve(''))

      await expect(
        getInit({
          target: target as Target,
          buildSourceFolder,
          type: SASJsFileType.job
        })
      ).resolves.toEqual({
        content: '',
        filePath: jobConfig(false).initProgram
      })

      await expect(
        getInit({
          target: target as Target,
          configuration,
          buildSourceFolder,
          type: SASJsFileType.job
        })
      ).resolves.toEqual({
        content: '',
        filePath: jobConfig(false).initProgram
      })
    })
    test('should return with Init Program of Configuration', async () => {
      jest
        .spyOn(internalModule, 'readFile')
        .mockImplementation(() => Promise.resolve(''))

      await expect(
        getInit({
          configuration,
          buildSourceFolder,
          type: SASJsFileType.job
        })
      ).resolves.toEqual({
        content: '',
        filePath: jobConfig().initProgram
      })

      const newtarget = { ...target, jobConfig: undefined }
      await expect(
        getInit({
          target: newtarget as Target,
          configuration,
          buildSourceFolder,
          type: SASJsFileType.job
        })
      ).resolves.toEqual({
        content: '',
        filePath: jobConfig().initProgram
      })
    })
  })
  describe('service', () => {
    test('should return with Init Program of Target', async () => {
      jest
        .spyOn(internalModule, 'readFile')
        .mockImplementation(() => Promise.resolve(''))

      await expect(
        getInit({
          target: target as Target,
          buildSourceFolder,
          type: SASJsFileType.service
        })
      ).resolves.toEqual({
        content: '',
        filePath: serviceConfig(false).initProgram
      })

      await expect(
        getInit({
          target: target as Target,
          configuration,
          buildSourceFolder,
          type: SASJsFileType.service
        })
      ).resolves.toEqual({
        content: '',
        filePath: serviceConfig(false).initProgram
      })
    })
    test('should return with Init Program of Configuration', async () => {
      jest
        .spyOn(internalModule, 'readFile')
        .mockImplementation(() => Promise.resolve(''))

      await expect(
        getInit({
          configuration,
          buildSourceFolder,
          type: SASJsFileType.service
        })
      ).resolves.toEqual({
        content: '',
        filePath: serviceConfig().initProgram
      })

      const newtarget = { ...target, serviceConfig: undefined }
      await expect(
        getInit({
          target: newtarget as Target,
          configuration,
          buildSourceFolder,
          type: SASJsFileType.service
        })
      ).resolves.toEqual({
        content: '',
        filePath: serviceConfig().initProgram
      })
    })
  })
  describe('test', () => {
    test('should return with Init Program of Target', async () => {
      jest
        .spyOn(internalModule, 'readFile')
        .mockImplementation(() => Promise.resolve(''))

      await expect(
        getInit({
          target: target as Target,
          buildSourceFolder,
          type: SASJsFileType.test
        })
      ).resolves.toEqual({
        content: '',
        filePath: testConfig(false).initProgram
      })

      await expect(
        getInit({
          target: target as Target,
          configuration,
          buildSourceFolder,
          type: SASJsFileType.test
        })
      ).resolves.toEqual({
        content: '',
        filePath: testConfig(false).initProgram
      })
    })
    test('should return with Init Program of Configuration', async () => {
      jest
        .spyOn(internalModule, 'readFile')
        .mockImplementation(() => Promise.resolve(''))

      await expect(
        getInit({
          configuration,
          buildSourceFolder,
          type: SASJsFileType.test
        })
      ).resolves.toEqual({
        content: '',
        filePath: testConfig().initProgram
      })

      const newtarget = { ...target, testConfig: undefined }
      await expect(
        getInit({
          target: newtarget as Target,
          configuration,
          buildSourceFolder,
          type: SASJsFileType.test
        })
      ).resolves.toEqual({
        content: '',
        filePath: testConfig().initProgram
      })
    })
  })
})
describe('getTerm', () => {
  describe('job', () => {
    test('should return with Term Program of Target', async () => {
      jest
        .spyOn(internalModule, 'readFile')
        .mockImplementation(() => Promise.resolve(''))

      await expect(
        getTerm({
          target: target as Target,
          buildSourceFolder,
          type: SASJsFileType.job
        })
      ).resolves.toEqual({
        content: '',
        filePath: jobConfig(false).termProgram
      })

      await expect(
        getTerm({
          target: target as Target,
          configuration,
          buildSourceFolder,
          type: SASJsFileType.job
        })
      ).resolves.toEqual({
        content: '',
        filePath: jobConfig(false).termProgram
      })
    })
    test('should return with Term Program of Configuration', async () => {
      jest
        .spyOn(internalModule, 'readFile')
        .mockImplementation(() => Promise.resolve(''))

      await expect(
        getTerm({
          configuration,
          buildSourceFolder,
          type: SASJsFileType.job
        })
      ).resolves.toEqual({
        content: '',
        filePath: jobConfig().termProgram
      })

      const newtarget = { ...target, jobConfig: undefined }
      await expect(
        getTerm({
          target: newtarget as Target,
          configuration,
          buildSourceFolder,
          type: SASJsFileType.job
        })
      ).resolves.toEqual({
        content: '',
        filePath: jobConfig().termProgram
      })
    })
  })
  describe('service', () => {
    test('should return with Term Program of Target', async () => {
      jest
        .spyOn(internalModule, 'readFile')
        .mockImplementation(() => Promise.resolve(''))

      await expect(
        getTerm({
          target: target as Target,
          buildSourceFolder,
          type: SASJsFileType.service
        })
      ).resolves.toEqual({
        content: '',
        filePath: serviceConfig(false).termProgram
      })

      await expect(
        getTerm({
          target: target as Target,
          configuration,
          buildSourceFolder,
          type: SASJsFileType.service
        })
      ).resolves.toEqual({
        content: '',
        filePath: serviceConfig(false).termProgram
      })
    })
    test('should return with Term Program of Configuration', async () => {
      jest
        .spyOn(internalModule, 'readFile')
        .mockImplementation(() => Promise.resolve(''))

      await expect(
        getTerm({
          configuration,
          buildSourceFolder,
          type: SASJsFileType.service
        })
      ).resolves.toEqual({
        content: '',
        filePath: serviceConfig().termProgram
      })

      const newtarget = { ...target, serviceConfig: undefined }
      await expect(
        getTerm({
          target: newtarget as Target,
          configuration,
          buildSourceFolder,
          type: SASJsFileType.service
        })
      ).resolves.toEqual({
        content: '',
        filePath: serviceConfig().termProgram
      })
    })
  })
  describe('test', () => {
    test('should return with Term Program of Target', async () => {
      jest
        .spyOn(internalModule, 'readFile')
        .mockImplementation(() => Promise.resolve(''))

      await expect(
        getTerm({
          target: target as Target,
          buildSourceFolder,
          type: SASJsFileType.test
        })
      ).resolves.toEqual({
        content: '',
        filePath: testConfig(false).termProgram
      })

      await expect(
        getTerm({
          target: target as Target,
          configuration,
          buildSourceFolder,
          type: SASJsFileType.test
        })
      ).resolves.toEqual({
        content: '',
        filePath: testConfig(false).termProgram
      })
    })
    test('should return with Term Program of Configuration', async () => {
      jest
        .spyOn(internalModule, 'readFile')
        .mockImplementation(() => Promise.resolve(''))

      await expect(
        getTerm({
          configuration,
          buildSourceFolder,
          type: SASJsFileType.test
        })
      ).resolves.toEqual({
        content: '',
        filePath: testConfig().termProgram
      })

      const newtarget = { ...target, testConfig: undefined }
      await expect(
        getTerm({
          target: newtarget as Target,
          configuration,
          buildSourceFolder,
          type: SASJsFileType.test
        })
      ).resolves.toEqual({
        content: '',
        filePath: testConfig().termProgram
      })
    })
  })
})
