import fs from 'fs-extra'
import path from 'path'
import { createHash } from 'crypto'
import { HashedFolder } from '../types'
import {
  isFolder,
  getRelativePath,
  listFilesAndSubFoldersInFolder
} from '../file'
/**
 * Hashes each file in each directory, and then hashes the hashes to create a hash for each directory also.
 *
 * Whilst files are hashed in their entirety, the logic for creating a folder hash is as follows:
 *
 * Sort the files and subfolders by name (case sensitive, uppercase then lower)
 * Take the first 100 hashes, concatenate and hash
 * Concatenate this hash with another 100 hashes and hash again
 * Continue until the end of the folder. This is the folder hash
 * If a folder contains other folders, start from the bottom of the tree - the folder hashes cascade upwards so you know immediately if there is a change in a sub/sub directory
 * If the folder has no content (empty) then it is ignored. No hash created.
 *
 * @param {string} folderPath - absolute folder path
 */

export const getHash = async (folderPath: string): Promise<HashedFolder> => {
  return await hashFolder(folderPath)
}

/**
 * It returns a hashed folder tree that contains the local directory resources that are not synced with remote
 */
export function compareHashes(
  localHash: HashedFolder,
  remoteHashMap: { [key: string]: string }
) {
  return hashDifference(localHash, remoteHashMap)
}

export const extractHashArray = (log: string) => {
  if (log.includes('>>weboutBEGIN<<')) {
    try {
      const webout = log
        .split(/>>weboutBEGIN<<(\n|\r\n)/)[1]
        .split(/>>weboutEND<<(\n|\r\n)/)[0]

      const weboutWithoutLF = webout.replace(/\n|\r\n/g, '')
      const jsonWebout = JSON.parse(weboutWithoutLF)
      return jsonWebout.hashes
    } catch (err: any) {
      throw new Error(
        `An error occurred while extracting hashes array from webout: ${err.message}`
      )
    }
  }
}

const hashDifference = (
  localHash: HashedFolder,
  remoteHashMap: { [key: string]: string },
  hashedDiff: HashedFolder = {
    hash: localHash.hash,
    absolutePath: localHash.absolutePath,
    relativePath: localHash.relativePath,
    isFile: false,
    members: []
  }
) => {
  for (const member of localHash.members) {
    if (remoteHashMap[member.relativePath] !== member.hash) {
      if (member.isFile) {
        hashedDiff.members.push(member)
      } else {
        const diff = hashDifference(member as HashedFolder, remoteHashMap, {
          hash: member.hash,
          absolutePath: member.absolutePath,
          relativePath: member.relativePath,
          isFile: false,
          members: []
        })
        hashedDiff.members.push(diff)
      }
    }
  }

  return hashedDiff
}

const hashFile = async (filePath: string) => {
  const fileContent = fs.readFileSync(filePath)

  if (fileContent.length) {
    const hash = createHash('md5')
    hash.update(fileContent)
    return hash.digest('hex').toUpperCase()
  }
}

const hashFolder = async (
  folderPath: string,
  pathRelativeTo: string = folderPath,
  hashedFolder: HashedFolder = {
    hash: '',
    absolutePath: folderPath,
    relativePath: getRelativePath(pathRelativeTo, folderPath),
    isFile: false,
    members: []
  }
) => {
  const filesAndFolders = await listFilesAndSubFoldersInFolder(
    folderPath,
    false
  )
  filesAndFolders.sort()

  let concatenatedHash = ''

  const chunkSize = 100
  for (let i = 0; i < filesAndFolders.length; i += chunkSize) {
    // Take the first 100 hashes, concatenate and hash
    const resources = filesAndFolders.slice(i, i + chunkSize)
    for (const resource of resources) {
      const resourcePath = path.join(folderPath, resource)
      if (await isFolder(resourcePath)) {
        const hashedSubFolder = await hashFolder(resourcePath, pathRelativeTo)
        hashedFolder.members.push(hashedSubFolder)

        concatenatedHash += hashedSubFolder.hash
      } else {
        const hash = await hashFile(resourcePath)

        if (!hash) continue

        hashedFolder.members.push({
          hash,
          absolutePath: resourcePath,
          relativePath: getRelativePath(pathRelativeTo, resourcePath),
          isFile: true
        })

        concatenatedHash += hash
      }
    }

    if (concatenatedHash !== '') {
      const hash = createHash('md5')
      hash.update(concatenatedHash)
      concatenatedHash = hash.digest('hex').toUpperCase()
    }
  }

  hashedFolder.hash = concatenatedHash

  return hashedFolder
}
