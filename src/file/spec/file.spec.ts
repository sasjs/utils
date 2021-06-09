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
  listIniFilesInFolder,
  listSubFoldersInFolder,
  listFilesAndSubFoldersInFolder,
  moveFile,
  copy,
  base64EncodeFile,
  base64EncodeImageFile
} from '../file'

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
    const timestamp = new Date().valueOf()

    const fileNameToEncode = 'test.png'
    const filePath = path.join(__dirname, fileNameToEncode)

    const fileBase64Encoded =
      'data:image/png;base64,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'

    await expect(base64EncodeImageFile(filePath)).resolves.toEqual(
      fileBase64Encoded
    )
  })

  it('should encode svg to base64', async () => {
    const timestamp = new Date().valueOf()

    const fileNameToEncode = 'test.svg'
    const filePath = path.join(__dirname, fileNameToEncode)

    const fileBase64Encoded =
      'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxMDQgMzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogPGRlZnM+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJhIj4KICAgPHN0b3Agc3RvcC1jb2xvcj0iIzg0ODQ4NCIgb2Zmc2V0PSIwIi8+CiAgIDxzdG9wIHN0b3AtY29sb3I9IiNBMUExQTEiIG9mZnNldD0iMSIvPgogIDwvbGluZWFyR3JhZGllbnQ+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJkIiB4MT0iMzEuNDc0IiB4Mj0iMzEuNDc0IiB5MT0iMjQuODIxIiB5Mj0iMjYuNzczIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeGxpbms6aHJlZj0iI2EiLz4KICA8bGluZWFyR3JhZGllbnQgaWQ9ImMiIHgxPSIzMS40NzQiIHgyPSIzMS40NzQiIHkxPSIyNC44MjEiIHkyPSIyNi43NzMiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoLjY4MTYgMCAwIDEuMDI0OCA3Mi4zOTEgLS45MTgwOSkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4bGluazpocmVmPSIjYSIvPgogIDxsaW5lYXJHcmFkaWVudCBpZD0iYiIgeDE9IjU2LjI5NSIgeDI9IjU2LjI5NSIgeTE9IjI0LjYyMiIgeTI9IjI2LjU3NCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHhsaW5rOmhyZWY9IiNhIi8+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJlIiB4MT0iNDkuMDY3IiB4Mj0iNDguOTU2IiB5MT0iMTkuNzE5IiB5Mj0iOS41MjI3IiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KC45Nzk2OCAwIDAgMS4wMjA3IC0uMjU1NzkgLS4yNTU3OSkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgPHN0b3Agc3RvcC1jb2xvcj0iI0QxRDFEMSIgb2Zmc2V0PSIwIi8+CiAgIDxzdG9wIHN0b3AtY29sb3I9IiNGMkYyRjIiIG9mZnNldD0iMSIvPgogIDwvbGluZWFyR3JhZGllbnQ+CiAgPGZpbHRlciBpZD0iZiIgeD0iLS4wMTA2NzYiIHk9Ii0uMDQ1MzA0IiB3aWR0aD0iMS4wMjE0IiBoZWlnaHQ9IjEuMDkwNiIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMC40NTI5MzIwMyIvPgogIDwvZmlsdGVyPgogPC9kZWZzPgogPGc+CiAgPHBhdGggdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTIuNTc1OSAtMjcuODQ4KSIgZD0ibTEzLjYwOSAzMi4yMDN2Ni44NjMzaC0wLjA1MDc4Yy0wLjQwNTMzLTAuNjY4NjctMC45NjI1NC0xLjE3MTUtMS42NzE5LTEuNTA1OS0wLjY5MjQ0LTAuMzUxOTMtMS40MjgyLTAuNTI3MzQtMi4yMDUxLTAuNTI3MzQtMC45NjI2NyAwLTEuODA3IDAuMjAyNy0yLjUzMzIgMC42MDc0Mi0wLjcyNjIyIDAuMzg3MTMtMS4zMzQ0IDAuOTA1NTYtMS44MjQyIDEuNTU2Ni0wLjQ3Mjg5IDAuNjUxMDgtMC44MzQ1NiAxLjQwOTItMS4wODc5IDIuMjcxNS0wLjIzNjQ0IDAuODQ0NjQtMC4zNTU0NyAxLjcyMzYtMC4zNTU0NyAyLjYzODcgMCAwLjk1MDIyIDAuMTE5MDIgMS44NjQzIDAuMzU1NDcgMi43NDQxIDAuMjUzMzMgMC44Nzk4MyAwLjYxNSAxLjY2MzMgMS4wODc5IDIuMzQ5NiAwLjQ4OTc4IDAuNjY4NjcgMS4xMDY1IDEuMjA2NiAxLjg0OTYgMS42MTEzIDAuNzQzMTEgMC4zODcxMyAxLjYwNDQgMC41ODAwOCAyLjU4NCAwLjU4MDA4IDAuODYxMzMgMCAxLjYzMTEtMC4xNTc4NyAyLjMwNjYtMC40NzQ2MSAwLjY5MjQ0LTAuMzM0MzQgMS4yNDk3LTAuODcyMjcgMS42NzE5LTEuNjExM2gwLjA1MDc4djEuNzQyMmgzLjQxOTl2LTE4Ljg0NnptMTIuODc1IDQuODMwMWMtMS4wMzAyIDAtMS45NTk2IDAuMTc1NDEtMi43ODcxIDAuNTI3MzQtMC44Mjc1NiAwLjMzNDM0LTEuNTM1OCAwLjgxOTY1LTIuMTI3IDEuNDUzMS0wLjU5MTExIDAuNjE1ODgtMS4wNDgzIDEuMzcyMS0xLjM2OTEgMi4yNjk1LTAuMzIwODkgMC44Nzk4My0wLjQ4MDQ3IDEuODY2LTAuNDgwNDcgMi45NTdzMC4xNTk1OCAyLjA3NTIgMC40ODA0NyAyLjk1NTFjMC4zMjA4OSAwLjg3OTgzIDAuNzc4MDMgMS42MzYxIDEuMzY5MSAyLjI2OTUgMC41OTExMSAwLjYxNTg4IDEuMjk5NCAxLjA5MTQgMi4xMjcgMS40MjU4IDAuODI3NTYgMC4zMzQzNCAxLjc1NjkgMC41MDE5NSAyLjc4NzEgMC41MDE5NSAxLjAzMDIgMCAxLjk1OTYtMC4xNjc2MiAyLjc4NzEtMC41MDE5NSAwLjg0NDQ0LTAuMzM0MzQgMS41NjEyLTAuODA5OSAyLjE1MjMtMS40MjU4IDAuNTkxMTEtMC42MzM0OCAxLjA0ODMtMS4zODk3IDEuMzY5MS0yLjI2OTUgMC4zMjA4OS0wLjg3OTgzIDAuNDgwNDctMS44NjQxIDAuNDgwNDctMi45NTUxcy0wLjE1OTU4LTIuMDc3Mi0wLjQ4MDQ3LTIuOTU3Yy0wLjMyMDg5LTAuODk3NDMtMC43NzgwMy0xLjY1MzYtMS4zNjkxLTIuMjY5NS0wLjU5MTExLTAuNjMzNDgtMS4zMDc5LTEuMTE4OC0yLjE1MjMtMS40NTMxLTAuODI3NTYtMC4zNTE5My0xLjc1NjktMC41MjczNC0yLjc4NzEtMC41MjczNHptNDEuNzE1IDBjLTAuOTEyIDAtMS43MjIzIDAuMTg1MTYtMi40MzE2IDAuNTU0NjktMC42OTI0NCAwLjM2OTUzLTEuMjc1MiAwLjg3MDQzLTEuNzQ4IDEuNTAzOS0wLjQ3Mjg5IDAuNjE1ODgtMC44MzY1MSAxLjMzNy0xLjA4OTggMi4xNjQxLTAuMjM2NDUgMC44MDk0NC0wLjM1MzUyIDEuNjU1My0wLjM1MzUyIDIuNTM1MiAwIDAuOTMyNjIgMC4xMDAwNyAxLjgyMTQgMC4zMDI3MyAyLjY2NiAwLjIxOTU2IDAuODI3MDQgMC41NTc2NyAxLjU1NiAxLjAxMzcgMi4xODk1IDAuNDU2IDAuNjE1ODggMS4wMzg3IDEuMTA5IDEuNzQ4IDEuNDc4NSAwLjcwOTMzIDAuMzUxOTMgMS41NTM2IDAuNTI5MyAyLjUzMzIgMC41MjkzIDAuNzkzNzggMCAxLjU0NDYtMC4xNjc2MiAyLjI1MzktMC41MDE5NSAwLjcyNjIyLTAuMzUxOTMgMS4yODM0LTAuODg5ODYgMS42NzE5LTEuNjExM2gwLjA1MDc4djEuNzk0OWMwLjAxNjg5IDAuOTY3ODItMC4yMTA3MSAxLjc2ODktMC42ODM1OSAyLjQwMjMtMC40NTYgMC42MzM0OC0xLjE4OTggMC45NTExNy0yLjIwMzEgMC45NTExNy0wLjY0MTc4IDAtMS4yMDc1LTAuMTQyMjgtMS42OTczLTAuNDIzODMtMC40ODk3OC0wLjI2Mzk1LTAuODE5MzktMC43NDczMS0wLjk4ODI4LTEuNDUxMmgtMy41NzIzYzAuMDUwNjcgMC43NzQyNSAwLjI1Mjc2IDEuNDM1IDAuNjA3NDIgMS45ODA1IDAuMzcxNTYgMC41NjMwOSAwLjgyODcgMS4wMTkyIDEuMzY5MSAxLjM3MTEgMC41NTczMyAwLjM1MTkzIDEuMTY1NiAwLjYwNzI2IDEuODI0MiAwLjc2NTYyIDAuNjc1NTYgMC4xNzU5NyAxLjMzMjggMC4yNjU2MiAxLjk3NDYgMC4yNjU2MiAxLjUwMzEgMCAyLjcwMjUtMC4yMTI0NSAzLjU5NzctMC42MzQ3NyAwLjg5NTExLTAuNDIyMzIgMS41Nzk4LTAuOTQwNzYgMi4wNTI3LTEuNTU2NiAwLjQ3Mjg5LTAuNTk4MjkgMC43NzctMS4yNDkzIDAuOTEyMTEtMS45NTMxIDAuMTUyLTAuNzAzODYgMC4yMjY1Ni0xLjMyOTUgMC4yMjY1Ni0xLjg3NXYtMTIuNzc1aC0zLjQxOTl2MS44MjIzaC0wLjA1MDc4Yy0wLjQzOTExLTAuNzkxODUtMC45ODc4Mi0xLjM1NTEtMS42NDY1LTEuNjg5NS0wLjY0MTc4LTAuMzM0MzQtMS4zOTI2LTAuNTAxOTUtMi4yNTM5LTAuNTAxOTV6bTE2LjUyMyAwYy0wLjk5NjQ0IDAtMS45MDg4IDAuMTg1MTYtMi43MzYzIDAuNTU0NjktMC44MTA2NyAwLjM2OTUzLTEuNTEyNCAwLjg4MDE4LTIuMTAzNSAxLjUzMTItMC41OTExMSAwLjYzMzQ4LTEuMDQ2MyAxLjM4OTctMS4zNjcyIDIuMjY5NXMtMC40ODA0NyAxLjgzMS0wLjQ4MDQ3IDIuODUxNmMwIDEuMDU1OCAwLjE1MTA4IDIuMDIyNSAwLjQ1NTA4IDIuOTAyMyAwLjMyMDg5IDAuODc5ODMgMC43Njc1OCAxLjYzNjEgMS4zNDE4IDIuMjY5NSAwLjU3NDIyIDAuNjMzNDggMS4yNzYgMS4xMjY2IDIuMTAzNSAxLjQ3ODUgMC44Mjc1NiAwLjMzNDM0IDEuNzU2OSAwLjUwMTk1IDIuNzg3MSAwLjUwMTk1IDEuNDg2MiAwIDIuNzUxNy0wLjM1Mjc3IDMuNzk4OC0xLjA1NjYgMS4wNDcxLTAuNzAzODcgMS44MjU0LTEuODczMyAyLjMzMi0zLjUwOThoLTMuMTY4Yy0wLjExODIyIDAuNDIyMzItMC40MzkzNCAwLjgyNzcyLTAuOTYyODkgMS4yMTQ4LTAuNTIzNTUgMC4zNjk1My0xLjE0NjggMC41NTI3NC0xLjg3MyAwLjU1MjczLTEuMDEzMyAwLTEuNzkxNi0wLjI3Mjg2LTIuMzMyLTAuODE4MzYtMC41NDA0NC0wLjU0NTUtMC44MzYwNS0xLjQyNDUtMC44ODY3Mi0yLjYzODdoOS40NDkyYzAuMDY3NTYtMS4wNTU4LTAuMDE1NTEtMi4wNjczLTAuMjUxOTUtMy4wMzUyLTAuMjM2NDQtMC45Njc4Mi0wLjYyNTU3LTEuODI5My0xLjE2Ni0yLjU4NTktMC41MjM1Ni0wLjc1NjY2LTEuMTk5OC0xLjM1NS0yLjAyNzMtMS43OTQ5LTAuODI3NTYtMC40NTc1MS0xLjc5NzQtMC42ODc1LTIuOTEyMS0wLjY4NzV6bTE2LjE4OSAwYy0wLjc2IDAtMS41MDIzIDAuMTg1MTYtMi4yMjg1IDAuNTU0NjktMC43MjYyMiAwLjM1MTkzLTEuMzE3NCAwLjkyMjk5LTEuNzczNCAxLjcxNDhoLTAuMDc2MTd2LTEuOTAwNGgtMy40MTk5djEzLjY0NmgzLjU5Nzd2LTcuMTUyM2MwLTEuMzkwMSAwLjIxOTA5LTIuMzg0MSAwLjY1ODItMi45ODI0IDAuNDM5MTEtMC42MTU4OCAxLjE0OTQtMC45MjM4MyAyLjEyODktMC45MjM4MyAwLjg2MTMzIDAgMS40NjExIDAuMjgwNjYgMS43OTg4IDAuODQzNzUgMC4zMzc3NyAwLjU0NTUgMC41MDU4NiAxLjM4MTYgMC41MDU4NiAyLjUwNzh2Ny43MDdoMy41OTc2di04LjM5MjZjMC0wLjg0NDY0LTAuMDc2NS0xLjYxMDYtMC4yMjg1MS0yLjI5NjktMC4xMzUxMS0wLjcwMzg3LTAuMzc5NzEtMS4yOTI1LTAuNzM0MzgtMS43Njc2LTAuMzU0NjYtMC40OTI3MS0wLjg0Mzg2LTAuODcyNzctMS40Njg4LTEuMTM2Ny0wLjYwOC0wLjI4MTU1LTEuMzk0OC0wLjQyMTg4LTIuMzU3NC0wLjQyMTg4em0tNjYuMDYzIDAuMzY5MTQgNC4zMDY2IDYuNDY2OC00LjcxMjkgNy4xNzk3aDQuMDI5M2wyLjczNjMtNC4zMDI3IDIuNzM0NCA0LjMwMjdoNC4xMDU1bC00LjgzOTgtNy4yNTc4IDQuMzA2Ni02LjM4ODdoLTMuOTc2NmwtMi4yNzkzIDMuNTY0NS0yLjMwNjYtMy41NjQ1em0xMy4yNzUgMCA0LjU4NCAxMi44MDNjMC4xMDEzMyAwLjI2Mzk1IDAuMTUyMzQgMC41NDQ2MSAwLjE1MjM0IDAuODQzNzUgMCAwLjQwNDcyLTAuMTE3MDcgMC43NzUwNC0wLjM1MzUyIDEuMTA5NC0wLjIxOTU2IDAuMzM0MzQtMC41NjYxNyAwLjUyNzI5LTEuMDM5MSAwLjU4MDA4LTAuMzU0NjcgMC4wMTc2LTAuNzA5NzkgMC4wMDk4LTEuMDY0NS0wLjAyNTM5LTAuMzU0NjctMC4wMzUxOS0wLjcwMTI4LTAuMDcwMjgtMS4wMzkxLTAuMTA1NDd2My4wODc5YzAuMzcxNTYgMC4wMzUxOSAwLjczNTE4IDAuMDYwNTEgMS4wODk4IDAuMDc4MTMgMC4zNzE1NiAwLjAzNTE5IDAuNzQzNjggMC4wNTI3MyAxLjExNTIgMC4wNTI3MyAxLjIzMjkgMCAyLjE5NDMtMC4yMzc3OCAyLjg4NjctMC43MTI4OSAwLjY5MjQ0LTAuNDc1MTEgMS4yMzI2LTEuMjY2NCAxLjYyMTEtMi4zNzVsNS40NzI3LTE1LjMzNmgtMy43MjQ2bC0yLjg2MTMgOS4zNDM4aC0wLjA1MDc4bC0yLjk2NDgtOS4zNDM4em0tMzcuNDggMi40NTUxYzAuNTkxMTEgMCAxLjA4MjMgMC4xMjI3OSAxLjQ3MDcgMC4zNjkxNCAwLjM4ODQ0IDAuMjQ2MzUgMC42OTkxIDAuNTcxODQgMC45MzU1NSAwLjk3NjU2IDAuMjUzMzMgMC4zODcxMyAwLjQzMTg3IDAuODQ1MTUgMC41MzMyIDEuMzczIDAuMTAxMzMgMC41MTAzIDAuMTUyMzQgMS4wNDgyIDAuMTUyMzQgMS42MTEzIDAgMC41NjMwOS0wLjA1MTAxIDEuMTA2OS0wLjE1MjM0IDEuNjM0OC0wLjEwMTMzIDAuNTI3OS0wLjI3MTM3IDEuMDAzNS0wLjUwNzgxIDEuNDI1OC0wLjIzNjQ0IDAuNDA0NzItMC41NTU2IDAuNzMwMjEtMC45NjA5NCAwLjk3NjU2LTAuMzg4NDQgMC4yNDYzNS0wLjg3OTU5IDAuMzY5MTQtMS40NzA3IDAuMzY5MTQtMC41NTczMyAwLTEuMDM4LTAuMTIyNzktMS40NDM0LTAuMzY5MTQtMC4zODg0NC0wLjI2Mzk1LTAuNzE4MDYtMC41OTcyMy0wLjk4ODI4LTEuMDAyLTAuMjUzMzMtMC40MjIzMi0wLjQzODQyLTAuODk3ODgtMC41NTY2NC0xLjQyNThzLTAuMTc3NzMtMS4wNTYxLTAuMTc3NzMtMS41ODRjLTFlLTcgLTAuNTYzMDkgMC4wNTEwMS0xLjA5OTEgMC4xNTIzNC0xLjYwOTQgMC4xMTgyMi0wLjUyNzkgMC4yOTQ4MS0wLjk5NTY3IDAuNTMxMjUtMS40MDA0IDAuMjUzMzMtMC40MDQ3MiAwLjU4Mjk1LTAuNzMwMjEgMC45ODgyOC0wLjk3NjU2IDAuNDA1MzMtMC4yNDYzNSAwLjkwMzAzLTAuMzY5MTQgMS40OTQxLTAuMzY5MTR6bTE1Ljg0IDBjMC42MDggMCAxLjExNDIgMC4xMzI1MyAxLjUxOTUgMC4zOTY0OCAwLjQyMjIyIDAuMjQ2MzUgMC43NTE4NCAwLjU3MTg0IDAuOTg4MjggMC45NzY1NiAwLjI1MzMzIDAuNDA0NzIgMC40Mjk5MiAwLjg3MDU0IDAuNTMxMjUgMS4zOTg0IDAuMTAxMzMgMC41Mjc5IDAuMTUyMzQgMS4wNjU4IDAuMTUyMzQgMS42MTEzIDAgMC41NDU1LTAuMDUxMDEgMS4wODE1LTAuMTUyMzQgMS42MDk0LTAuMTAxMzQgMC41MTAzLTAuMjc3OTIgMC45NzYxMi0wLjUzMTI1IDEuMzk4NC0wLjIzNjQ0IDAuNDA0NzItMC41NjYwNiAwLjczMDIxLTAuOTg4MjggMC45NzY1Ni0wLjQwNTMzIDAuMjQ2MzUtMC45MTE1MyAwLjM2OTE0LTEuNTE5NSAwLjM2OTE0LTAuNjA4IDAtMS4xMTQyLTAuMTIyNzktMS41MTk1LTAuMzY5MTRzLTAuNzM0OTUtMC41NzE4NC0wLjk4ODI4LTAuOTc2NTZjLTAuMjM2NDQtMC40MjIzMi0wLjQwNjQ4LTAuODg4MTQtMC41MDc4MS0xLjM5ODQtMC4xMDEzMy0wLjUyNzktMC4xNTIzNC0xLjA2MzktMC4xNTIzNC0xLjYwOTQgMC0wLjU0NTUgMC4wNTEwMS0xLjA4MzQgMC4xNTIzNC0xLjYxMTMgMC4xMDEzMy0wLjUyNzkgMC4yNzEzNy0wLjk5MzcxIDAuNTA3ODEtMS4zOTg0IDAuMjUzMzMtMC40MDQ3MiAwLjU4Mjk1LTAuNzMwMjEgMC45ODgyOC0wLjk3NjU2IDAuNDA1MzMtMC4yNjM5NSAwLjkxMTUzLTAuMzk2NDggMS41MTk1LTAuMzk2NDh6bTQyLjYwMiAwYzAuNTkxMTEgMCAxLjA4MDMgMC4xMTQ5OSAxLjQ2ODggMC4zNDM3NSAwLjM4ODQ0IDAuMjI4NzYgMC43MDEwNSAwLjUzNjcgMC45Mzc1IDAuOTIzODMgMC4yMzY0NCAwLjM4NzEzIDAuNDA2NDggMC44MzU0IDAuNTA3ODEgMS4zNDU3IDAuMTAxMzMgMC40OTI3MSAwLjE1MDM5IDEuMDIwOSAwLjE1MDM5IDEuNTg0IDAgMC40OTI3LTAuMDY2MDYgMC45NjgyNy0wLjIwMTE3IDEuNDI1OC0wLjExODIyIDAuNDM5OTItMC4zMDUyNiAwLjgzNTU3LTAuNTU4NTkgMS4xODc1LTAuMjUzMzMgMC4zNTE5My0wLjU3NDQ1IDAuNjMyNTktMC45NjI4OSAwLjg0Mzc1LTAuMzg4NDQgMC4yMTExNi0wLjgzNTEzIDAuMzE4MzYtMS4zNDE4IDAuMzE4MzYtMC41NTczMyAwLTEuMDIxLTAuMTI0NzQtMS4zOTI2LTAuMzcxMDktMC4zNzE1Ni0wLjI0NjM1LTAuNjc1NjYtMC41NjIwOS0wLjkxMjExLTAuOTQ5MjItMC4yMTk1Ni0wLjM4NzEzLTAuMzgxMDktMC44MTc4Ni0wLjQ4MjQyLTEuMjkzLTAuMDg0NDQtMC40OTI3MS0wLjEyNjk1LTAuOTg1ODEtMC4xMjY5NS0xLjQ3ODUgMC0wLjUxMDMgMC4wNTEwMS0wLjk5MzY2IDAuMTUyMzQtMS40NTEyIDAuMTE4MjItMC40NzUxMSAwLjI5Njc2LTAuODkwMjUgMC41MzMyLTEuMjQyMiAwLjI1MzMzLTAuMzY5NTMgMC41NTc0NC0wLjY1OTkzIDAuOTEyMTEtMC44NzEwOSAwLjM3MTU2LTAuMjExMTYgMC44MDk3NC0wLjMxNjQxIDEuMzE2NC0wLjMxNjQxem0xNS41MzUgMGMwLjg3ODIyIDAgMS41MjkgMC4yNDc1MyAxLjk1MTIgMC43NDAyMyAwLjQzOTExIDAuNDkyNzEgMC43NDMyMiAxLjIxMzggMC45MTIxMSAyLjE2NDFoLTUuODUzNWMwLjAxNjg5LTAuMjYzOTUgMC4wNjc5LTAuNTY0MSAwLjE1MjM0LTAuODk4NDQgMC4xMDEzMy0wLjMzNDM0IDAuMjYyODctMC42NTAwOCAwLjQ4MjQyLTAuOTQ5MjIgMC4yMzY0NC0wLjI5OTE0IDAuNTQwNTUtMC41NDY2NyAwLjkxMjExLTAuNzQwMjMgMC4zODg0NS0wLjIxMTE2IDAuODY5MTQtMC4zMTY0MSAxLjQ0MzQtMC4zMTY0MXoiIGZpbHRlcj0idXJsKCNmKSIgb3BhY2l0eT0iLjMiIHN0cm9rZT0iIzk2OTY5NiIgeGxpbms6aHJlZj0iI3BhdGgxNDEiLz4KICA8cGF0aCBkPSJtMC45NzIwMiAyNC4xNjEgNDMuNjA1LTAuMDAxOSAwLjA1MDggMy4zMDYxLTQzLjYgMC4wNDE3NHoiIGZpbGw9InVybCgjZCkiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIuNSIvPgogIDxwYXRoIGQ9Im0xMC4yODMgMy41NTQ3djYuODYzM2gtMC4wNTA3OGMtMC40MDUzMy0wLjY2ODY3LTAuOTYyNTQtMS4xNzE1LTEuNjcxOS0xLjUwNTktMC42OTI0NC0wLjM1MTkzLTEuNDI4Mi0wLjUyNzM0LTIuMjA1MS0wLjUyNzM0LTAuOTYyNjcgMC0xLjgwNyAwLjIwMjctMi41MzMyIDAuNjA3NDItMC43MjYyMiAwLjM4NzEzLTEuMzM0NCAwLjkwNTU2LTEuODI0MiAxLjU1NjYtMC40NzI4OSAwLjY1MTA4LTAuODM0NTYgMS40MDkyLTEuMDg3OSAyLjI3MTUtMC4yMzY0NCAwLjg0NDY0LTAuMzU1NDcgMS43MjM2LTAuMzU1NDcgMi42Mzg3IDAgMC45NTAyMiAwLjExOTAyIDEuODY0MyAwLjM1NTQ3IDIuNzQ0MSAwLjI1MzMzIDAuODc5ODMgMC42MTUgMS42NjMzIDEuMDg3OSAyLjM0OTYgMC40ODk3OCAwLjY2ODY3IDEuMTA2NSAxLjIwNjYgMS44NDk2IDEuNjExMyAwLjc0MzExIDAuMzg3MTMgMS42MDQ0IDAuNTgwMDggMi41ODQgMC41ODAwOCAwLjg2MTMzIDAgMS42MzExLTAuMTU3ODcgMi4zMDY2LTAuNDc0NjEgMC42OTI0NC0wLjMzNDM0IDEuMjQ5Ny0wLjg3MjI3IDEuNjcxOS0xLjYxMTNoMC4wNTA3OHYxLjc0MjJoMy40MTk5di0xOC44NDZ6bTEyLjg3NSA0LjgzMDFjLTEuMDMwMiAwLTEuOTU5NiAwLjE3NTQxLTIuNzg3MSAwLjUyNzM0LTAuODI3NTYgMC4zMzQzNC0xLjUzNTggMC44MTk2NS0yLjEyNyAxLjQ1MzEtMC41OTExMSAwLjYxNTg4LTEuMDQ4MyAxLjM3MjEtMS4zNjkxIDIuMjY5NS0wLjMyMDg5IDAuODc5ODMtMC40ODA0NyAxLjg2Ni0wLjQ4MDQ3IDIuOTU3czAuMTU5NTggMi4wNzUyIDAuNDgwNDcgMi45NTUxYzAuMzIwODkgMC44Nzk4MyAwLjc3ODAzIDEuNjM2MSAxLjM2OTEgMi4yNjk1IDAuNTkxMTEgMC42MTU4OCAxLjI5OTQgMS4wOTE0IDIuMTI3IDEuNDI1OCAwLjgyNzU2IDAuMzM0MzQgMS43NTY5IDAuNTAxOTUgMi43ODcxIDAuNTAxOTUgMS4wMzAyIDAgMS45NTk2LTAuMTY3NjIgMi43ODcxLTAuNTAxOTUgMC44NDQ0NC0wLjMzNDM0IDEuNTYxMi0wLjgwOTkgMi4xNTIzLTEuNDI1OCAwLjU5MTExLTAuNjMzNDggMS4wNDgzLTEuMzg5NyAxLjM2OTEtMi4yNjk1IDAuMzIwODktMC44Nzk4MyAwLjQ4MDQ3LTEuODY0MSAwLjQ4MDQ3LTIuOTU1MXMtMC4xNTk1OC0yLjA3NzItMC40ODA0Ny0yLjk1N2MtMC4zMjA4OS0wLjg5NzQzLTAuNzc4MDMtMS42NTM2LTEuMzY5MS0yLjI2OTUtMC41OTExMS0wLjYzMzQ4LTEuMzA3OS0xLjExODgtMi4xNTIzLTEuNDUzMS0wLjgyNzU2LTAuMzUxOTMtMS43NTY5LTAuNTI3MzQtMi43ODcxLTAuNTI3MzR6bTQxLjcxNSAwYy0wLjkxMiAwLTEuNzIyMyAwLjE4NTE2LTIuNDMxNiAwLjU1NDY5LTAuNjkyNDQgMC4zNjk1My0xLjI3NTIgMC44NzA0My0xLjc0OCAxLjUwMzktMC40NzI4OSAwLjYxNTg4LTAuODM2NTEgMS4zMzctMS4wODk4IDIuMTY0MS0wLjIzNjQ0IDAuODA5NDQtMC4zNTM1MiAxLjY1NTMtMC4zNTM1MiAyLjUzNTIgMCAwLjkzMjYyIDAuMTAwMDcgMS44MjE0IDAuMzAyNzMgMi42NjYgMC4yMTk1NiAwLjgyNzA0IDAuNTU3NjcgMS41NTYgMS4wMTM3IDIuMTg5NSAwLjQ1NiAwLjYxNTg4IDEuMDM4NyAxLjEwOSAxLjc0OCAxLjQ3ODUgMC43MDkzMyAwLjM1MTkzIDEuNTUzNiAwLjUyOTMgMi41MzMyIDAuNTI5MyAwLjc5Mzc4IDAgMS41NDQ2LTAuMTY3NjIgMi4yNTM5LTAuNTAxOTUgMC43MjYyMi0wLjM1MTkzIDEuMjgzNC0wLjg4OTg2IDEuNjcxOS0xLjYxMTNoMC4wNTA3OHYxLjc5NDljMC4wMTY4OSAwLjk2NzgyLTAuMjEwNzEgMS43Njg5LTAuNjgzNTkgMi40MDIzLTAuNDU2IDAuNjMzNDgtMS4xODk4IDAuOTUxMTctMi4yMDMxIDAuOTUxMTctMC42NDE3OCAwLTEuMjA3NS0wLjE0MjI4LTEuNjk3My0wLjQyMzgzLTAuNDg5NzgtMC4yNjM5NS0wLjgxOTM5LTAuNzQ3MzEtMC45ODgyOC0xLjQ1MTJoLTMuNTcyM2MwLjA1MDY3IDAuNzc0MjUgMC4yNTI3NiAxLjQzNSAwLjYwNzQyIDEuOTgwNSAwLjM3MTU2IDAuNTYzMDkgMC44Mjg3IDEuMDE5MiAxLjM2OTEgMS4zNzExIDAuNTU3MzMgMC4zNTE5MyAxLjE2NTYgMC42MDcyNiAxLjgyNDIgMC43NjU2MiAwLjY3NTU2IDAuMTc1OTcgMS4zMzI4IDAuMjY1NjIgMS45NzQ2IDAuMjY1NjIgMS41MDMxIDAgMi43MDI1LTAuMjEyNDUgMy41OTc3LTAuNjM0NzcgMC44OTUxMS0wLjQyMjMyIDEuNTc5OC0wLjk0MDc2IDIuMDUyNy0xLjU1NjYgMC40NzI4OS0wLjU5ODI5IDAuNzc3LTEuMjQ5MyAwLjkxMjExLTEuOTUzMSAwLjE1Mi0wLjcwMzg2IDAuMjI2NTYtMS4zMjk1IDAuMjI2NTYtMS44NzV2LTEyLjc3NWgtMy40MTk5djEuODIyM2gtMC4wNTA3OGMtMC40MzkxMS0wLjc5MTg1LTAuOTg3ODItMS4zNTUxLTEuNjQ2NS0xLjY4OTUtMC42NDE3OC0wLjMzNDM0LTEuMzkyNi0wLjUwMTk1LTIuMjUzOS0wLjUwMTk1em0xNi41MjMgMGMtMC45OTY0NCAwLTEuOTA4OCAwLjE4NTE2LTIuNzM2MyAwLjU1NDY5LTAuODEwNjcgMC4zNjk1My0xLjUxMjQgMC44ODAxNy0yLjEwMzUgMS41MzEyLTAuNTkxMTEgMC42MzM0OC0xLjA0NjMgMS4zODk3LTEuMzY3MiAyLjI2OTVzLTAuNDgwNDcgMS44MzEtMC40ODA0NyAyLjg1MTZjMCAxLjA1NTggMC4xNTEwOCAyLjAyMjUgMC40NTUwOCAyLjkwMjMgMC4zMjA4OSAwLjg3OTgzIDAuNzY3NTggMS42MzYxIDEuMzQxOCAyLjI2OTUgMC41NzQyMiAwLjYzMzQ4IDEuMjc2IDEuMTI2NiAyLjEwMzUgMS40Nzg1IDAuODI3NTYgMC4zMzQzNCAxLjc1NjkgMC41MDE5NSAyLjc4NzEgMC41MDE5NSAxLjQ4NjIgMCAyLjc1MTctMC4zNTI3OCAzLjc5ODgtMS4wNTY2IDEuMDQ3MS0wLjcwMzg2IDEuODI1NC0xLjg3MzMgMi4zMzItMy41MDk4aC0zLjE2OGMtMC4xMTgyMiAwLjQyMjMyLTAuNDM5MzQgMC44Mjc3Mi0wLjk2Mjg5IDEuMjE0OC0wLjUyMzU1IDAuMzY5NTMtMS4xNDY4IDAuNTUyNzQtMS44NzMgMC41NTI3My0xLjAxMzMgMC0xLjc5MTYtMC4yNzI4Ni0yLjMzMi0wLjgxODM2LTAuNTQwNDQtMC41NDU1LTAuODM2MDUtMS40MjQ1LTAuODg2NzItMi42Mzg3aDkuNDQ5MmMwLjA2NzU2LTEuMDU1OC0wLjAxNTUxLTIuMDY3My0wLjI1MTk1LTMuMDM1Mi0wLjIzNjQ0LTAuOTY3ODItMC42MjU1Ny0xLjgyOTMtMS4xNjYtMi41ODU5LTAuNTIzNTYtMC43NTY2Ni0xLjE5OTgtMS4zNTUtMi4wMjczLTEuNzk0OS0wLjgyNzU2LTAuNDU3NTEtMS43OTc0LTAuNjg3NS0yLjkxMjEtMC42ODc1em0xNi4xODkgMGMtMC43NiAwLTEuNTAyMyAwLjE4NTE2LTIuMjI4NSAwLjU1NDY5LTAuNzI2MjIgMC4zNTE5My0xLjMxNzQgMC45MjMtMS43NzM0IDEuNzE0OGgtMC4wNzYxN3YtMS45MDA0aC0zLjQxOTl2MTMuNjQ2aDMuNTk3N3YtNy4xNTIzYzAtMS4zOTAxIDAuMjE5MDktMi4zODQxIDAuNjU4Mi0yLjk4MjQgMC40MzkxMS0wLjYxNTg4IDEuMTQ5NC0wLjkyMzgzIDIuMTI4OS0wLjkyMzgzIDAuODYxMzMgMCAxLjQ2MSAwLjI4MDY2IDEuNzk4OCAwLjg0Mzc1IDAuMzM3NzggMC41NDU1IDAuNTA1ODYgMS4zODE2IDAuNTA1ODYgMi41MDc4djcuNzA3aDMuNTk3N3YtOC4zOTI2YzAtMC44NDQ2NC0wLjA3NjUtMS42MTA2LTAuMjI4NTItMi4yOTY5LTAuMTM1MTEtMC43MDM4Ny0wLjM3OTctMS4yOTI1LTAuNzM0MzctMS43Njc2LTAuMzU0NjYtMC40OTI3MS0wLjg0Mzg2LTAuODcyNzctMS40Njg4LTEuMTM2Ny0wLjYwOC0wLjI4MTU1LTEuMzk0OC0wLjQyMTg4LTIuMzU3NC0wLjQyMTg4em0tNjYuMDYyIDAuMzY5MTQgNC4zMDY2IDYuNDY2OC00LjcxMjkgNy4xNzk3aDQuMDI5M2wyLjczNjMtNC4zMDI3IDIuNzM0NCA0LjMwMjdoNC4xMDU1bC00LjgzOTgtNy4yNTc4IDQuMzA2Ni02LjM4ODdoLTMuOTc2NmwtMi4yNzkzIDMuNTY0NS0yLjMwNjYtMy41NjQ1em0xMy4yNzUgMCA0LjU4NCAxMi44MDNjMC4xMDEzMyAwLjI2Mzk1IDAuMTUyMzQgMC41NDQ2MSAwLjE1MjM0IDAuODQzNzUgMCAwLjQwNDcyLTAuMTE3MDcgMC43NzUwNC0wLjM1MzUyIDEuMTA5NC0wLjIxOTU2IDAuMzM0MzQtMC41NjYxNyAwLjUyNzI5LTEuMDM5MSAwLjU4MDA4LTAuMzU0NjcgMC4wMTc2LTAuNzA5NzkgMC4wMDk4LTEuMDY0NS0wLjAyNTM5LTAuMzU0NjctMC4wMzUxOS0wLjcwMTI4LTAuMDcwMjctMS4wMzkxLTAuMTA1NDd2My4wODc5YzAuMzcxNTYgMC4wMzUxOSAwLjczNTE4IDAuMDYwNTIgMS4wODk4IDAuMDc4MTMgMC4zNzE1NiAwLjAzNTE5IDAuNzQzNjggMC4wNTI3MyAxLjExNTIgMC4wNTI3MyAxLjIzMjkgMCAyLjE5NDMtMC4yMzc3OCAyLjg4NjctMC43MTI4OSAwLjY5MjQ0LTAuNDc1MTEgMS4yMzI2LTEuMjY2NCAxLjYyMTEtMi4zNzVsNS40NzI3LTE1LjMzNmgtMy43MjQ2bC0yLjg2MTMgOS4zNDM3aC0wLjA1MDc4bC0yLjk2NDgtOS4zNDM3em0tMzcuNDggMi40NTUxYzAuNTkxMTEgMCAxLjA4MjMgMC4xMjI3OSAxLjQ3MDcgMC4zNjkxNHMwLjY5OTEgMC41NzE4NCAwLjkzNTU1IDAuOTc2NTZjMC4yNTMzMyAwLjM4NzEzIDAuNDMxODcgMC44NDUxNSAwLjUzMzIgMS4zNzMgMC4xMDEzMyAwLjUxMDMgMC4xNTIzNCAxLjA0ODIgMC4xNTIzNCAxLjYxMTMgMCAwLjU2MzA5LTAuMDUxMDEgMS4xMDY5LTAuMTUyMzQgMS42MzQ4LTAuMTAxMzMgMC41Mjc5LTAuMjcxMzcgMS4wMDM1LTAuNTA3ODEgMS40MjU4LTAuMjM2NDQgMC40MDQ3Mi0wLjU1NTYgMC43MzAyMS0wLjk2MDk0IDAuOTc2NTYtMC4zODg0NCAwLjI0NjM1LTAuODc5NTkgMC4zNjkxNC0xLjQ3MDcgMC4zNjkxNC0wLjU1NzMzIDAtMS4wMzgtMC4xMjI3OS0xLjQ0MzQtMC4zNjkxNC0wLjM4ODQ0LTAuMjYzOTUtMC43MTgwNi0wLjU5NzIzLTAuOTg4MjgtMS4wMDItMC4yNTMzMy0wLjQyMjMyLTAuNDM4NDItMC44OTc4OC0wLjU1NjY0LTEuNDI1OHMtMC4xNzc3My0xLjA1NjEtMC4xNzc3My0xLjU4NGMtMWUtNyAtMC41NjMwOSAwLjA1MTAxLTEuMDk5MSAwLjE1MjM0LTEuNjA5NCAwLjExODIyLTAuNTI3OSAwLjI5NDgxLTAuOTk1NjcgMC41MzEyNS0xLjQwMDQgMC4yNTMzMy0wLjQwNDcyIDAuNTgyOTUtMC43MzAyMSAwLjk4ODI4LTAuOTc2NTYgMC40MDUzMy0wLjI0NjM1IDAuOTAzMDMtMC4zNjkxNCAxLjQ5NDEtMC4zNjkxNHptMTUuODQgMGMwLjYwOCAwIDEuMTE0MiAwLjEzMjU0IDEuNTE5NSAwLjM5NjQ4IDAuNDIyMjIgMC4yNDYzNSAwLjc1MTg0IDAuNTcxODQgMC45ODgyOCAwLjk3NjU2IDAuMjUzMzMgMC40MDQ3MiAwLjQyOTkyIDAuODcwNTQgMC41MzEyNSAxLjM5ODQgMC4xMDEzMyAwLjUyNzkgMC4xNTIzNCAxLjA2NTggMC4xNTIzNCAxLjYxMTMgMCAwLjU0NTUtMC4wNTEwMSAxLjA4MTUtMC4xNTIzNCAxLjYwOTQtMC4xMDEzMyAwLjUxMDMtMC4yNzc5MiAwLjk3NjEyLTAuNTMxMjUgMS4zOTg0LTAuMjM2NDQgMC40MDQ3Mi0wLjU2NjA2IDAuNzMwMjEtMC45ODgyOCAwLjk3NjU2LTAuNDA1MzMgMC4yNDYzNS0wLjkxMTUzIDAuMzY5MTQtMS41MTk1IDAuMzY5MTQtMC42MDggMC0xLjExNDItMC4xMjI3OS0xLjUxOTUtMC4zNjkxNHMtMC43MzQ5NS0wLjU3MTg0LTAuOTg4MjgtMC45NzY1NmMtMC4yMzY0NC0wLjQyMjMyLTAuNDA2NDgtMC44ODgxMy0wLjUwNzgxLTEuMzk4NC0wLjEwMTMzLTAuNTI3OS0wLjE1MjM0LTEuMDYzOS0wLjE1MjM0LTEuNjA5NCAwLTAuNTQ1NSAwLjA1MTAxLTEuMDgzNCAwLjE1MjM0LTEuNjExMyAwLjEwMTMzLTAuNTI3OSAwLjI3MTM3LTAuOTkzNzEgMC41MDc4MS0xLjM5ODQgMC4yNTMzMy0wLjQwNDcyIDAuNTgyOTUtMC43MzAyMSAwLjk4ODI4LTAuOTc2NTYgMC40MDUzMy0wLjI2Mzk1IDAuOTExNTMtMC4zOTY0OCAxLjUxOTUtMC4zOTY0OHptNDIuNjAyIDBjMC41OTExMSAwIDEuMDgwMyAwLjExNDk5IDEuNDY4OCAwLjM0Mzc1IDAuMzg4NDQgMC4yMjg3NiAwLjcwMTA2IDAuNTM2NyAwLjkzNzUgMC45MjM4MyAwLjIzNjQ0IDAuMzg3MTMgMC40MDY0OCAwLjgzNTQgMC41MDc4MSAxLjM0NTcgMC4xMDEzMyAwLjQ5MjcxIDAuMTUwMzkgMS4wMjA5IDAuMTUwMzkgMS41ODQgMCAwLjQ5MjcxLTAuMDY2MDYgMC45NjgyNy0wLjIwMTE3IDEuNDI1OC0wLjExODIyIDAuNDM5OTItMC4zMDUyNiAwLjgzNTU3LTAuNTU4NTkgMS4xODc1LTAuMjUzMzMgMC4zNTE5My0wLjU3NDQ1IDAuNjMyNTktMC45NjI4OSAwLjg0Mzc1LTAuMzg4NDQgMC4yMTExNi0wLjgzNTEzIDAuMzE4MzYtMS4zNDE4IDAuMzE4MzYtMC41NTczMyAwLTEuMDIxLTAuMTI0NzQtMS4zOTI2LTAuMzcxMDktMC4zNzE1Ni0wLjI0NjM1LTAuNjc1NjYtMC41NjIwOS0wLjkxMjExLTAuOTQ5MjItMC4yMTk1Ni0wLjM4NzEzLTAuMzgxMDktMC44MTc4Ni0wLjQ4MjQyLTEuMjkzLTAuMDg0NDQtMC40OTI3MS0wLjEyNjk1LTAuOTg1ODEtMC4xMjY5NS0xLjQ3ODUgMC0wLjUxMDMgMC4wNTEwMS0wLjk5MzY2IDAuMTUyMzQtMS40NTEyIDAuMTE4MjItMC40NzUxMSAwLjI5Njc2LTAuODkwMjYgMC41MzMyLTEuMjQyMiAwLjI1MzMzLTAuMzY5NTMgMC41NTc0NC0wLjY1OTkzIDAuOTEyMTEtMC44NzEwOSAwLjM3MTU2LTAuMjExMTYgMC44MDk3NC0wLjMxNjQxIDEuMzE2NC0wLjMxNjQxem0xNS41MzUgMGMwLjg3ODIyIDAgMS41MjkgMC4yNDc1MyAxLjk1MTIgMC43NDAyNCAwLjQzOTExIDAuNDkyNzEgMC43NDMyMiAxLjIxMzggMC45MTIxMSAyLjE2NDFoLTUuODUzNWMwLjAxNjg5LTAuMjYzOTUgMC4wNjc5LTAuNTY0MSAwLjE1MjM0LTAuODk4NDQgMC4xMDEzMy0wLjMzNDM0IDAuMjYyODctMC42NTAwOCAwLjQ4MjQyLTAuOTQ5MjIgMC4yMzY0NC0wLjI5OTE0IDAuNTQwNTUtMC41NDY2NyAwLjkxMjExLTAuNzQwMjMgMC4zODg0NS0wLjIxMTE2IDAuODY5MTQtMC4zMTY0MSAxLjQ0MzQtMC4zMTY0MXoiIGZpbGw9InVybCgjZSkiIHN0cm9rZT0iIzc0NzQ3NCIgc3Ryb2tlLXdpZHRoPSIuNyIvPgogIDxwYXRoIGQ9Im01Mi45ODggMjcuMjkxYzAuOTk2MDItMS4wMzU5IDEuMzk0NC0xLjg3MjUgMS43OTI4LTMuMTA3NmwzLjgyNDctMC4wMzk4NGMwLjMxMTMgMS42MDk2IDAuODI0MTMgMi41MTM3IDEuNjMzNSAzLjE0NzR6IiBmaWxsPSJ1cmwoI2IpIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iLjUiLz4KICA8cGF0aCBkPSJtNzMuODkgMjQuMDQgMjguODg1LTAuMjAxMS0wLjEyNDc2IDMuMzg3OS0zMS4wMzMgMC4xNjIyOWMxLjI2MjEtMS4wMjM0IDEuOTY2NS0yLjI4NTkgMi4yNzI0LTMuMzQ5MXoiIGZpbGw9InVybCgjYykiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIuNDE3ODgiLz4KIDwvZz4KPC9zdmc+Cg=='

    await expect(base64EncodeImageFile(filePath)).resolves.toEqual(
      fileBase64Encoded
    )
  })
})
