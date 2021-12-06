import { getProgramList } from './'

const fileContent = `
/**
  <h4> SAS Programs </h4>
  @li  
**/
`

describe('getProgramList', () => {
  test('should throw when filename is missing', () => {
    expect(() => {
      getProgramList(fileContent)
    }).toThrow(
      'SAS Program entry is empty. Please specify SAS program dependencies in the format: @li <filename> <fileref>'
    )
  })
})
