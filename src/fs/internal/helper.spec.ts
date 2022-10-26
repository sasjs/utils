import * as ChunkModule from '../../utils/chunk'
import * as GetNodeModulePath from '../../utils/getNodeModulePath'
import { chunkFileContent, getCompiledMacrosCode } from './helper'

describe('chunkFileContent', () => {
  it('should return single line if fileContent does not exceed maxLength', () => {
    const result = chunkFileContent('It is a single line content')
    const expected = ` put 'It is a single line content';\n`
    expect(result).toEqual(expected)
  })

  it('should return multiline if fileContent exceeds maxLength', () => {
    jest
      .spyOn(ChunkModule, 'chunk')
      .mockImplementationOnce((text: string) => text.split(' '))

    const result = chunkFileContent('It is a multi line content')
    const expected = ` put 'It'@;
 put 'is'@;
 put 'a'@;
 put 'multi'@;
 put 'line'@;
 put 'content';
`
    expect(result).toEqual(expected)
  })
})

describe('getCompiledMacrosCode', () => {
  it('should throw error when @sasjs/core module is not found', async () => {
    jest
      .spyOn(GetNodeModulePath, 'getNodeModulePath')
      .mockImplementationOnce(() => Promise.resolve(''))

    await expect(getCompiledMacrosCode([] as string[])).rejects.toThrowError(
      '@sasjs/core could not be found'
    )
  })
})
