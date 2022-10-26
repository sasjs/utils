import path from 'path'
import {
  getNodeModulePath,
  getGlobalNodeModulesPath
} from '../getNodeModulePath'
import ChildProcess from 'child_process'
import * as FileModule from '../../file'
import * as getNodeModulePathModule from '../getNodeModulePath'

describe('getNodeModulePath', () => {
  it('should return module path from main node_modules folder', async () => {
    jest
      .spyOn(FileModule, 'folderExists')
      .mockImplementationOnce(() => Promise.resolve(true))

    const expected = path.join(process.cwd(), 'node_modules', 'test')
    const received = await getNodeModulePath('test')

    expect(received).toEqual(expected)
  })

  it('should return module path from nested @sasjs/utils node_modules folder', async () => {
    jest
      .spyOn(FileModule, 'folderExists')
      .mockImplementationOnce(() => Promise.resolve(false))

    jest
      .spyOn(FileModule, 'folderExists')
      .mockImplementationOnce(() => Promise.resolve(true))

    const utilsDepsPath = path.join('@sasjs', 'utils', 'node_modules')
    const expected = path.join(
      process.cwd(),
      'node_modules',
      utilsDepsPath,
      'test'
    )
    const received = await getNodeModulePath('test')

    expect(received).toEqual(expected)
  })

  it('should return module path from global @sasjs/utils node_modules folder', async () => {
    jest
      .spyOn(FileModule, 'folderExists')
      .mockImplementationOnce(() => Promise.resolve(false))

    jest
      .spyOn(FileModule, 'folderExists')
      .mockImplementationOnce(() => Promise.resolve(false))

    jest
      .spyOn(FileModule, 'folderExists')
      .mockImplementationOnce(() => Promise.resolve(true))

    jest
      .spyOn(getNodeModulePathModule, 'getGlobalNodeModulesPath')
      .mockImplementationOnce(() => 'global_path')

    const utilsDepsPath = path.join('@sasjs', 'utils', 'node_modules')
    const expected = path.join('global_path', utilsDepsPath, 'test')
    const received = await getNodeModulePath('test')

    expect(received).toEqual(expected)
  })

  it('should return blank string when module is not  found anywhere', async () => {
    jest
      .spyOn(FileModule, 'folderExists')
      .mockImplementationOnce(() => Promise.resolve(false))

    jest
      .spyOn(FileModule, 'folderExists')
      .mockImplementationOnce(() => Promise.resolve(false))

    jest
      .spyOn(FileModule, 'folderExists')
      .mockImplementationOnce(() => Promise.resolve(false))

    jest
      .spyOn(getNodeModulePathModule, 'getGlobalNodeModulesPath')
      .mockImplementationOnce(() => 'global_path')

    const expected = ''
    const received = await getNodeModulePath('test')

    expect(received).toEqual(expected)
  })
})

describe('getGlobalNodeModulesPath', () => {
  it('should return global path of node_modules', () => {
    jest.spyOn(ChildProcess, 'execSync')

    expect(getGlobalNodeModulesPath()).toContain('node_modules')
    expect(ChildProcess.execSync).toHaveBeenCalledWith('npm root -g')
  })
})
