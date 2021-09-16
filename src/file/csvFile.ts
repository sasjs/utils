import { readFile, createFile } from './file'
import stringify from 'csv-stringify/lib/sync'

export const readCsv = async (csvFilePath: string): Promise<string[][]> => {
  const csvContent = await readFile(csvFilePath)

  return csvContent
    .split('\n')
    .filter((row) => row.length)
    .map((data) => data.split(','))
}

export const createCsv = async (
  csvFilePath: string,
  csvData: any[][],
  columns: string[]
) => {
  const output = stringify(csvData, {
    header: csvData.length === 1,
    columns: columns
  })

  await createFile(csvFilePath, output)
}

export const updateCsv = async (
  csvFilePath: string,
  newRecord: any[],
  columns: string[],
  prependId?: string
) => {
  const csvData = await validateInput(
    csvFilePath,
    newRecord,
    columns,
    prependId
  )

  if (prependId) {
    const newId = csvData.length === 0 ? 1 : csvData.length

    const idIndexInColumns = columns.findIndex((col) => col === prependId)

    if (idIndexInColumns > -1) {
      newRecord.splice(idIndexInColumns, 0, newId)
    } else {
      columns.splice(0, 0, prependId)
      newRecord.splice(0, 0, newId)
    }
  }

  csvData.push(newRecord)

  await createCsv(csvFilePath, csvData, columns)
}

const validateInput = async (
  csvFilePath: string,
  newRecord: any[],
  columnsProvided: string[],
  prependId?: string
): Promise<string[][]> => {
  if (newRecord.length !== columnsProvided.length) {
    if (newRecord.length > columnsProvided.length) {
      throw new Error('a record can not have more fields than provided columns')
    }

    if (newRecord.length < columnsProvided.length) {
      // provided columns can/cannot have 'id'
      if (!(prependId && newRecord.length + 1 === columnsProvided.length))
        throw new Error(
          'a record can not have less fields than provided columns'
        )
    }
  }

  const csvData = await readCsv(csvFilePath).catch((_) => [] as string[][])
  const columnsInFile = csvData?.[0]

  if (columnsInFile?.length > columnsProvided.length) {
    // provided columns can/cannot have 'id'
    if (!(prependId && columnsInFile?.length === columnsProvided.length + 1))
      throw new Error(
        'number of provided columns is less than number of existing columns'
      )
  }

  return csvData
}
