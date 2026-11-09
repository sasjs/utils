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

/**
 * How a file member carries its bytes.
 *
 * `utf8` is what an absent `encoding` means: `code` is the file's text. A
 * binary asset states `base64`, and its `code` is base64 of the bytes to write.
 */
export type FileEncoding = 'utf8' | 'base64'

export interface FileMember {
  name: string
  type: MemberType.file
  code: string
  /** Absent means `utf8`. See {@link FileEncoding}. */
  encoding?: FileEncoding
}

export interface FolderMember {
  name: string
  type: MemberType.folder
  members: (FolderMember | ServiceMember | FileMember)[]
}

export interface FileTree {
  members: (FolderMember | ServiceMember | FileMember)[]
}
