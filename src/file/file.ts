import fs from 'fs'
import path from 'path'
import { asyncForEach } from '../utils'

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

export async function readFile(fileName: string): Promise<string> {
  return fs.promises.readFile(fileName, 'utf-8')
}

export async function listFilesInFolder(folderName: string): Promise<string[]> {
  return fs.promises
    .readdir(folderName, { withFileTypes: true })
    .then((list) => list.filter((f) => !f.isDirectory()).map((f) => f.name))
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
  recurse: boolean = true
): Promise<string[]> {
  return fs.promises
    .readdir(folderName, { withFileTypes: true })
    .then(async (list) => {
      if (recurse) {
        const subFolders = list.filter((f) => f.isDirectory())

        if (subFolders.length) {
          let subFoldersFilesAndFolders: string[] = []
          const rootFolder = folderName.split(path.sep).pop() as string

          await asyncForEach(
            list.filter((f) => f.isDirectory()),
            async (f) => {
              const subFolder = f.name
              const subPath = path.join(folderName, subFolder)

              subFoldersFilesAndFolders = [
                ...subFoldersFilesAndFolders,
                ...(await listFilesAndSubFoldersInFolder(subPath)).map((f) =>
                  path.join(subFolder, f)
                )
              ]
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

export async function createFolder(folderName: string): Promise<string> {
  return fs.promises.mkdir(folderName, { recursive: true })
}

export async function createFile(
  fileName: string,
  content: string
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

  return fs.promises.writeFile(fileName, content)
}

export async function deleteFile(filePath: string) {
  return fs.promises.unlink(filePath)
}

export async function deleteFolder(folderPath: string) {
  return fs.promises.rmdir(folderPath, { recursive: true })
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
    (!path.sep.match(/\\/)
      ? relativePathParts.length
        ? `..${path.sep}`.repeat(relativePathParts.length)
        : `.${path.sep}`
      : '') +
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
