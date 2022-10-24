import path from 'path'
import { execSync } from 'child_process'
import { folderExists } from '../file'

export const getNodeModulePath = async (module: string): Promise<string> => {
  // Check if module is present in project's dependencies
  const projectPath = path.join(process.cwd(), 'node_modules', module)

  if (await folderExists(projectPath)) return projectPath

  // Check if module is present in @sasjs/utils located in project's dependencies
  const utilsDepsPath = path.join('@sasjs', 'utils', 'node_modules')
  const utilsLocalPath = path.join(
    process.cwd(),
    'node_modules',
    utilsDepsPath,
    module
  )

  if (await folderExists(utilsLocalPath)) return utilsLocalPath

  // Check if module is present in global @sasjs/utils
  const utilsGlobalPath = path.join(
    getGlobalNodeModulesPath(),
    utilsDepsPath,
    module
  )

  if (await folderExists(utilsGlobalPath)) return utilsGlobalPath

  // Return default value
  return ''
}

export const getGlobalNodeModulesPath = () =>
  execSync(`npm root -g`).toString().replace(/\n/, '')
