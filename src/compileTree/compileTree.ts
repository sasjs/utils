import path from 'path'
import { createFile, readFile } from '../'
import {
  getList,
  DependencyHeader,
  getDeprecatedHeader,
  DependencyType
} from '../sasjsCli'

export interface Leaf {
  content: string
  dependencies: string[]
  location: string
}

export interface Tree {
  [key: string]: Leaf
}

export class CompileTree {
  private _tree: Tree
  private _treePath: string

  constructor(treePath: string, tree: Tree = {}) {
    this._treePath = treePath
    this._tree = tree
  }

  // Returns entire tree
  get tree() {
    return this._tree
  }

  // Returns tree leaf
  public getLeaf(location: string) {
    return this._tree[this.getFileName(location)]
  }

  // Adds leaf
  public addLeaf(leaf: Leaf) {
    leaf.dependencies = getList(
      getDeprecatedHeader(leaf.content, DependencyHeader.Macro),
      leaf.content
    )
    leaf.content = removeHeader(leaf.content)

    this._tree[this.getFileName(leaf.location)] = leaf

    return leaf
  }

  // Saves tree to sasjsbuild folder
  public async saveTree() {
    await createFile(this._treePath, JSON.stringify(this._tree, null, 2))
  }

  // If leaf exists, returns it's content.
  // Otherwise reads file, creates leaf and return content.
  public async getDepContent(depPath: string, depType?: DependencyType) {
    const leaf = this.getLeaf(depPath)

    if (leaf) return leaf.content

    const content = await readFile(depPath, undefined)

    this.validateDependency(content, depPath, depType)

    return this.addLeaf({
      content,
      dependencies: [],
      location: depPath
    }).content
  }

  // Throws an error if wrong dependencies have been used
  private validateDependency(
    content: string,
    depPath: string,
    depType?: DependencyType
  ) {
    if (!depType) return

    const getErrorMessage = (
      header: DependencyHeader,
      dependency: DependencyType,
      depPath: string
    ) =>
      `Dependency '${header}' can not be used in artefact type '${dependency}'. Please remove it from '${depPath}'.`

    switch (depType) {
      case DependencyType.Macro:
        if (content.includes(DependencyHeader.Include)) {
          throw new Error(
            getErrorMessage(DependencyHeader.Include, depType, depPath)
          )
        } else if (content.includes(DependencyHeader.Binary)) {
          throw new Error(
            getErrorMessage(DependencyHeader.Binary, depType, depPath)
          )
        }

      default:
        break
    }
  }

  // Returns file name based on file path
  private getFileName(location: string) {
    return location.split(path.sep)[location.split(path.sep).length - 1]
  }
}

// Removes header from SAS file
// If string begins with a multiline comment, remove the comment
// Ignore any preceding white space or line breaks
export const removeHeader = (content: string) =>
  content.replace(new RegExp(`^\\s*\\/(\\*){1,2}([\\s\\S]*?)(\\*){1,2}\\/`), '')
