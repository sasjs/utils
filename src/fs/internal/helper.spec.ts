import * as ChunkModule from '../../utils/chunk'
import { chunkFileContent } from './helper'

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
