import path from 'path'
import { readFile, getDependencies, validateFileRef, DependencyType } from '..'

describe('getDependencies', () => {
  describe('SAS Includes', () => {
    const expectedLines = [
      'filename TEST temp;',
      'data _null_;',
      'file TEST lrecl=32767;',
      "put '%put ''Hello, world!'';';",
      'run;'
    ]
    const expectedLines2 = [
      'filename TEST temp;',
      'data _null_;',
      'file TEST lrecl=32767;',
      "put '/* SOME COMMENT which is more than 220 characters long, so that this will be chunked into multiple lines. SOME COMMENT which is more than 220 characters long, so that this will be chunked into multiple lines. SOME COMMEN'@;",
      "put 'T which is more than 220 characters long, so that this will be chunked into multiple lines.*/';",
      "put '%put ''Hello, world!'';';",
      "put '/* SOME COMMENT which is more than 220 characters long, so that this will be chunked into multiple lines. SOME COMMENT which is more than 220 characters long, so that this will be chunked into multiple lines. SOME COMMEN'@;",
      "put 'T which is more than 220 characters long, so that this will be chunked into multiple lines.*/';",
      'run;'
    ]

    test('it should get all program dependencies', async () => {
      const filePath = path.join(__dirname, 'testFiles', './example.sas')
      const fileContent = await readFile(filePath)

      const dependencies = await getDependencies(
        filePath,
        fileContent,
        [path.join(__dirname, 'testFiles', 'programs')],
        DependencyType.Include
      )
      const actualLines = dependencies.split('\n')

      expect(actualLines).toEqual(expectedLines)
    })

    test('it should get all program dependencies with line to be chunked', async () => {
      const filePath = path.join(__dirname, 'testFiles', './example2.sas')
      const fileContent = await readFile(filePath)

      const dependencies = await getDependencies(
        filePath,
        fileContent,
        [path.join(__dirname, 'testFiles', 'programs')],
        DependencyType.Include
      )
      const actualLines = dependencies.split('\n')

      expect(actualLines).toEqual(expectedLines2)
    })

    test('it should choose the first dependency when there are duplicates', async () => {
      const filePath = path.join(__dirname, 'testFiles', './duplicates.sas')
      const fileContent = await readFile(filePath)
      const dependencies = await getDependencies(
        filePath,
        fileContent,
        [path.join(__dirname, 'testFiles', 'programs')],
        DependencyType.Include
      )
      const actualLines = dependencies.split('\n')

      expect(actualLines).toEqual(expectedLines)
    })

    test('it should handle duplicate filenames with different extensions', async () => {
      const filePath = path.join(
        __dirname,
        'testFiles',
        './duplicates-extensions.sas'
      )
      const fileContent = await readFile(filePath)
      const expectedOutput = [
        'filename TEST temp;',
        'data _null_;',
        'file TEST lrecl=32767;',
        "put '%put ''Hello, world!'';';",
        'run;',
        'filename TEST2 temp;',
        'data _null_;',
        'file TEST2 lrecl=32767;',
        "put 'proc sql;';",
        "put 'quit;';",
        'run;'
      ]

      const dependencies = await getDependencies(
        filePath,
        fileContent,
        [path.join(__dirname, 'testFiles', 'programs')],
        DependencyType.Include
      )
      const actualLines = dependencies.split('\n')

      expect(actualLines).toEqual(expectedOutput)
    })

    test('it should throw an error when a program dependency is not found', async () => {
      const filePath = path.join(
        __dirname,
        'testFiles',
        './missing-program-dep.sas'
      )
      const fileContent = await readFile(filePath)

      const programsPath = path.join(__dirname, 'testFiles', 'programs')
      await expect(
        getDependencies(
          filePath,
          fileContent,
          [programsPath],
          DependencyType.Include
        )
      ).rejects.toThrow(
        `Unable to load dependencies for: ${filePath}\n` +
          'The following files were listed under SAS Programs but could not be found:\n' +
          "1. 'foobar.sas' with fileRef 'FOO'\n" +
          "2. 'foobar2.sas' with fileRef 'FOO2'\n" +
          'Please check that they exist in the folder(s) listed in the `programFolders` array in your sasjsconfig.json file.\n' +
          'Program Folders:\n' +
          `- ${programsPath}`
      )
    })

    test('it should throw an error when a fileref is not specified', async () => {
      const filePath = path.join(
        __dirname,
        'testFiles',
        './missing-fileref.sas'
      )
      const fileContent = await readFile(filePath)

      await expect(
        getDependencies(
          filePath,
          fileContent,
          [path.join(__dirname, 'testFiles', 'programs')],
          DependencyType.Include
        )
      ).rejects.toThrow(
        `SAS Programs test.sas is missing fileref. Please specify SAS Programs dependencies in the format: @li <filename> <fileref>`
      )
    })
  })

  describe('Binary Files', () => {
    test('it should get all binary dependencies', async () => {
      const filePath = path.join(
        __dirname,
        'testFiles',
        './exampleWithBinaries.sas'
      )
      const fileContent = await readFile(filePath)

      const dependencies = await getDependencies(
        filePath,
        fileContent,
        [path.join(__dirname, 'testFiles', 'binaries')],
        DependencyType.Binary
      )
      const actualLines = dependencies.split('\n')

      expect(actualLines).toEqual([
        'filename _sjstmp "%sysfunc(pathname(work))/base64_img1" recfm=n;',
        'data _null_;',
        'file _sjstmp;',
        "put 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAC1QTFRFHx0CLisDiYIKDw4Ba2UIXFcHqJ8MmZALPToF5dkR1soQt60OenQJ9OcSAAAA9Dc9YAAAAGhJREFUeNpczwkOwCAIBEA8egCu/39uhZaoxUTIiAlQ/wX5'@;",
        "put '3QBhpRVkHOQSUMGtkIJnR7KUMaH3RJ4moAWoqhiIJ/KKDXi8vNDiyzfHqNKxQfZiAuOkXhlHQLlgk9/Lckm57tsu8QgwAIt2DFEAULKlAAAAAElFTkSuQmCC';",
        'run;',
        'filename img1 "%sysfunc(pathname(work))/sasjs_img1";',
        'data _null_;',
        'length filein 8 fileout 8;',
        "filein = fopen(\"_sjstmp\",'I',4,'B');",
        "fileout = fopen(\"img1\",'O',3,'B');",
        "char= '20'x;",
        'do while(fread(filein)=0);',
        'length raw $4;',
        'do i=1 to 4;',
        'rc=fget(filein,char,1);',
        'substr(raw,i,1)=char;',
        'end;',
        'rc = fput(fileout,input(raw,$base64X4.));',
        'rc = fwrite(fileout);',
        'end;',
        'rc = fclose(filein);',
        'rc = fclose(fileout);',
        'run;',
        'filename _sjstmp clear;'
      ])
    })

    test('it should get binary dependencies of small file', async () => {
      const filePath = path.join(
        __dirname,
        'testFiles',
        './exampleWithBinaries-2.sas'
      )
      const fileContent = await readFile(filePath)

      const dependencies = await getDependencies(
        filePath,
        fileContent,
        [path.join(__dirname, 'testFiles', 'binaries')],
        DependencyType.Binary
      )
      const actualLines = dependencies.split('\n')

      expect(actualLines).toEqual([
        'filename _sjstmp "%sysfunc(pathname(work))/base64_img" recfm=n;',
        'data _null_;',
        'file _sjstmp;',
        "put 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';",
        'run;',
        'filename img "%sysfunc(pathname(work))/sasjs_img";',
        'data _null_;',
        'length filein 8 fileout 8;',
        "filein = fopen(\"_sjstmp\",'I',4,'B');",
        "fileout = fopen(\"img\",'O',3,'B');",
        "char= '20'x;",
        'do while(fread(filein)=0);',
        'length raw $4;',
        'do i=1 to 4;',
        'rc=fget(filein,char,1);',
        'substr(raw,i,1)=char;',
        'end;',
        'rc = fput(fileout,input(raw,$base64X4.));',
        'rc = fwrite(fileout);',
        'end;',
        'rc = fclose(filein);',
        'rc = fclose(fileout);',
        'run;',
        'filename _sjstmp clear;'
      ])
    })

    test('it should throw an error when a binary dependency is not found', async () => {
      const filePath = path.join(
        __dirname,
        'testFiles',
        './missing-binary-dep.sas'
      )
      const fileContent = await readFile(filePath)

      const programsPath = path.join(__dirname, 'testFiles', 'binaries')
      await expect(
        getDependencies(
          filePath,
          fileContent,
          [programsPath],
          DependencyType.Binary
        )
      ).rejects.toThrow(
        `Unable to load dependencies for: ${filePath}\n` +
          'The following files were listed under Binary Files but could not be found:\n' +
          "1. 'WRONG.img' with fileRef 'img'\n" +
          "2. 'WRONG_2.img' with fileRef 'img2'\n" +
          'Please check that they exist in the folder(s) listed in the `binaryFolders` array in your sasjsconfig.json file.\n' +
          'Binary Folders:\n' +
          `- ${programsPath}`
      )
    })

    test('it should throw an error when a binary dependency header is present, but no dependencies specified', async () => {
      const filePath = path.join(
        __dirname,
        'testFiles',
        './missing-binary-dep-2.sas'
      )
      const fileContent = await readFile(filePath)

      const programsPath = path.join(__dirname, 'testFiles', 'binaries')
      await expect(
        getDependencies(
          filePath,
          fileContent,
          [programsPath],
          DependencyType.Binary
        )
      ).rejects.toThrow(
        'Binary Files entry is empty. Please specify Binary Files dependencies in the format: @li <filename> <fileref>'
      )
    })
  })

  describe('SAS Macros', () => {
    test('it should return empty string for macro dependency ', async () => {
      const filePath = path.join(__dirname, 'testFiles', './example.sas')
      const fileContent = await readFile(filePath)

      const dependencies = await getDependencies(
        filePath,
        fileContent,
        [path.join(__dirname, 'testFiles', 'macros')],
        DependencyType.Macro
      )
      const actualLines = dependencies.split('\n')

      expect(actualLines).toEqual([''])
    })
  })
})

