import fs from 'fs-extra'
import path from 'path'
import { asyncForEach } from '../utils'
import * as file from '.'
import { LineEndings } from '../types'

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

/**
 * Folders already walked, keyed by resolved path.
 *
 * A caller asks for one file name at a time across the whole search path, and
 * asks thousands of times over the same handful of folders - a compile resolves
 * every declared macro of every file against the project's macro folders and
 * @sasjs/core. The walk is the expensive part (one `readdir` per directory, per
 * name), and what it finds does not change while a command runs, so each folder
 * is walked once.
 */
const folderIndex = new Map<string, Map<string, string[]>>()

/**
 * Returns the paths of every file named `fileName` at or below `folder`.
 * Node's own fs covers this now, so it replaces the unmaintained `find`
 * package. Unreadable folders are skipped rather than throwing.
 *
 * The first lookup in a folder indexes it; later lookups are answered from that
 * index. `clearFileSearchIndex` forgets them, which is what a caller that adds
 * or removes files after a lookup has to do.
 */
export function findFilesByName(fileName: string, folder: string): string[] {
  const key = path.resolve(folder)
  let index = folderIndex.get(key)

  if (!index) {
    index = indexFolder(folder)

    // A folder that cannot be read is not remembered: it can be created later
    // in the same process, and a cached empty result would hide its files.
    if (index) folderIndex.set(key, index)
  }

  // A copy, so a caller adding to the result cannot change the index.
  return index ? [...(index.get(fileName) || [])] : []
}

/**
 * Forgets every indexed folder.
 *
 * Anything that creates, renames or deletes files and then looks them up in the
 * same process has to call this first, or the lookup answers from the tree as
 * it was when the folder was first searched.
 */
export const clearFileSearchIndex = () => folderIndex.clear()

/**
 * Walks a folder once, collecting every file path by name. Returns undefined
 * when the folder itself cannot be read; unreadable subfolders are skipped, as
 * they always have been.
 */
const indexFolder = (folder: string): Map<string, string[]> | undefined => {
  try {
    fs.readdirSync(folder, { withFileTypes: true })
  } catch (_) {
    return undefined
  }

  const index = new Map<string, string[]>()

  const walk = (dir: string) => {
    let entries: fs.Dirent[]

    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch (_) {
      return
    }

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        walk(entryPath)
        continue
      }

      const paths = index.get(entry.name)

      if (paths) paths.push(entryPath)
      else index.set(entry.name, [entryPath])
    }
  }

  walk(folder)

  return index
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
/**
 * This function returns a list of all SAS files in a folder
 *
 * @param folderName a string that contains the folder path
 * @param recurse (optional) a boolean that identifies the searching of sas files in nested folders recursively
 * @param ignoredFolders (optional) a string array that contains the folders to be ignored in recursive search
 * @returns a string array containing sas files paths relatived to folderName
 */
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
                  ...(
                    await listFilesAndSubFoldersInFolder(
                      subPath,
                      recurse,
                      ignoredFolders
                    )
                  ).map((f) => path.join(subFolder, f))
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
  return fs.rm(folderPath, {
    recursive: true,
    force: true
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

/**
 * Returns end of line sequence
 * @param content to get end of line sequence.
 * @returns CRLF(\r\n) or LF(\n) end of line sequence
 */
export const getLineEnding = (content: string) =>
  new RegExp(LineEndings.CRLF).test(content) ? LineEndings.CRLF : LineEndings.LF
