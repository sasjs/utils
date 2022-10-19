export interface HashedFile {
  hash: string
  absolutePath: string
  relativePath: string
  isFile: boolean
}

export interface HashedFolder extends HashedFile {
  members: (HashedFile | HashedFolder)[]
}
