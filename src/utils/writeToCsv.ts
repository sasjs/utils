import { createFile, fileExists, readFile } from '../file'
import { prefixMessage } from '../error'
import stringify from 'csv-stringify/lib/sync'

export const writeToCsv = async (
  csvFileRealPath: string,
  data: any,
  columns: any
) => {
  if (
    !(await fileExists(csvFileRealPath).catch((err) => {
      throw prefixMessage(err, 'Error while checking if csv file exists.\n')
    }))
  ) {
    await createFile(csvFileRealPath, '').catch((err) => {
      throw prefixMessage(err, 'Error while creating CSV file.\n')
    })
  }

  let csvContent = await readFile(csvFileRealPath).catch((err) => {
    throw prefixMessage(err, 'Error while reading CSV file.\n')
  })

  let csvData = csvContent
    .split('\n')
    .filter((row) => row.length)
    .map((data) => data.split(','))

  const id = csvData.length === 0 ? 1 : csvData.length

  csvData.push([id, ...data])

  const output = stringify(csvData, {
    header: csvData.length === 1,
    columns: columns
  })

  await createFile(csvFileRealPath, output).catch((err) => {
    throw prefixMessage(err, 'Error while creating CSV file.\n')
  })
}
