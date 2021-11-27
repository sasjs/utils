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
        filePath: jobConfig(false).initProgram.replace(/\//g, path.sep)
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
        filePath: jobConfig(false).initProgram.replace(/\//g, path.sep)
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
        filePath: jobConfig().initProgram.replace(/\//g, path.sep)
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
        filePath: jobConfig().initProgram.replace(/\//g, path.sep)
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
        filePath: serviceConfig(false).initProgram.replace(/\//g, path.sep)
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
        filePath: serviceConfig(false).initProgram.replace(/\//g, path.sep)
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
        filePath: serviceConfig().initProgram.replace(/\//g, path.sep)
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
        filePath: serviceConfig().initProgram.replace(/\//g, path.sep)
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
        filePath: testConfig(false).initProgram.replace(/\//g, path.sep)
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
        filePath: testConfig(false).initProgram.replace(/\//g, path.sep)
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
        filePath: testConfig().initProgram.replace(/\//g, path.sep)
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
        .mockImplementation(() => Promise.resolve(''))

      await expect(
        getTerm({
          target: target as Target,
          buildSourceFolder,
          type: SASJsFileType.job
        })
      ).resolves.toEqual({
        content: '',
        filePath: jobConfig(false).termProgram.replace(/\//g, path.sep)
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
        filePath: jobConfig(false).termProgram.replace(/\//g, path.sep)
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
        filePath: jobConfig().termProgram.replace(/\//g, path.sep)
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
        filePath: jobConfig().termProgram.replace(/\//g, path.sep)
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
        filePath: serviceConfig(false).termProgram.replace(/\//g, path.sep)
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
        filePath: serviceConfig(false).termProgram.replace(/\//g, path.sep)
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
        filePath: serviceConfig().termProgram.replace(/\//g, path.sep)
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
        filePath: serviceConfig().termProgram.replace(/\//g, path.sep)
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
        filePath: testConfig(false).termProgram.replace(/\//g, path.sep)
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
        filePath: testConfig(false).termProgram.replace(/\//g, path.sep)
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
        filePath: testConfig().termProgram.replace(/\//g, path.sep)
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
        filePath: testConfig().termProgram.replace(/\//g, path.sep)
      })
    })
  })
})
