import path from 'path'
import { generateCompileProgram } from '../generateCompileProgram'
import { createFile, createFolder, deleteFolder, readFile } from '../../file'

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

  it('should return a sas program ', async () => {
    const program = await generateCompileProgram(folderPath)
    const expectedProgram = await readFile(
      path.join(__dirname, 'files', 'compiledProgram.sas')
    )
    expect(program).toEqual(expectedProgram)
  })
})
