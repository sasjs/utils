import path from 'path'
import { asyncForEach, copy, createFolder, deleteFolder } from '../src'

const root = path.join(__dirname, '..')

const sasjsCorePath = path.join(root, 'node_modules', '@sasjs', 'core')

export const macrosPath = path.join(root, 'build', 'macros')

/**
 * We need @sasjs/core macros at runtime for compilation of programs, but we
 * can't directly import them like a javascript file.
 * So, we have to read the macro files directly. For this we can't use the
 * node_modules folder, as it will not always be available after the library is
 * built / packed (eg in the VS Code extension)
 * Therefore, we copy the macros to a folder in the post build step, so that we
 * can read them at runtime.
 *
 * These macros are / will be used by the sasjs fs command / fs sync utilites
 * as well as for general compilation of SAS Jobs, Services, and Tests.
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
