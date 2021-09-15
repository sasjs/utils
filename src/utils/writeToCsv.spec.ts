import path from 'path'
import fs from 'fs-extra'
import { writeToCsv } from './writeToCsv'
import * as fileModule from '../file'

const csvFilePath = path.join(__dirname, 'tests-csv')

const data = [
  'firstColumn',
  'secondColumn',
  'thirdColumn',
  'fourthColumn',
  undefined
]

const csvColumns = {
  id: 'id',
  col1: 'Col-1',
  col2: 'Col-2',
  col3: 'Col-3',
  col4: 'Col-4',
  col5: 'Col-5'
}

describe('writeToCsv', () => {
  afterEach(async () => {
    await fileModule.deleteFile(csvFilePath)
  })

  describe('should write to csv file that does not exists already', () => {
    it('should write to csv', async () => {
      await writeToCsv(csvFilePath, data, Object.values(csvColumns))

      const csvContent = await fileModule.readFile(csvFilePath)

      expect(csvContent).toEqual(
        expect.stringContaining(
          '1,firstColumn,secondColumn,thirdColumn,fourthColumn,'
        )
      )
    })

    it('if file already exists then it should append data', async () => {
      for (let i = 1; i <= 3; i++) {
        await writeToCsv(
          csvFilePath,
          [
            `firstColumn-${i}`,
            `secondColumn-${i}`,
            `thirdColumn-${i}`,
            `fourthColumn-${i}`,
            `fifthColumn-${i}`
          ],
          Object.values(csvColumns)
        )
      }

      const csvContent = await fileModule.readFile(csvFilePath)

      const row1 =
        ',firstColumn-1,secondColumn-1,thirdColumn-1,fourthColumn-1,fifthColumn-1'
      const row2 =
        ',firstColumn-2,secondColumn-2,thirdColumn-2,fourthColumn-2,fifthColumn-2'
      const row3 =
        ',firstColumn-3,secondColumn-3,thirdColumn-3,fourthColumn-3,fifthColumn-3'

      expect(csvContent).toEqual(expect.stringContaining(row1))
      expect(csvContent).toEqual(expect.stringContaining(row2))
      expect(csvContent).toEqual(expect.stringContaining(row3))
    })
  })

  describe('should throw error', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    it(`should throw 'Error while checking if csv file exists.'`, async () => {
      jest.spyOn(fileModule, 'fileExists').mockRejectedValueOnce('')
      try {
        await writeToCsv(csvFilePath, data, Object.values(csvColumns))
        expect(false).toBe(true)
      } catch (e) {
        expect(e).toEqual('Error while checking if csv file exists.\n')
      }
    })

    it(`should throw 'Error while creating CSV file.' if file does not exists already`, async () => {
      jest
        .spyOn(fileModule, 'fileExists')
        .mockImplementationOnce(() => Promise.resolve(false))
      jest.spyOn(fileModule, 'createFile').mockRejectedValueOnce('')

      try {
        await writeToCsv(csvFilePath, data, Object.values(csvColumns))
        expect(false).toBe(true)
      } catch (e) {
        expect(e).toEqual('Error while creating CSV file.\n')
      }
    })

    it(`should throw 'Error while reading CSV file.'`, async () => {
      jest.spyOn(fileModule, 'readFile').mockRejectedValueOnce('')

      try {
        await writeToCsv(csvFilePath, data, Object.values(csvColumns))
        expect(false).toBe(true)
      } catch (e) {
        expect(e).toEqual('Error while reading CSV file.\n')
      }
    })

    it(`should throw 'Error while creating CSV file.' when creating file finally`, async () => {
      jest
        .spyOn(fileModule, 'createFile')
        .mockImplementationOnce(async (fileName: string, content: string) => {
          fileName = fileModule.unifyFilePath(fileName)
          if (fileName.split(path.sep).length > 1) {
            let folderPathParts = fileName.split(path.sep)
            folderPathParts.pop()
            const folderPath = folderPathParts.join(path.sep)

            if (!(await fileModule.folderExists(folderPath))) {
              await fileModule.createFolder(folderPath)
            }
          }

          return fs.promises.writeFile(fileName, content)
        })
        .mockRejectedValueOnce('')

      try {
        await writeToCsv(csvFilePath, data, Object.values(csvColumns))
        expect(false).toBe(true)
      } catch (e) {
        expect(e).toEqual('Error while creating CSV file.\n')
      }
    })
  })
})
