import { uniqArray } from '../utils'
import { getList, validateFileRef } from './'
import { asyncForEach, chunk } from '../utils'
import find from 'find'
import { readFile } from '../file'

// REFACTOR: move logic supporting SAS Macros dependencies to this file

export enum DependencyType {
  Macro = 'Macro',
  Include = 'Include',
  Binary = 'Binary'
}

interface DepInfo {
  name: string
  header: string
  config: string
  type: DependencyType
}

interface DeconstructedDep {
  fileName: string
  fileRef: string
}

const getDepInfo = (depType: DependencyType, fileContent: string): DepInfo => {
  let header = ''

  switch (depType) {
    case DependencyType.Binary:
      header = 'Binary Files'

      break
    case DependencyType.Include:
      header = fileContent.includes('<h4> SAS Includes </h4>')
        ? 'SAS Includes'
        : 'SAS Programs'

      break

    default:
      break
  }

  const depInfo = {
    name: header,
    header: `<h4> ${header} </h4>`,
    config: `${(depType === DependencyType.Include
      ? 'Program'
      : depType
    ).toLowerCase()}Folders`,
    type: depType
  }

  return depInfo
}

export const getDependencies = async (
  fileName: string | undefined,
  fileContent: string,
  folders: string[],
  depType: DependencyType
) => {
  folders = uniqArray(folders)

  const depInfo = getDepInfo(depType, fileContent)

  const deps = deconstructDependency(
    getList(depInfo.header, fileContent),
    depInfo
  )

  const uniqDeps: DeconstructedDep[] = []

  deps.forEach(
    (dep: DeconstructedDep) =>
      uniqDeps.find((d) => dep.fileName === d.fileName) || uniqDeps.push(dep)
  )

  if (uniqDeps.length) {
    const foundDeps: string[] = []
    const foundDepsNames: string[] = []

    await asyncForEach(folders, async (folder) => {
      await asyncForEach(uniqDeps, async (dep) => {
        const filePaths = find.fileSync(dep.fileName, folder)

        if (filePaths.length) {
          const encodedFileContent = await readFile(
            filePaths[0],
            depType === DependencyType.Binary ? 'base64' : undefined
          )

          const depContent = compileDep(
            depType,
            encodedFileContent,
            dep.fileRef
          )

          foundDeps.push(depContent)
          foundDepsNames.push(dep.fileName)
        }
      })
    })

    const notFoundDeps = deps
      .filter((dep) => !foundDepsNames.includes(dep.fileName))
      .map(
        (dep, i) => `${i + 1}. '${dep.fileName}' with fileRef '${dep.fileRef}'`
      )
      .join('\n')

    if (notFoundDeps.length) {
      let depFolder = depInfo.config.replace(/([A-Z]+)/g, ' $1')
      depFolder = depFolder.charAt(0).toUpperCase() + depFolder.slice(1)

      throw new Error(
        `Unable to load dependencies for: ${fileName || ''}\n` +
          `The following files were listed under ${depInfo.name} but could not be found:\n` +
          `${notFoundDeps}\n` +
          `Please check that they exist in the folder(s) listed in the \`${depInfo.config}\` array in your sasjsconfig.json file.\n` +
          `${depFolder}:\n` +
          folders.map((folder) => `- ${folder}`).join('\n')
      )
    }

    return foundDeps.join('\n')
  }

  return ''
}

const deconstructDependency = (
  deps: string[],
  depInfo: DepInfo
): DeconstructedDep[] =>
  deps.map((dep: string) => {
    const [fileName, fileRef] = dep.split(' ').filter((f: string) => !!f)

    if (!fileName) {
      throw new Error(
        `${depInfo.name} entry is empty. Please specify ${depInfo.name} dependencies in the format: @li <filename> <fileref>`
      )
    }

    if (!fileRef && depInfo.type !== DependencyType.Macro) {
      throw new Error(
        `${depInfo.name} ${fileName} is missing fileref. Please specify ${depInfo.name} dependencies in the format: @li <filename> <fileref>`
      )
    }

    if (depInfo.type !== DependencyType.Macro) validateFileRef(fileRef)

    return { fileName, fileRef }
  })

const compileDep = (
  depType: DependencyType,
  fileContent: string,
  fileRef: string
): string => {
  let output = ''

  if (depType === DependencyType.Binary) {
    output = [
      `filename _sjstmp "%sysfunc(pathname(work))/base64_${fileRef}" recfm=n;`,
      `data _null_;`,
      `file _sjstmp;\n`
    ].join(`\n`)

    const sourceLines = fileContent
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter((l) => !!l)

    sourceLines.forEach((line) => {
      const chunkedLines = chunk(line)
      if (chunkedLines.length === 1) {
        output += `put '${chunkedLines[0].split("'").join("''")}';\n`
      } else {
        let combinedLines = ''
        chunkedLines.forEach((chunkedLine, index) => {
          let text = `put '${chunkedLine.split("'").join("''")}'`
          if (index !== chunkedLines.length - 1) {
            text += '@;\n'
          } else {
            text += ';\n'
          }
          combinedLines += text
        })
        output += combinedLines
      }
    })

    output += `run;\n`

    const sasCodeToDecodeBase64 = [
      `filename ${fileRef} "%sysfunc(pathname(work))/sasjs_${fileRef}";`,
      `data _null_;`,
      `length filein 8 fileout 8;`,
      `filein = fopen("_sjstmp",'I',4,'B');`,
      `fileout = fopen("${fileRef}",'O',3,'B');`,
      `char= '20'x;`,
      `do while(fread(filein)=0);`,
      `length raw $4;`,
      `do i=1 to 4;`,
      `rc=fget(filein,char,1);`,
      `substr(raw,i,1)=char;`,
      `end;`,
      `rc = fput(fileout,input(raw,$base64X4.));`,
      `rc = fwrite(fileout);`,
      `end;`,
      `rc = fclose(filein);`,
      `rc = fclose(fileout);`,
      `run;`,
      `filename _sjstmp clear;`
    ]

    output += sasCodeToDecodeBase64.join(`\n`)
  } else if (depType === DependencyType.Include) {
    output = `filename ${fileRef} temp;\ndata _null_;\nfile ${fileRef} lrecl=32767;\n`

    const sourceLines = fileContent
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter((l) => !!l)

    sourceLines.forEach((line) => {
      const chunkedLines = chunk(line)
      if (chunkedLines.length === 1) {
        output += `put '${chunkedLines[0].split("'").join("''")}';\n`
      } else {
        let combinedLines = ''
        chunkedLines.forEach((chunkedLine, index) => {
          let text = `put '${chunkedLine.split("'").join("''")}'`
          if (index !== chunkedLines.length - 1) {
            text += '@;\n'
          } else {
            text += ';\n'
          }
          combinedLines += text
        })
        output += combinedLines
      }
    })

    output += 'run;'
  }

  return output
}
