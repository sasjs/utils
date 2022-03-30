import {
  FileTree,
  ServiceMember,
  FileMember,
  FolderMember,
  MemberType
} from '../types'

export const isFileTree = (arg: any): arg is FileTree =>
  arg &&
  arg.members &&
  Array.isArray(arg.members) &&
  arg.members.filter(
    (member: ServiceMember | FileMember | FolderMember) =>
      !isServiceMember(member, '-') &&
      !isFileMember(member, '-') &&
      !isFolderMember(member, '-')
  ).length === 0

const isServiceMember = (arg: any, pre: string): arg is ServiceMember =>
  arg &&
  typeof arg.name === 'string' &&
  arg.type === MemberType.service &&
  typeof arg.code === 'string'

const isFileMember = (arg: any, pre: string): arg is ServiceMember =>
  arg &&
  typeof arg.name === 'string' &&
  arg.type === MemberType.file &&
  typeof arg.code === 'string'

const isFolderMember = (arg: any, pre: string): arg is FolderMember =>
  arg &&
  typeof arg.name === 'string' &&
  arg.type === MemberType.folder &&
  arg.members &&
  Array.isArray(arg.members) &&
  arg.members.filter(
    (member: FolderMember | ServiceMember) =>
      !isServiceMember(member, pre + '-') &&
      !isFileMember(member, pre + '-') &&
      !isFolderMember(member, pre + '-')
  ).length === 0

export const getTreeExample = (): FileTree => ({
  members: [
    {
      name: 'jobs',
      type: MemberType.folder,
      members: [
        {
          name: 'extract',
          type: MemberType.folder,
          members: [
            {
              name: 'makedata1',
              type: MemberType.service,
              code: '%put Hello World!;'
            }
          ]
        }
      ]
    }
  ]
})
