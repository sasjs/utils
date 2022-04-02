export enum MemberType {
  service = 'service',
  file = 'file',
  folder = 'folder'
}

export interface ServiceMember {
  name: string
  type: MemberType.service
  code: string
}

export interface FileMember {
  name: string
  type: MemberType.file
  code: string
}

export interface FolderMember {
  name: string
  type: MemberType.folder
  members: (FolderMember | ServiceMember | FileMember)[]
}

export interface FileTree {
  members: (FolderMember | ServiceMember | FileMember)[]
}
