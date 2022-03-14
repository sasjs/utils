import { CompileTree, Tree } from './'
import { readFile, deleteFile, fileExists } from '../'
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
})
