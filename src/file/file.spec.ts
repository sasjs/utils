import path from 'path'
import {
  createFile,
  readFile,
  fileExists,
  deleteFile,
  deleteFolder,
  unifyFilePath,
  getRelativePath,
  createFolder,
  listFilesInFolder,
  listSubFoldersInFolder,
  listFilesAndSubFoldersInFolder,
  moveFile
} from './file'

const content = 'test content'

describe('createFile', () => {
  const timestamp = new Date().valueOf()
  const fileName = `test-create-file-${timestamp}.txt`

  it('should create a file', async () => {
    const filePath = path.join(process.cwd(), fileName)

    await createFile(filePath, content)

    await expect(fileExists(filePath)).resolves.toEqual(true)
    await expect(readFile(filePath)).resolves.toEqual(content)

    await deleteFile(filePath)
  })

  it('should create a file in the home directory', async () => {
    const filePath = path.join(fileName)

    await createFile(filePath, content)

    await expect(fileExists(filePath)).resolves.toEqual(true)
    await expect(readFile(filePath)).resolves.toEqual(content)

    await deleteFile(filePath)
  })

  it('should create a file and parent folders', async () => {
    const filePath = path.join(
      process.cwd(),
      'testFolder_1',
      'testFolder_2',
      fileName
    )

    await createFile(filePath, content)

    await expect(fileExists(filePath)).resolves.toEqual(true)
    await expect(readFile(filePath)).resolves.toEqual(content)

    await deleteFolder(path.join(process.cwd(), 'testFolder_1'))
  })
})

describe('fileExists', () => {
  const timestamp = new Date().valueOf()
  const fileName = `test-create-file-${timestamp}.txt`

  it('should return true if a file exists at the given path', async () => {
    const filePath = path.join(process.cwd(), fileName)

    await createFile(filePath, content)

    await expect(fileExists(filePath)).resolves.toEqual(true)

    await deleteFile(filePath)
  })

  it('should return true if a file exists at the given path', async () => {
    const filePath = path.join(process.cwd(), fileName)

    await expect(fileExists(filePath)).resolves.toEqual(false)
  })
})

describe('listFilesInFolder', () => {
  const timestamp = new Date().valueOf()
  const fileName = `test-create-file-${timestamp}.txt`

  it('should return a list of files at the given path', async () => {
    const filePath = path.join(process.cwd(), 'test-folder', fileName)

    await createFile(filePath, content)

    await expect(
      listFilesInFolder(path.join(process.cwd(), 'test-folder'))
    ).resolves.toEqual([fileName])

    await deleteFile(filePath)
  })
})

describe('listSubFoldersInFolder', () => {
  const timestamp = new Date().valueOf()
  const folderName = `test-create-folder-${timestamp}`

  it('should return a list of folders at the given path', async () => {
    const folderPath = path.join(__dirname, folderName)

    await createFolder(folderPath)

    await expect(listSubFoldersInFolder(__dirname)).resolves.toEqual([
      folderName
    ])

    await deleteFolder(folderPath)
  })
})

