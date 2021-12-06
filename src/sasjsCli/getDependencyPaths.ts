import find from 'find'
import { folderExists, readFile } from '../file'
import { asyncForEach, diff } from '../utils'
import { prioritiseDependencyOverrides, getList } from './'

export async function getDependencyPaths(
  fileContent: string,
  macroFolders: string[],
  macroCorePath: string
) {
  const sourcePaths = [...macroFolders, macroCorePath]

  const dependenciesHeader = fileContent.includes('<h4> SAS Macros </h4>')
    ? '<h4> SAS Macros </h4>'
    : '<h4> Dependencies </h4>'

  let dependencies = getList(dependenciesHeader, fileContent).filter((d) =>
    d.endsWith('.sas')
  )

  let dependencyPaths: string[] = []
  const foundDependencies: string[] = []

  await asyncForEach(sourcePaths, async (sourcePath) => {
    if (await folderExists(sourcePath)) {
      await asyncForEach(dependencies, async (dep) => {
        const filePaths = find.fileSync(dep, sourcePath)
        if (filePaths.length) {
          const fileContent = await readFile(filePaths[0])
          foundDependencies.push(dep)
          dependencyPaths.push(
            ...(await getDependencyPaths(
              fileContent,
              macroFolders,
              macroCorePath
            ))
          )
        }
        dependencyPaths.push(...filePaths)
      })
    } else {
      const errorMessage = `Error listing dependency paths: Source path ${sourcePath} does not exist.`

      throw errorMessage
    }
  })
  const notFoundDependencies = diff(dependencies, foundDependencies)

  if (notFoundDependencies.length) {
    const errorMessage =
      'Unable to locate dependencies: ' + notFoundDependencies.join(', ')

    throw errorMessage
  }

  dependencyPaths = prioritiseDependencyOverrides(
    dependencies,
    dependencyPaths,
    macroFolders
  )

  return [...new Set(dependencyPaths)]
}
