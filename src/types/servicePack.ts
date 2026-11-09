import { FileTree } from './fileTree'

export interface ServicePackSASjs {
  fileTree: FileTree
  appLoc: string
  streamServiceName?: string
  streamWebFolder?: string
  streamLogo?: string
  /**
   * Write the tree as the folder's whole contents: the folder is removed before
   * the tree is written, so an asset the new version dropped stops being
   * served. Absent means the deploy writes over what is there.
   */
  replace?: boolean
}
