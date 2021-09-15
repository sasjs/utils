import { readFile, createFile } from './file'
import { prefixMessage } from '../error'
import stringify from 'csv-stringify/lib/sync'

export async function UpdateCsv(
  csvFilePath: string,
  record: Array<any>,
  columns: Array<string>,
  prependId?: string
) {
  if (record.length > columns.length) {
    throw 'a record can not have more fields than provided columns'
  }

  const csvData = await readCsv(csvFilePath).catch((err) => [] as Array<any>)

  if (csvData.length > 0 && csvData[0].length > columns.length)
    throw 'number of provided columns is less than number of existing columns'

  const id = csvData.length === 0 ? 1 : csvData.length

  if (prependId) {
    const idIndex = findIdColumn(columns, prependId)
    csvData.push(addId(id, idIndex, record))
  } else csvData.push(record)

  await createCsv(csvFilePath, csvData, columns)
}

export async function readCsv(csvFilePath: string) {
  const csvContent = await readFile(csvFilePath).catch((err) => {
    throw prefixMessage(err, 'Error while reading CSV file.\n')
  })

  return csvContent
    .split('\n')
    .filter((row) => row.length)
    .map((data) => data.split(','))
}

export async function createCsv(
  csvFilePath: string,
  csvData: Array<Array<any>>,
  columns: Array<string>
) {
  const output = stringify(csvData, {
    header: csvData.length === 1,
    columns: columns
  })
  await createFile(csvFilePath, output).catch((err) => {
    throw prefixMessage(err, 'Error while creating CSV file.\n')
  })
}

function findIdColumn(columns: Array<string>, idCol: string) {
  const index = columns.findIndex((col) => col === idCol)
  if (index < 0) throw 'Id column could not be found in given columns'
  return index
}

function addId(id: number, idIndex: number, record: Array<any>) {
  if (idIndex > record.length) {
    let i = record.length
    let isIdAppended = false
    while (!isIdAppended) {
      if (i === idIndex) {
        record.push(id)
        isIdAppended = true
      } else record.push('')
      i++
    }
  } else {
    record.splice(idIndex, 0, id)
  }
  return record
}
