import { readFile, createFile } from './file'
import { writeToString, Row } from '@fast-csv/format'

/**
 * reads a CSV file and returns parsed data
 * @param csvFilePath
 * @returns string[][]
 */
export const readCsv = async (csvFilePath: string): Promise<string[][]> => {
  const csvContent = await readFile(csvFilePath)

  return csvContent
    .split('\n')
    .filter((row) => row.length)
    .map((data) => data.split(','))
}

/**
 * creates a csv file at given path with provided data
 * @param csvFilePath location where to create file
 * @param csvData data which needs to be populated in file
 * @param headers an array of column names
 */
export const createCsv = async <T extends Row[]>(
  csvFilePath: string,
  csvData: T,
  headers: string[]
) => {
  const output = await writeToString(csvData, { headers })
  await createFile(csvFilePath, output)
}

/**
 * append new csv record if file exists else creates a new file
 * @param csvFilePath location where to create file
 * @param newRecord new record which needs to be appended
 * @param columns an array of header for file, i.e column names
 * @param prependId name of id column
 */
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

    // provided columns can/cannot have 'id'
    if (!(prependId && newRecord.length + 1 === columnsProvided.length)) {
      throw new Error('a record can not have less fields than provided columns')
    }
  } else if (prependId && columnsProvided.includes(prependId)) {
    throw new Error('a record can not have more fields than provided columns')
  }

  const csvData = await readCsv(csvFilePath).catch((_) => [] as string[][])
  const columnsInFile = csvData[0]

  if (columnsInFile) {
    if (columnsProvided.length > columnsInFile.length) {
      throw new Error(
        'number of provided columns are greater than number of existing columns'
      )
    }

    if (columnsProvided.length < columnsInFile.length) {
      // provided columns can/cannot have 'id'
      if (!(prependId && columnsProvided.length + 1 === columnsInFile.length))
        throw new Error(
          'number of provided columns are less than number of existing columns'
        )

      const idIndexInColumns = columnsInFile.findIndex(
        (col) => col === prependId
      )

      const columnsWithId = [...columnsProvided]

      if (idIndexInColumns > -1) {
        columnsWithId.splice(idIndexInColumns, 0, prependId)
        if (JSON.stringify(columnsProvided) !== JSON.stringify(columnsWithId)) {
          throw new Error('provided columns does not match existing columns')
        }
      } else {
        throw new Error('provided columns does not match existing columns')
      }
    } else {
      if (JSON.stringify(columnsProvided) !== JSON.stringify(columnsInFile)) {
        throw new Error('provided columns does not match existing columns')
      }

      if (prependId && !columnsProvided.includes(prependId)) {
        throw new Error('can not add new id to existing data')
      }
    }
  }

  return csvData
}
