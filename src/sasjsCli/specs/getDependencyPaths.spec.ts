import path from 'path'
import {
  readFile,
  getDependencyPaths,
  prioritiseDependencyOverrides
} from '../..'

const root = path.join(__dirname, '..', '..', '..')
const macroCorePath = path.join(root, 'node_modules', '@sasjs', 'core')

describe('getDependencyPaths', () => {
  test('it should recursively get all dependency paths', async () => {
    const fileContent = await readFile(
      path.join(__dirname, 'testFiles', 'example.sas')
    )
    const dependenciesList = [
      'mp_abort.sas',
      'mf_getuniquefileref.sas',
      'mf_getuniquelibref.sas',
      'mf_isblank.sas',
      'mf_mval.sas',
      'mf_trimstr.sas',
      'mf_getplatform.sas',
      'mf_abort.sas',
      'mfv_existfolder.sas',
      'mv_createfolder.sas'
    ]

    const dependencyPaths = await getDependencyPaths(
      fileContent,
      [],
      macroCorePath
    )

    dependencyPaths.forEach((dep) => {
      expect(dependenciesList.some((x) => dep.includes(x))).toBeTruthy()
    })
  })

  test('it should get third level dependencies', async () => {
    const fileContent = await readFile(
      path.join(__dirname, 'testFiles', 'nested-deps.sas')
    )
    const dependenciesList = [
      'mf_isblank.sas',
      'mm_createwebservice.sas',
      'mm_createstp.sas',
      'mf_getuser.sas',
      'mm_createfolder.sas',
      'mm_deletestp.sas',
      'mf_nobs.sas',
      'mf_getattrn.sas',
      'mf_abort.sas',
      'mf_verifymacvars.sas',
      'mm_getdirectories.sas',
      'mm_updatestpsourcecode.sas',
      'mp_dropmembers.sas',
      'mm_getservercontexts.sas',
      'mm_getrepos.sas'
    ]

    const dependencyPaths = await getDependencyPaths(
      fileContent,
      [],
      macroCorePath
    )

    dependenciesList.forEach((expectedDep) => {
      expect(
        dependencyPaths.some((dep) => dep.includes(expectedDep))
      ).toBeTruthy()
    })
  })

  test('it should throw an error when a dependency is not found', async () => {
    const missingDependencies = ['foobar.sas', 'foobar2.sas']

    const fileContent = await readFile(
      path.join(__dirname, 'testFiles', 'missing-dependency.sas')
    )

    await expect(
      getDependencyPaths(fileContent, [], macroCorePath)
    ).rejects.toEqual(
      `Unable to locate dependencies: ${missingDependencies.join(', ')}`
    )
  })

  test('it should throw an error when a dependency Path is not found', async () => {
    const fileContent = await readFile(
      path.join(__dirname, 'testFiles', 'missing-dependency.sas')
    )

    const noDir = 'non-existing/dir'
    await expect(
      getDependencyPaths(fileContent, [noDir], macroCorePath)
    ).rejects.toEqual(
      `Error listing dependency paths: Source path ${noDir} does not exist.`
    )
  })

  test('it should ignore non-sas dependencies', async () => {
    const fileContent = await readFile(
      path.join(__dirname, 'testFiles', 'non-sas-dependency.sas')
    )
    const dependenciesList = [
      'mp_abort.sas',
      'mf_getuniquefileref.sas',
      'mf_getuniquelibref.sas',
      'mf_isblank.sas',
      'mf_mval.sas',
      'mf_trimstr.sas',
      'mf_getplatform.sas',
      'mf_abort.sas',
      'mfv_existfolder.sas',
      'mv_createfolder.sas'
    ]

    await expect(
      getDependencyPaths(fileContent, [], macroCorePath)
    ).resolves.not.toThrow()

    const dependencyPaths = await getDependencyPaths(
      fileContent,
      [],
      macroCorePath
    )

    dependencyPaths.forEach((dep) => {
      expect(dependenciesList.some((x) => dep.includes(x))).toBeTruthy()
    })
  })

  test('it should prioritise overridden dependencies', () => {
    const dependencyNames = ['mf_abort.sas']
    const mfAbortPath = path.join('sas', 'macros', 'mf_abort.sas')
    const dependencyPaths = [
      path.join('node_modules', '@sasjs', 'core', 'core', 'mf_abort.sas'),
      mfAbortPath
    ]

    const result = prioritiseDependencyOverrides(
      dependencyNames,
      dependencyPaths
    )

    expect(result).toEqual([mfAbortPath])
  })

  test('it should prioritise overridden dependencies, if both are non-core', () => {
    const dependencyNames = ['mf_abort.sas']
    const mfAbortPath = path.join('sas', 'macros', 'mf_abort.sas')
    const dependencyPaths = [
      mfAbortPath,
      path.join('sas', 'macros2', 'mf_abort.sas')
    ]

    const result = prioritiseDependencyOverrides(
      dependencyNames,
      dependencyPaths,
      ['macros', 'macros2']
    )

    expect(result).toEqual([mfAbortPath])
  })

  test('it should prioritise overridden dependencies with windows file paths', () => {
    const dependencyNames = ['mf_abort.sas']
    const dependencyPaths = [
      'node_modules\\@sasjs\\core\\core\\mf_abort.sas',
      'sas\\macros\\mf_abort.sas'
    ]

    const result = prioritiseDependencyOverrides(
      dependencyNames,
      dependencyPaths,
      [],
      '\\'
    )

    expect(result).toEqual(['sas\\macros\\mf_abort.sas'])
  })

  test('it should prioritise overridden dependencies provided specific macros', () => {
    const dependencyNames = ['mf_abort.sas']
    const mfAbortPath = path.join('sas', 'sas9macros', 'mf_abort.sas')
    const dependencyPaths = [
      path.join('node_modules', '@sasjs', 'core', 'core', 'mf_abort.sas'),
      mfAbortPath,
      path.join('sas', 'macros', 'mf_abort.sas')
    ]

    const result = prioritiseDependencyOverrides(
      dependencyNames,
      dependencyPaths,
      ['sas9macros']
    )

    expect(result).toEqual([mfAbortPath])
  })

  test(`it should prioritise overridden dependencies, if specific 'macroLoc' was provided, but macro at such 'macroLoc' is not present`, () => {
    const dependencyNames = ['mf_abort.sas']
    const mfAbortPath = path.join('sas', 'macros', 'mf_abort.sas')
    const dependencyPaths = [
      path.join('node_modules', '@sasjs', 'core', 'core', 'mf_abort.sas'),
      mfAbortPath
    ]

    const result = prioritiseDependencyOverrides(
      dependencyNames,
      dependencyPaths,
      ['sas9macros']
    )

    expect(result).toEqual([mfAbortPath])
  })

  test('it should prioritise overridden dependencies and remove extra dependencies, if specific macros were provided', () => {
    const dependencyNames = ['mf_abort.sas']
    const mfAbortPath = path.join('sas', 'sas9macros', 'mf_abort.sas')
    const dependencyPaths = [
      path.join('node_modules', '@sasjs', 'core', 'core', 'mf_abort.sas'),
      path.join('sas', 'sasviyamacros', 'mf_abort.sas'),
      mfAbortPath,
      path.join('sas', 'macros2', 'mf_abort.sas'),
      path.join('sas', 'macros', 'mf_abort.sas')
    ]

    const result = prioritiseDependencyOverrides(
      dependencyNames,
      dependencyPaths,
      ['sas9macros']
    )

    expect(result).toEqual([mfAbortPath])
  })

  test('it should prioritise overridden dependencies and remove duplicated dependencies, if specific macros were provided', () => {
    const dependencyNames = ['mf_abort.sas']
    const mfAbortPath = path.join('sas', 'sas9macros', 'mf_abort.sas')
    const dependencyPaths = [
      path.join('node_modules', '@sasjs', 'core', 'core', 'mf_abort.sas'),
      mfAbortPath,
      mfAbortPath,
      path.join('sas', 'macros', 'mf_abort.sas'),
      path.join('sas', 'macros', 'mf_abort.sas')
    ]

    const result = prioritiseDependencyOverrides(
      dependencyNames,
      dependencyPaths,
      ['sas9macros']
    )

    expect(result).toEqual([mfAbortPath])
  })
})
