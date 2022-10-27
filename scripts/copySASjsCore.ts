import path from 'path'
import { asyncForEach, copy, createFolder, deleteFolder } from '../src'

const root = path.join(__dirname, '..')

const sasjsCorePath = path.join(root, 'node_modules', '@sasjs', 'core')

export const macrosPath = path.join(root, 'build', 'macros')

/**
 * We need @sasjs/core macros at runtime for compilation of programs but we can't directly import in javascript file.
 * So, we have to read the macro file. For this we can't use node_modules folder as it will not be available after lib is build/packed.
 * Therefore, we have to copy the macros to a folder in the post build step that we can read at runtime.
 */

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
