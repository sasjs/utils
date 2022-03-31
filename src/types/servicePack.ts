import { FileTree } from './fileTree'

export interface ServicePackSASjs {
  fileTree: FileTree
  appLoc: string
  streamServiceName?: string
  streamWebFolder?: string
  streamLogo?: string
}
