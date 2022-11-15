import {
  getPreCode,
  callWeboutMacro,
  preCodeViya,
  preCodeEnd
} from '../getPreCode'
import { ServerType } from '../..'
import * as fileModule from '../../file/file'
import path from 'path'

describe('getPreCode', () => {
  const getMacroContent = (filePath: string) => {
    const fileName = filePath.split(path.sep).pop()

    return `* ${fileName} content start;
* ${fileName} content end;
`
  }

  beforeEach(() => {
    jest
      .spyOn(fileModule, 'readFile')
      .mockImplementation((filePath: string) =>
        Promise.resolve(getMacroContent(filePath))
      )
  })

  it(`should return preCode for ${ServerType.SasViya}`, async () => {
    const expectedPreCode = `${
      getMacroContent('mf_getuser.sas') +
      getMacroContent('mp_jsonout.sas') +
      getMacroContent('mv_webout.sas') +
      preCodeViya +
      callWeboutMacro('mv_webout') +
      preCodeEnd
    }`

    await expect(getPreCode(ServerType.SasViya, '')).resolves.toEqual(
      expectedPreCode
    )
  })

  it(`should return preCode for ${ServerType.Sas9}`, async () => {
    const expectedPreCode = `${
      getMacroContent('mf_getuser.sas') +
      getMacroContent('mp_jsonout.sas') +
      getMacroContent('mm_webout.sas') +
      callWeboutMacro('mm_webout') +
      preCodeEnd
    }`

    await expect(getPreCode(ServerType.Sas9, '')).resolves.toEqual(
      expectedPreCode
    )
  })

  it(`should return preCode for ${ServerType.Sasjs}`, async () => {
    const expectedPreCode = `${
      getMacroContent('mf_getuser.sas') +
      getMacroContent('mp_jsonout.sas') +
      getMacroContent('ms_webout.sas') +
      callWeboutMacro('ms_webout') +
      preCodeEnd
    }`

    await expect(getPreCode(ServerType.Sasjs, '')).resolves.toEqual(
      expectedPreCode
    )
  })
})
