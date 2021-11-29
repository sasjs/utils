import find from 'find'
import uniqBy from 'lodash.uniqby'
import { readFile } from '../file'
import { asyncForEach, chunk } from '../utils'
import { getProgramList } from './'

export const getProgramDependencies = async (
  fileContent: string,
  programFolders: string[],
  filePath?: string
) => {
  programFolders = (uniqBy as any)(programFolders)
  const programs = getProgramList(fileContent)
  if (programs.length) {
    const foundPrograms: string[] = []
    const foundProgramNames: string[] = []
    await asyncForEach(programFolders, async (programFolder) => {
      await asyncForEach(programs, async (program) => {
        const filePaths = find.fileSync(program.fileName, programFolder)
        if (filePaths.length) {
          const fileContent = await readFile(filePaths[0])

          if (!fileContent) {
            // process.logger?.warn(
            //   `Program file ${path.join(
            //     programFolder,
            //     program.fileName
            //   )} is empty.`
            // )
          }

          const programDependencyContent = getProgramDependencyText(
            fileContent,
            program.fileRef
          )
          foundPrograms.push(programDependencyContent)
          foundProgramNames.push(program.fileName)
        }
      })
    })

    const notFoundProgramNames = programs.filter(
      (program) => !foundProgramNames.includes(program.fileName)
    )
    if (notFoundProgramNames.length) {
      const programList = notFoundProgramNames
        .map(
          (program, i) =>
            `${i + 1}. '${program.fileName}' with fileRef '${program.fileRef}'`
        )
        .join('\n')

      throw new Error(
        `Unable to load dependencies for: ${filePath}\n` +
          `The following files were listed under SAS Programs but could not be found:\n` +
          `${programList}\n` +
          `Please check that they exist in the folder(s) listed in the \`programFolders\` array in your sasjsconfig.json file.\n` +
          `Program Folders:\n` +
          programFolders.map((pf) => `- ${pf}`).join('\n')
      )
    }

    return foundPrograms.join('\n')
  }

  return ''
}

const getProgramDependencyText = (
  fileContent: string,
  fileRef: string
): string => {
  let output = `filename ${fileRef} temp;\ndata _null_;\nfile ${fileRef} lrecl=32767;\n`

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

  return output
}
