import { CompileTree, Tree, removeHeader } from './'
import {
  readFile,
  deleteFile,
  fileExists,
  DependencyType,
  DependencyHeader
} from '../'
import path from 'path'

describe('CompileTree', () => {
  const tree: Tree = {
    'test.sas': {
      content: 'content',
      dependencies: [],
      location: 'test.sas'
    }
  }
  const treePath = path.join(process.cwd(), 'test_compileTree.json')
  const compileTree = new CompileTree(treePath, tree)

  afterAll(async () => {
    await deleteFile(treePath)
  })

  it('should return compile tree', () => {
    expect(compileTree.tree).toEqual(tree)
  })

  it('should save compile tree', async () => {
    await compileTree.saveTree()

    await expect(fileExists(treePath)).resolves.toEqual(true)
    await expect(readFile(treePath)).resolves.toEqual(
      JSON.stringify(tree, null, 2)
    )
  })

  it('should validate dependencies', () => {
    const testDepPath = 'test.sas'
    const getTestContent = (header: DependencyHeader) => `/**
  @file macroWithInclude.sas
  @brief test macro

  ${header}
**/

proc sql;
create table areas as select distinct area
  from mydb.springs;
  `

    const getExpectedError = (header: DependencyHeader) =>
      new Error(
        `Dependency '${header}' can not be used in artefact type '${DependencyType.Macro}'. Please remove it from '${testDepPath}'.`
      )

    expect(() =>
      compileTree['validateDependency'](
        getTestContent(DependencyHeader.Include),
        testDepPath,
        DependencyType.Macro
      )
    ).toThrow(getExpectedError(DependencyHeader.Include))
    expect(() =>
      compileTree['validateDependency'](
        getTestContent(DependencyHeader.Binary),
        testDepPath,
        DependencyType.Macro
      )
    ).toThrow(getExpectedError(DependencyHeader.Binary))

    expect(() =>
      compileTree['validateDependency'](
        getTestContent(DependencyHeader.Binary),
        testDepPath
      )
    ).not.toThrow()
    expect(() =>
      compileTree['validateDependency'](
        getTestContent(DependencyHeader.Binary),
        testDepPath,
        DependencyType.Binary
      )
    ).not.toThrow()
  })
})

describe('removeHeader', () => {
  const header = `/**
  @file test
  @sastype_job
  @brief HEADER
  @details some details


  <h4> SAS Macros </h4>
  @li example.sas

  <h4> Data Outputs </h4>
  @li sas9hrdb.test

**/`
  const content = `
%example(runjob1 is executing)
`
  const whiteSpaces = ' '.repeat(Math.random() * 1000)
  const lineBreaks = '\n'.repeat(Math.random() * 1000)

  it('should remove header from the beginning of the file', () => {
    expect(removeHeader(header + content)).toEqual(content)
  })

  it('should remove header from the beginning of the file with random number of white spaces', () => {
    expect(removeHeader(whiteSpaces + header + content)).toEqual(content)
  })

  it('should remove header from the beginning of the file with random number of white spaces and lineBreaks', () => {
    expect(
      removeHeader(whiteSpaces + lineBreaks + whiteSpaces + header + content)
    ).toEqual(content)
  })
})
