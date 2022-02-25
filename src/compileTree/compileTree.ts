import path from 'path'
import { createFile } from '../'

export interface Leave {
  content: string
  dependencies: string[]
  location: string
}

export interface Tree {
  [key: string]: Leave
}

export class CompileTree {
  private _tree: Tree
  private _treePath: string

  constructor(treePath: string, tree: Tree = {}) {
    this._treePath = treePath
    this._tree = tree
  }

  get tree() {
    return this._tree
  }

  public getLeave(location: string) {
    return this._tree[this.getFileName(location)]
  }

  public addLeave(leave: Leave) {
    this._tree[this.getFileName(leave.location)] = leave
  }

  public async saveTree() {
    await createFile(this._treePath, JSON.stringify(this._tree, null, 2))
  }

  private getFileName(location: string) {
    return location.split(path.sep)[location.split(path.sep).length - 1]
  }
}
