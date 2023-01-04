import fs from 'fs-extra'
import rimraf from 'rimraf'
import path from 'path'
import { asyncForEach } from '../utils'
import * as file from '.'

export async function fileExists(filePath: string): Promise<boolean> {
  return fs.promises
    .access(filePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false)
}

export async function folderExists(folderPath: string): Promise<boolean> {
  return fs.promises
    .access(folderPath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false)
}

export async function isFolder(inputPath: string): Promise<boolean> {
  return fs.promises
    .lstat(inputPath)
    .then((stat) => stat.isDirectory())
    .catch(() => false)
}

export async function readFile(
  fileName: string,
  encoding: BufferEncoding = 'utf8'
): Promise<string> {
  return fs.promises.readFile(fileName, encoding)
}

export async function readFileBinary(fileName: string): Promise<Buffer> {
  return fs.promises.readFile(fileName)
}

export async function listFilesInFolder(folderName: string): Promise<string[]> {
  return fs.promises
    .readdir(folderName, { withFileTypes: true })
    .then((list) => list.filter((f) => !f.isDirectory()).map((f) => f.name))
}

export async function listIniFilesInFolder(folderName: string) {
  return (await listFilesInFolder(folderName)).filter((name) =>
    name.endsWith('.ini')
  )
}

export async function listSasFilesInFolder(
  folderName: string,
  recurse: boolean = false,
  ignoredFolders: string[] = []
) {
  const filesAndFolders = await listFilesAndSubFoldersInFolder(
    folderName,
    recurse,
    ignoredFolders
  )
  const sasFiles = filesAndFolders.filter((f) => f.endsWith('.sas'))
  return sasFiles
}

export async function listSubFoldersInFolder(
  folderName: string
): Promise<string[]> {
  return fs.promises
    .readdir(folderName, { withFileTypes: true })
    .then((list) => list.filter((f) => f.isDirectory()).map((f) => f.name))
}

export async function listFilesAndSubFoldersInFolder(
  folderName: string,
  recurse: boolean = true,
  ignoredFolders: string[] = []
): Promise<string[]> {
  return fs.promises
    .readdir(folderName, { withFileTypes: true })
    .then(async (list) => {
      if (recurse) {
        const subFolders = list.filter((f) => f.isDirectory())

        if (subFolders.length) {
          let subFoldersFilesAndFolders: string[] = []

          await asyncForEach(
            list.filter((f) => f.isDirectory()),
            async (f) => {
              const subFolder = f.name
              if (!ignoredFolders.includes(subFolder)) {
                const subPath = path.join(folderName, subFolder)

                subFoldersFilesAndFolders = [
                  ...subFoldersFilesAndFolders,
                  ...(await listFilesAndSubFoldersInFolder(subPath)).map((f) =>
                    path.join(subFolder, f)
                  )
                ]
              }
            }
          )

          return [
            ...list.filter((f) => !f.isDirectory()).map((f) => f.name),
            ...subFoldersFilesAndFolders
          ]
        }
      }

      return list.map((f) => f.name)
    })
}

export async function createFolder(
  folderName: string
): Promise<string | undefined> {
  return fs.promises.mkdir(folderName, { recursive: true })
}

export async function createFile(
  fileName: string,
  content: string,
  encoding?: BufferEncoding
): Promise<void> {
  fileName = unifyFilePath(fileName)
  if (fileName.split(path.sep).length > 1) {
    let folderPathParts = fileName.split(path.sep)
    folderPathParts.pop()
    const folderPath = folderPathParts.join(path.sep)

    if (!(await folderExists(folderPath))) {
      await createFolder(folderPath)
    }
  }

  return fs.promises.writeFile(fileName, content, encoding)
}

export async function deleteFile(filePath: string) {
  return fs.remove(filePath)
}

export async function deleteFolder(folderPath: string) {
  return new Promise<void>((resolve, reject) => {
    rimraf(folderPath, {}, (error) => {
      if (error) return reject(error)

      return resolve()
    })
  })
}

export function unifyFilePath(
  filePath: string,
  separator = path.sep,
  separatorToReplace = '/'
) {
  const separators: { [key: string]: string } = { unix: '/', win: '\\' }

  let osSeparator = Object.keys(separators).find(
    (key) => separators[key] === separator
  )

  if (osSeparator) {
    const notValidSeparator =
      separators[Object.keys(separators).find((key) => key !== osSeparator)!]

    osSeparator = separators[osSeparator]

    return filePath.split(notValidSeparator).join(osSeparator)
  }

  return filePath.split(separatorToReplace).join(separator)
}

export function getRelativePath(from: string, to: string): string {
  const fromFolders = from.split(path.sep)
  const toFolders = to.split(path.sep)

  let commonPathParts: string[] = []
  let relativePathParts: string[] = []

  fromFolders.forEach((fromFolder: string, i: number) => {
    if (toFolders[i] !== undefined && fromFolders[i] === toFolders[i]) {
      commonPathParts.push(fromFolder)
    } else {
      if (fromFolder) relativePathParts.push(fromFolder)
    }
  })

  const commonPath = commonPathParts.join(path.sep)

  const leadingPathSepRegExp = new RegExp(`^${path.sep.replace(/\\/g, '\\\\')}`)
  const trailingPathSepRegExp = new RegExp(
    `${path.sep.replace(/\\/g, '\\\\')}$`
  )

  const relativePath =
    (relativePathParts.length
      ? `..${path.sep}`.repeat(relativePathParts.length)
      : `.${path.sep}`) +
    to
      .replace(commonPath, '')
      .replace(leadingPathSepRegExp, '')
      .replace(trailingPathSepRegExp, '')

  return relativePath
}

export async function moveFile(
  oldFilePath: string,
  newFilePath: string
): Promise<void> {
  return fs.promises.rename(oldFilePath, newFilePath)
}

export async function copy(source: string, destination: string) {
  return fs.copy(source, destination)
}

export const pathSepEscaped = path.sep.replace(/\\/g, '\\\\')

export async function base64EncodeImageFile(filePath: string) {
  return readFileBinary(filePath).then((data) => {
    let extname = path.extname(filePath).substr(1) || 'png'

    if (extname === 'svg') {
      extname = 'svg+xml'
    }

    return 'data:image/' + extname + ';base64,' + data.toString('base64')
  })
}

export async function base64EncodeFile(filePath: string) {
  return fs.promises.readFile(filePath, { encoding: 'base64' })
}

export function getRealPath(file: string) {
  return fs.realpathSync(file)
}

export async function createWriteStream(filePath: string) {
  const isFilePresent = await file.fileExists(filePath)
  if (isFilePresent) {
    return fs.createWriteStream(filePath, { flags: 'a' })
  }

  await file.createFile(filePath, '')
  return fs.createWriteStream(filePath, { flags: 'a' })
}

export const createReadStream = async (filePath: string) =>
  fs.createReadStream(filePath)

export const testFileRegExp = /\.test\.(\d+\.)?sas$/i

export const isTestFile = (fileName: string) => testFileRegExp.test(fileName)
