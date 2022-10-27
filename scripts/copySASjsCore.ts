import path from 'path'
import { asyncForEach, copy, createFolder, deleteFolder } from '../src'

const root = path.join(__dirname, '..')

const sasjsCorePath = path.join(root, 'node_modules', '@sasjs', 'core')

export const macrosPath = path.join(root, 'build', 'macros')

export const copySASjsCore = async () => {
  await deleteFolder(macrosPath)
  await createFolder(macrosPath)

  const foldersToCopy = ['base']

  await asyncForEach(foldersToCopy, async (coreSubFolder) => {
    const coreSubFolderPath = path.join(sasjsCorePath, coreSubFolder)

    await copy(coreSubFolderPath, macrosPath)
  })
}

copySASjsCore()
