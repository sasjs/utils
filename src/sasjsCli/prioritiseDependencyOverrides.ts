import path from 'path'

export const prioritiseDependencyOverrides = (
  dependencyNames: string[],
  dependencyPaths: string[],
  macroPaths: string[] = [],
  pathSeparator = path.sep
) => {
  dependencyPaths = [...new Set(dependencyPaths)]
  dependencyNames.forEach((depFileName) => {
    const paths = dependencyPaths.filter((p) =>
      p.includes(`${pathSeparator}${depFileName}`)
    )

    let overriddenDependencyPaths = paths.filter(
      (p) => !p.includes('node_modules')
    )
    if (macroPaths.length) {
      const foundInMacroPaths = overriddenDependencyPaths.filter((p) => {
        const pathExist = macroPaths.find((tm) => p.includes(tm))
        return pathExist ? true : false
      })
      if (foundInMacroPaths.length)
        overriddenDependencyPaths = [foundInMacroPaths[0]]
    }

    if (
      overriddenDependencyPaths.length &&
      overriddenDependencyPaths.length != paths.length
    ) {
      const pathsToRemove = paths.filter(
        (el) => overriddenDependencyPaths.indexOf(el) < 0
      )
      dependencyPaths = dependencyPaths.filter(
        (el) => pathsToRemove.indexOf(el) < 0
      )
    }
  })

  return dependencyPaths
}
