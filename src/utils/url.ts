export const urlOrigin = (str: string) => {
  if (str === '') return str

  let origin

  try {
    origin = new URL(str).origin
  } catch (_) {
    throw new Error('Invalid URL.')
  }

  return origin
}
