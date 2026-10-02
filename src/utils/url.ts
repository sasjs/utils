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

const hasHttpProtocol = (str: string, protocol: string) => {
  try {
    const url = new URL(str)

    return url.protocol === protocol && !!url.hostname
  } catch (_) {
    return false
  }
}

export const isHttpUri = (str: string) => hasHttpProtocol(str, 'http:')

export const isHttpsUri = (str: string) => hasHttpProtocol(str, 'https:')
