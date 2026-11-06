import { throwIfDoxygenHeaderClosesEarly } from './doxygenHeader'

// Removes header from SAS file
// If string begins with a multiline comment, remove the comment
// Ignore any preceding white space or line breaks
//
// This lives in its own module (rather than beside CompileTree) so that callers
// which are imported by the package barrel - the compiler's file loader among
// them - can use it without importing the tree, which imports the barrel back.
export const removeHeader = (content: string, filePath?: string) => {
  throwIfDoxygenHeaderClosesEarly(content, filePath)

  return content.replace(
    new RegExp(`^\\s*\\/(\\*){1,2}([\\s\\S]*?)(\\*){1,2}\\/`),
    ''
  )
}
