import { isMacroVars } from './macro'

describe('macro', () => {
  describe('isMacroVars', () => {
    it('should return true if provided valid macroVars', () => {
      expect(isMacroVars({ macroVars: {} })).toEqual(true)
      expect(isMacroVars({ macroVars: { var: 'value' } })).toEqual(true)
      expect(
        isMacroVars({ macroVars: { var: 'value' }, other: 'other' })
      ).toEqual(true)
    })

    it('should return false if provided not valid macroVars', () => {
      expect(isMacroVars({})).toEqual(false)
      expect(isMacroVars(true)).toEqual(false)
      expect(isMacroVars([])).toEqual(false)
      expect(isMacroVars({ wrong: {} })).toEqual(false)
      expect(isMacroVars({ macroVars: [] })).toEqual(false)
    })
  })
})