describe('validateFileRef', () => {
  test('it should return true for a file ref containing characters', () => {
    const fileRef = 'TEST'

    expect(validateFileRef(fileRef)).toBeTruthy()
  })

  test('it should return true for a file ref containing characters and underscores', () => {
    const fileRef = 'TES_T'

    expect(validateFileRef(fileRef)).toBeTruthy()
  })

  test('it should return true for a file ref containing characters, numbers and underscores', () => {
    const fileRef = 'TES_T12'

    expect(validateFileRef(fileRef)).toBeTruthy()
  })

  test('it should return true for a file ref starting with an underscore', () => {
    const fileRef = '_TES_T12'

    expect(validateFileRef(fileRef)).toBeTruthy()
  })

  test('it should throw an error when the file ref is longer than 8 chars', () => {
    const fileRef = '_TES_T12435'

    expect(() => validateFileRef(fileRef)).toThrow(
      'File ref is too long. File refs can have a maximum of 8 characters.'
    )
  })

  test('it should throw an error when the file ref is falsy', () => {
    const fileRef = ''

    expect(() => validateFileRef(fileRef)).toThrow('Missing file ref.')
  })

  test('it should throw an error when the file ref does not conform to specification', () => {
    const fileRef = '123ASDF'

    expect(() => validateFileRef(fileRef)).toThrow(
      'Invalid file ref. File refs can only start with a letter or an underscore, and contain only letters, numbers and underscores.'
    )
  })
})
