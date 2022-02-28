import find from 'find'
import { folderExists, readFile } from '../file'
import { asyncForEach, diff } from '../utils'
import { prioritiseDependencyOverrides, getList } from './'
import { CompileTree } from '../compileTree'

export async function getDependencyPaths(
  fileContent: string,
  macroFolders: string[],
  macroCorePath: string,
  compileTree?: CompileTree
) {
  let dependencyPaths: string[] = []
  const foundDependencies: string[] = []
  const sourcePaths = [...macroFolders, macroCorePath]

  const dependenciesHeader = fileContent.includes('<h4> SAS Macros </h4>')
    ? '<h4> SAS Macros </h4>'
    : '<h4> Dependencies </h4>'
  const dependencies = getList(dependenciesHeader, fileContent).filter((d) =>
    d.endsWith('.sas')
  )

  // Search dependencies recursively starting from macroFolders and ending in macroCorePath
  await asyncForEach(sourcePaths, async (sourcePath) => {
    if (await folderExists(sourcePath)) {
      await asyncForEach(dependencies, async (dep) => {
        const filePaths = find.fileSync(dep, sourcePath)

        if (filePaths.length) {
          let fileContent = ''

          if (compileTree && Object.keys(compileTree).length) {
            const compiledFile = compileTree.getLeaf(filePaths[0])

            if (compiledFile) {
              fileContent = compiledFile.content
            } else {
              fileContent = await readFile(filePaths[0])

              compileTree.addLeave({
                content: fileContent,
                dependencies: [],
                location: filePaths[0]
              })
            }
          } else {
            fileContent = await readFile(filePaths[0])
          }

          foundDependencies.push(dep)
          dependencyPaths.push(
            ...(await getDependencyPaths(
              fileContent,
              macroFolders,
              macroCorePath,
              compileTree
            ))
          )
        }

        dependencyPaths.push(...filePaths)
      })
    } else if (macroFolders.includes(sourcePath)) {
      throw `Error listing dependency paths: Source path ${sourcePath} does not exist.`
    }
  })

  const notFoundDependencies = diff(dependencies, foundDependencies)

  if (notFoundDependencies.length) {
    throw 'Unable to locate dependencies: ' + notFoundDependencies.join(', ')
  }

  dependencyPaths = prioritiseDependencyOverrides(
    dependencies,
    dependencyPaths,
    macroFolders
  )

  return [...new Set(dependencyPaths)]
}
