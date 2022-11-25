import path from 'path'
import { generateCompileProgram } from '../generateCompileProgram'
import { createFile, createFolder, deleteFolder, readFile } from '../../file'
import * as utilsModule from '../../utils/utils'

describe('createFSCompileProgram', () => {
  const timestamp = new Date().valueOf()
  const folderName = `test-create-folder-${timestamp}`
  const folderPath = path.join(__dirname, folderName)
  const subFolderPath = path.join(folderPath, 'subFolder')
  const filePath = path.join(subFolderPath, 'file.txt')

  beforeAll(async () => {
    await createFolder(folderPath)
    await createFolder(subFolderPath)
    await createFile(filePath, 'this is dummy file content')
  })

  afterAll(async () => {
    await deleteFolder(folderPath)
  })

  beforeEach(() => {
    mockGetMacrosPath()
  })

  it('should return a sas program ', async () => {
    const program = await generateCompileProgram(folderPath)

    expect(program).toContain('%macro mf_mkdir')
    expect(program).toContain('%mf_mkdir(&fsTarget)')
    expect(program).toContain(`%mf_mkdir(&fsTarget/subFolder)`)
  })
})

const mockGetMacrosPath = () => {
  jest
    .spyOn(utilsModule, 'getMacrosPath')
    .mockImplementation(() =>
      path.join(
        __dirname,
        '..',
        '..',
        '..',
        'node_modules',
        '@sasjs',
        'core',
        'base'
      )
    )
}
