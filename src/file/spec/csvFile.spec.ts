import path from 'path'
import fs from 'fs-extra'
import { updateCsv, readCsv, createCsv } from '../csvFile'
import * as fileModule from '../file'

const csvFilePath = path.join(__dirname, 'tests-csv')

const data = ['firstColumn', null, 'thirdColumn', 'fourthColumn', undefined]

const csvColumnsWithoutId = {
  col1: 'Col-1',
  col2: 'Col-2',
  col3: 'Col-3',
  col4: 'Col-4',
  col5: 'Col-5'
}

const lessColumns = {
  col1: 'Col-1',
  col2: 'Col-2',
  col3: 'Col-3',
  id: 'id'
}

describe('updateToCsv', () => {
  afterEach(async () => {
    await fileModule.deleteFile(csvFilePath)
  })

  describe('when file does not exists previously', () => {
    describe('should write to csv', () => {
      afterEach(async () => {
        await fileModule.deleteFile(csvFilePath)
      })

      it('if provided record contains one lesser field than provided columns and id column is specified', async () => {
        await updateCsv(
          csvFilePath,
          ['firstColumn', null, 'thirdColumn', 'fourthColumn', undefined],
          ['col-1', 'col-2', 'col-3', 'id', 'col-4', 'col-5'],
          'id'
        )

        const csvContent = await fileModule.readFile(csvFilePath)

        expect(csvContent).toEqual(
          expect.stringContaining('firstColumn,,thirdColumn,1,fourthColumn,')
        )
      })

      it('if provided record contains equal number of fields as provided columns and no id column is specified', async () => {
        await updateCsv(
          csvFilePath,
          ['firstColumn', 'secondColumn', 'thirdColumn'],
          ['col-1', 'col-2', 'col-3']
        )

        const csvContent = await fileModule.readFile(csvFilePath)

        expect(csvContent).toEqual(
          expect.stringContaining('firstColumn,secondColumn,thirdColumn')
        )
      })

      it('if provided record contains equal number of fields as provided columns and id column is also specified but not included in provided columns', async () => {
        await updateCsv(
          csvFilePath,
          ['firstColumn', 'secondColumn', 'thirdColumn'],
          ['col-1', 'col-2', 'col-3'],
          'id'
        )

        const csvContent = await fileModule.readFile(csvFilePath)

        expect(csvContent).toEqual(
          expect.stringContaining('1,firstColumn,secondColumn,thirdColumn')
        )
      })
    })

    describe('should throw error', () => {
      it('if provided record contains equal number of fields as provided columns and id column is also specified which is included in provided columns', async () => {
        await expect(
          updateCsv(
            csvFilePath,
            data,
            Object.values(csvColumnsWithoutId),
            'Col-1'
          )
        ).rejects.toThrow(
          'a record can not have more fields than provided columns'
        )
      })

      it('if record has more fields than provided columns', async () => {
        await expect(
          updateCsv(csvFilePath, data, Object.values(lessColumns))
        ).rejects.toThrow(
          'a record can not have more fields than provided columns'
        )
      })

      it('if record has lesser fields than provided columns', async () => {
        await expect(
          updateCsv(csvFilePath, ['col-1', 'col-2'], Object.values(lessColumns))
        ).rejects.toThrow(
          'a record can not have less fields than provided columns'
        )
      })
    })
  })

  describe('when file exists already', () => {
    beforeEach(async () => {
      await updateCsv(
        csvFilePath,
        ['firstColumn-1', 'secondColumn-1', 'thirdColumn-1'],
        ['col-1', 'col-2', 'col-3'],
        'id'
      )
    })

    afterEach(async () => {
      await fileModule.deleteFile(csvFilePath)
    })

    describe('should write to csv', () => {
      it('when provided columns match existing columns', async () => {
        await updateCsv(
          csvFilePath,
          ['firstColumn-2', 'secondColumn-2', 'thirdColumn-2'],
          ['id', 'col-1', 'col-2', 'col-3'],
          'id'
        )

        const csvContent = await fileModule.readFile(csvFilePath)

        const row1 = '1,firstColumn-1,secondColumn-1,thirdColumn-1'
        const row2 = '2,firstColumn-2,secondColumn-2,thirdColumn-2'

        expect(csvContent).toEqual(expect.stringContaining(row1))
        expect(csvContent).toEqual(expect.stringContaining(row2))
      })
    })

    describe('should throw error', () => {
      it('if number of provided columns are greater than number of existing columns', async () => {
        await expect(
          updateCsv(
            csvFilePath,
            [
              'firstColumn-2',
              'secondColumn-2',
              'thirdColumn-2',
              'fourthColumn-2'
            ],
            ['col-1', 'id', 'col-2', 'col-3', 'col-4'],
            'id'
          )
        ).rejects.toThrow(
          'number of provided columns are greater than number of existing columns'
        )
      })

      it('if number of provided columns are less than number of existing columns', async () => {
        await expect(
          updateCsv(
            csvFilePath,
            ['firstColumn-2', 'secondColumn-2'],
            ['col-1', 'col-2'],
            'id'
          )
        ).rejects.toThrow(
          'number of provided columns are less than number of existing columns'
        )
      })

      it('if provided columns does not match existing', async () => {
        await expect(
          updateCsv(
            csvFilePath,
            ['firstColumn-2', 'secondColumn-2', 'thirdColumn-2'],
            ['col-1', 'id', 'col-2', 'col-3'],
            'id'
          )
        ).rejects.toThrow('provided columns does not match existing columns')
      })

      it('if trying to add new id', async () => {
        await expect(
          updateCsv(
            csvFilePath,
            ['firstColumn-2', 'secondColumn-2', 'thirdColumn-2'],
            ['id', 'col-1', 'col-2', 'col-3'],
            'newId'
          )
        ).rejects.toThrow('can not add new id to existing data')
      })
    })
  })
})
