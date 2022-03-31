import { getTreeExample, isFileTree } from './fileTree'

describe('isFileTree', () => {
  it('should return true for valid file tree', () => {
    expect(isFileTree(getTreeExample())).toBeTruthy()
  })

  it('should return fail for null file tree', () => {
    expect(isFileTree(null)).toBeFalsy()
  })

  it('should return fail for undefined file tree', () => {
    expect(isFileTree(undefined)).toBeFalsy()
  })

  it('should return fail for string file tree', () => {
    expect(isFileTree('data')).toBeFalsy()
  })

  it('should return fail for empty file tree', () => {
    expect(isFileTree({})).toBeFalsy()
  })

  it('should return fail for invalid file tree', () => {
    expect(
      isFileTree({
        userId: 1,
        title: 'test is cool'
      })
    ).toBeFalsy()
    expect(
      isFileTree({
        membersWRONG: []
      })
    ).toBeFalsy()
    expect(
      isFileTree({
        members: {}
      })
    ).toBeFalsy()
    expect(
      isFileTree({
        members: [
          {
            nameWRONG: 'jobs',
            type: 'folder',
            members: []
          }
        ]
      })
    ).toBeFalsy()
    expect(
      isFileTree({
        members: [
          {
            name: 'jobs',
            type: 'WRONG',
            members: []
          }
        ]
      })
    ).toBeFalsy()
    expect(
      isFileTree({
        members: [
          {
            name: 'jobs',
            type: 'folder',
            members: [
              {
                name: 'extract',
                type: 'folder',
                members: [
                  {
                    name: 'makedata1',
                    type: 'service',
                    codeWRONG: '%put Hello World!;'
                  }
                ]
              }
            ]
          }
        ]
      })
    ).toBeFalsy()
  })
})
