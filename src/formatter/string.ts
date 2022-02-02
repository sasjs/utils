export const sanitizeSpecialChars = (str: string) =>
  str.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  )

export const capitalizeFirstChar = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1)
