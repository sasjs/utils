import fs, { ReadStream, WriteStream } from 'fs-extra'
import path from 'path'
import {
  isFolder,
  createFile,
  readFile,
  fileExists,
  folderExists,
  deleteFile,
  deleteFolder,
  unifyFilePath,
  getRelativePath,
  createFolder,
  listFilesInFolder,
  listSasFilesInFolder,
  listIniFilesInFolder,
  listSubFoldersInFolder,
  listFilesAndSubFoldersInFolder,
  moveFile,
  copy,
  base64EncodeFile,
  base64EncodeImageFile,
  getRealPath,
  createWriteStream,
  createReadStream,
  getLineEnding
} from '../file'
import * as fileModule from '../file'
import { generateTimestamp } from '../../time'
import { svgBase64EncodedUnix, svgBase64EncodedWin } from './expectedOutputs'
import { isWindows } from '../../utils'
import { LineEndings } from '../../types'

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

describe('listIniFilesInFolder', () => {
  const timestamp = new Date().valueOf()
  const fileName = `test-create-file-${timestamp}.ini`
  const fileName2 = `test-create-file-${timestamp}.ini.txt`
  const fileName3 = `test-create-file-${timestamp}.temp`

  it('should return a list of files at the given path', async () => {
    const filePath = path.join(process.cwd(), 'test-folder', fileName)
    const filePath2 = path.join(process.cwd(), 'test-folder', fileName2)
    const filePath3 = path.join(process.cwd(), 'test-folder', fileName3)

    await createFile(filePath, content)
    await createFile(filePath2, content)
    await createFile(filePath3, content)

    await expect(
      listIniFilesInFolder(path.join(process.cwd(), 'test-folder'))
    ).resolves.toEqual([fileName])

    await deleteFile(filePath)
    await deleteFile(filePath2)
    await deleteFile(filePath3)
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

describe('listSasFilesInFolder', () => {
  const timestamp = new Date().valueOf()

  const fileName = `test-create-file-${timestamp}.sas`
  const subFolderFileName = `test-create-sub-file-${timestamp}.sas`
  const subSubFolderFileName = `test-create-sub-sub-file-${timestamp}.sas`

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

  it('should return a list of sas files present at all levels', async () => {
    const testFolderPath = await createTestFoldersAndFiles()

    const expectedResult = [
      fileName,
      path.join(subFolderName, subFolderFileName),
      path.join(subFolderName, subSubFolderName, subSubFolderFileName)
    ]

    await expect(listSasFilesInFolder(testFolderPath, true)).resolves.toEqual(
      expectedResult
    )

    await deleteFolder(testFolderPath)
  })

  it('should return a list of sas files in current folder only', async () => {
    const testFolderPath = await createTestFoldersAndFiles()

    const expectedResult = [fileName]

    await expect(listSasFilesInFolder(testFolderPath, false)).resolves.toEqual(
      expectedResult
    )

    await deleteFolder(testFolderPath)
  })

  it('should return a list of sas files present at all levels except a specific folder', async () => {
    const testFolderPath = await createTestFoldersAndFiles()

    const expectedResult = [
      fileName,
      path.join(subFolderName, subFolderFileName)
    ]

    const ignoredFolders = [subSubFolderName]

    await expect(
      listSasFilesInFolder(testFolderPath, true, ignoredFolders)
    ).resolves.toEqual(expectedResult)

    await deleteFolder(testFolderPath)
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

describe('copy', () => {
  it('should copy file', async () => {
    const timestamp = new Date().valueOf()

    const fileName = `test-create-file-${timestamp}.txt`
    const movedFileName = `test-moved-file-${timestamp}.txt`
    const oldFilePath = path.join(__dirname, fileName)
    const newFilePath = path.join(__dirname, movedFileName)

    await createFile(oldFilePath, content)

    await copy(oldFilePath, newFilePath)

    await expect(fileExists(oldFilePath)).resolves.toEqual(true)
    await expect(fileExists(newFilePath)).resolves.toEqual(true)

    await deleteFile(oldFilePath)
    await deleteFile(newFilePath)
  })
})

describe('base64EncodeFile', () => {
  it('should encode file to base64', async () => {
    const timestamp = new Date().valueOf()

    const fileNameToEncode = 'test.txt'
    const filePath = path.join(__dirname, fileNameToEncode)

    const fileBase64Encoded = 'c2FtcGxlIGZpbGUgZm9yIGVuY29kaW5n'

    await expect(base64EncodeFile(filePath)).resolves.toEqual(fileBase64Encoded)
  })
})

describe('base64EncodeImageFile', () => {
  it('should encode png to base64', async () => {
    let fileNameToEncode = 'test.png'
    const getFilePath = (fileName: string) => path.join(__dirname, fileName)

    const fileBase64Encoded =
      'data:image/png;base64,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'

    await expect(
      base64EncodeImageFile(getFilePath(fileNameToEncode))
    ).resolves.toEqual(fileBase64Encoded)

    fileNameToEncode = fileNameToEncode.replace('.png', '')

    await expect(
      base64EncodeImageFile(getFilePath(fileNameToEncode))
    ).resolves.toEqual(fileBase64Encoded)
  })

  it('should encode svg to base64', async () => {
    const fileNameToEncode = 'test.svg'
    const filePath = path.join(__dirname, fileNameToEncode)

    await expect(base64EncodeImageFile(filePath)).resolves.toEqual(
      isWindows() ? svgBase64EncodedWin : svgBase64EncodedUnix
    )
  })
})

describe('getRealPath', () => {
  it('should get real path when .. used', () => {
    const testPath = path.join(__dirname, '..', 'spec')

    expect(getRealPath(testPath)).toEqual(path.join(__dirname))
  })

  it('should get real path when . used', () => {
    const testPath = path.join(__dirname, '..', `.${path.sep}spec`)

    expect(getRealPath(testPath)).toEqual(path.join(__dirname))
  })
})

describe('createReadStream', () => {
  const filePath = path.join(__dirname, 'testfile.txt')
  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.mock('fs-extra')
    jest.mock('../file')
    jest
      .spyOn(fs, 'createReadStream')
      .mockImplementation(() => ({} as unknown as ReadStream))
    jest
      .spyOn(fileModule, 'createFile')
      .mockImplementation(() => Promise.resolve())
  })

  it('should return a read stream for a file that exists', async () => {
    jest
      .spyOn(fileModule, 'fileExists')
      .mockImplementation(() => Promise.resolve(true))

    await createReadStream(filePath)

    expect(fs.createReadStream).toHaveBeenCalledWith(filePath)
  })
})

describe('createWriteStream', () => {
  const filePath = path.join(__dirname, 'testfile.txt')
  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.mock('fs-extra')
    jest.mock('../file')
    jest
      .spyOn(fs, 'createWriteStream')
      .mockImplementation(() => ({} as unknown as WriteStream))
    jest
      .spyOn(fileModule, 'createFile')
      .mockImplementation(() => Promise.resolve())
  })

  it('should return a write stream for a file that exists', async () => {
    jest
      .spyOn(fileModule, 'fileExists')
      .mockImplementation(() => Promise.resolve(true))

    await createWriteStream(filePath)

    expect(fs.createWriteStream).toHaveBeenCalledWith(filePath, { flags: 'a' })
  })

  it('should create a file that does not exist before returning the write stream', async () => {
    jest
      .spyOn(fileModule, 'fileExists')
      .mockImplementation(() => Promise.resolve(false))

    await createWriteStream(filePath)

    expect(fileModule.createFile).toHaveBeenCalledWith(filePath, '')
    expect(fs.createWriteStream).toHaveBeenCalledWith(filePath, {
      flags: 'a'
    })
  })
})

describe('isFolder', () => {
  it('should return true if the supplied path is a folder', async () => {
    const result = await isFolder(process.cwd())

    expect(result).toBeTruthy()
  })

  it('should return false if the folder does not exist', async () => {
    const result = await isFolder(path.join(process.cwd(), 'does-not-exist'))

    expect(result).toBeFalsy()
  })

  it('should return false if the supplied path is a file', async () => {
    const result = await isFolder(path.join(process.cwd(), 'file.spec.ts'))

    expect(result).toBeFalsy()
  })
})

describe('deleteFile', () => {
  it('should delete the given file', async () => {
    const fileName = `test-delete-${generateTimestamp()}.txt`
    const filePath = path.join(__dirname, fileName)
    await createFile(filePath, '')

    let isFilePresent = await fileExists(filePath)

    await deleteFile(filePath)
    isFilePresent = await fileExists(filePath)

    expect(isFilePresent).toBeFalsy()
  })
})

describe('deleteFolder', () => {
  it('should delete the given folder even when non-empty', async () => {
    const folderName = `test-delete-${generateTimestamp()}`
    const folderPath = path.join(__dirname, folderName)
    await createFolder(folderPath)
    await createFolder(path.join(folderPath, 'subfolder'))
    await createFile(path.join(folderPath, 'subfolder', 'test.txt'), 'test')

    let isFolderPresent = await folderExists(folderPath)

    await deleteFolder(folderPath)
    isFolderPresent = await folderExists(folderPath)

    expect(isFolderPresent).toBeFalsy()
  })
})

describe('getLineEnding', () => {
  it('should return correct line ending', () => {
    let lineEnding = LineEndings.CRLF
    let line: LineEndings = lineEnding

    expect(getLineEnding(line)).toEqual(lineEnding)

    lineEnding = LineEndings.LF
    line = lineEnding

    expect(getLineEnding(line)).toEqual(lineEnding)
  })
})
