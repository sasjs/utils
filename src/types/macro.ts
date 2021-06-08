export interface MacroVar {
  [key: string]: string
}

export interface MacroVars {
  macroVars: MacroVar
}

export const isMacroVars = (arg: any): arg is MacroVars =>
  arg && typeof arg.macroVars === 'object' && !Array.isArray(arg.macroVars)