describe('unifyFilePath', () => {
  it('should unify file path in Unix-like systems', () => {
    const filePath = '/folder/subFolder/file.txt'
    expect(unifyFilePath(filePath, '/')).toEqual(filePath)
  })

  it('should unify file path in Windows system', () => {
    const filePath = '/folder/subFolder/file.txt'
    const expectedFilePath = filePath.replace(/\//g, '\\')
    expect(unifyFilePath(filePath, '\\')).toEqual(expectedFilePath)
  })

  it('should unify file path with mixed separators', () => {
    const filePath = '/folder/subFolder\\file.txt'
    const unixSeparator = '/'
    const winSeparator = '\\'
    const expectedUnixPath = filePath.replace(/\\/g, unixSeparator)
    const expectedWinPath = filePath.replace(/\//g, winSeparator)
    expect(unifyFilePath(filePath, unixSeparator)).toEqual(expectedUnixPath)
    expect(unifyFilePath(filePath, winSeparator)).toEqual(expectedWinPath)
  })

  it('should return file path with custom separator', () => {
    let filePath = '/folder/subFolder/file.txt'
    let expectedFilePath = filePath.replace(/\//g, '$')
    expect(unifyFilePath(filePath, '$')).toEqual(expectedFilePath)
    filePath = '\\folder\\subFolder\\file.txt'
    expectedFilePath = filePath.replace(/\\/g, '$')
    expect(unifyFilePath(filePath, '$', '\\')).toEqual(expectedFilePath)
  })
})

describe('getRelativePath', () => {
  const depthLevel = 8

  it('should return relative path from subfolder', () => {
    const currentFolder = process.cwd()
    let subFolder = path.join(currentFolder, 'subFolder')
    expect(getRelativePath(subFolder, currentFolder)).toEqual(`..${path.sep}`)
    subFolder = path.join(subFolder, 'subFolder')
    expect(getRelativePath(subFolder, currentFolder)).toEqual(
      `..${path.sep}`.repeat(2)
    )
    subFolder = path.join(subFolder, `subFolder${path.sep}`.repeat(depthLevel))
    expect(getRelativePath(subFolder, currentFolder)).toEqual(
      `..${path.sep}`.repeat(2 + depthLevel)
    )
  })

  it('should return relative path to subfolder', () => {
    const currentFolder = process.cwd()
    const subFolderName = 'subFolder'
    let subFolder = path.join(currentFolder, subFolderName)
    expect(getRelativePath(currentFolder, subFolder)).toEqual(
      `.${path.sep}${subFolderName}`
    )
    subFolder = path.join(subFolder, subFolderName)
    expect(getRelativePath(currentFolder, subFolder)).toEqual(
      `.` + `${path.sep}${subFolderName}`.repeat(2)
    )
    subFolder = path.join(
      subFolder,
      `${subFolderName}${path.sep}`.repeat(depthLevel)
    )
    expect(getRelativePath(currentFolder, subFolder)).toEqual(
      `.` + `${path.sep}${subFolderName}`.repeat(2 + depthLevel)
    )
  })

  it('should return relative path from mixed sub folders', () => {
    const currentFolder = process.cwd()
    const subFolderName = 'subFolder'
    const otherSubFolderName = 'otherSubFolder'
    let subFolder = path.join(currentFolder, subFolderName)
    let folder = path.join(currentFolder, otherSubFolderName)
    expect(getRelativePath(folder, subFolder)).toEqual(
      `..${path.sep}${subFolderName}`
    )
    subFolder = path.join(subFolder, subFolderName)
    folder = path.join(folder, otherSubFolderName)
    expect(getRelativePath(folder, subFolder)).toEqual(
      `..${path.sep}`.repeat(2) + path.join(subFolderName, subFolderName)
    )
    subFolder = path.join(
      subFolder,
      `${subFolderName}${path.sep}`.repeat(depthLevel)
    )
    folder = path.join(
      folder,
      `${otherSubFolderName}${path.sep}`.repeat(depthLevel)
    )
    expect(getRelativePath(folder, subFolder)).toEqual(
      `..${path.sep}`.repeat(2 + depthLevel) +
        path.join(...new Array(2 + 8).fill(subFolderName))
    )
  })

  it('should return current folder if FROM and TO paths are equal', () => {
    const fromFolder = process.cwd()
    const toFolder = fromFolder
    expect(getRelativePath(fromFolder, toFolder)).toEqual(`.${path.sep}`)
  })
})

describe('listFilesAndSubFoldersInFolder', () => {
  const timestamp = new Date().valueOf()

  const fileName = `test-create-file-${timestamp}.txt`
  const subFolderFileName = `test-create-sub-file-${timestamp}.txt`
  const subSubFolderFileName = `test-create-sub-sub-file-${timestamp}.txt`

  const testFolderName = `test-create-folder-${timestamp}`
  const subFolderName = `test-create-sub-folder-${timestamp}`
  const subSubFolderName = `test-create-sub-sub-folder-${timestamp}`

  const createTestFoldersAndFiles = async () => {
    const testFolderPath = path.join(__dirname, testFolderName)
    await createFolder(testFolderPath)

    const testSubFolderPath = path.join(testFolderPath, subFolderName)
    await createFolder(testSubFolderPath)

    const testSubSubFolderPath = path.join(testSubFolderPath, subSubFolderName)
    await createFolder(testSubSubFolderPath)

    await createFile(path.join(testFolderPath, fileName), content)
    await createFile(path.join(testSubFolderPath, subFolderFileName), content)
    await createFile(
      path.join(testSubSubFolderPath, subSubFolderFileName),
      content
    )

    return testFolderPath
  }

  it('should return a list files and folders at all levels recursively', async () => {
    const testFolderPath = await createTestFoldersAndFiles()

    const expectedResult = [
      fileName,
      path.join(subFolderName, subFolderFileName),
      path.join(subFolderName, subSubFolderName, subSubFolderFileName)
    ]

    await expect(
      listFilesAndSubFoldersInFolder(testFolderPath)
    ).resolves.toEqual(expectedResult)

    await deleteFolder(testFolderPath)
  })

  it('should return a list files and folders in current folder only', async () => {
    const testFolderPath = await createTestFoldersAndFiles()

    const expectedResult = [fileName, subFolderName]

    await expect(
      listFilesAndSubFoldersInFolder(testFolderPath, false)
    ).resolves.toEqual(expectedResult)

    await deleteFolder(testFolderPath)
  })
})

describe('moveFile', () => {
  it('should move file', async () => {
    const timestamp = new Date().valueOf()

    const fileName = `test-create-file-${timestamp}.txt`
    const movedFileName = `test-moved-file-${timestamp}.txt`
    const oldFilePath = path.join(__dirname, fileName)
    const newFilePath = path.join(__dirname, movedFileName)

    await createFile(oldFilePath, content)

    await moveFile(oldFilePath, newFilePath)

    await expect(fileExists(oldFilePath)).resolves.toEqual(false)
    await expect(fileExists(newFilePath)).resolves.toEqual(true)

    await deleteFile(newFilePath)
  })
})
