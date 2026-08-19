import {
  hasTokenExpired,
  isAccessTokenExpiring,
  isRefreshTokenExpiring,
  decodeToken
} from './auth'
import { DecodedToken } from '../types'

describe('isAccessTokenExpiring', () => {
  it('should return true if the token is expiring in an hour', () => {
    const token = generateToken(3600)
    expect(isAccessTokenExpiring(token)).toBeTruthy()
  })

  it('should return true if the token is expiring in less than an hour', () => {
    const token = generateToken(600)
    expect(isAccessTokenExpiring(token)).toBeTruthy()
  })

  it('should return true if the token is not provided', () => {
    const token = undefined
    expect(isAccessTokenExpiring(token)).toBeTruthy()
  })

  it('should return false if the token is not expiring within an hour', () => {
    const token = generateToken(7200)
    expect(isAccessTokenExpiring(token)).toBeFalsy()
  })

  it('should return true if the token is expiring within the given time', () => {
    const token = generateToken(7200)
    expect(isAccessTokenExpiring(token, 8000)).toBeTruthy()
  })

  it('should return false if the token is not expiring within the given time', () => {
    const token = generateToken(120)
    expect(isAccessTokenExpiring(token, 60)).toBeFalsy()
  })

  it('should return false for an opaque (non-JWT) token', () => {
    expect(
      isAccessTokenExpiring('1f8da55057bd4f50a6577f0bc2b38b1a-r')
    ).toBeFalsy()
  })

  it('should return false for an opaque (non-JWT) token without any output', () => {
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    try {
      expect(
        isAccessTokenExpiring('1f8da55057bd4f50a6577f0bc2b38b1a-r')
      ).toBeFalsy()
      expect(debugSpy).not.toHaveBeenCalled()
      expect(errorSpy).not.toHaveBeenCalled()
    } finally {
      debugSpy.mockRestore()
      errorSpy.mockRestore()
    }
  })

  it('should return false for a JWT without an exp claim', () => {
    expect(isAccessTokenExpiring(generateTokenWithoutExp())).toBeFalsy()
  })
})

describe('isRefreshTokenExpiring', () => {
  it('should return true if the token is expiring in 30 seconds', () => {
    const token = generateToken(30)
    expect(isRefreshTokenExpiring(token)).toBeTruthy()
  })

  it('should return true if the token is expiring in less than 30 seconds', () => {
    const token = generateToken(10)
    expect(isRefreshTokenExpiring(token)).toBeTruthy()
  })

  it('should return true if the token is not provided', () => {
    const token = undefined
    expect(isRefreshTokenExpiring(token)).toBeTruthy()
  })

  it('should return false if the token is not expiring within 30 seconds', () => {
    const token = generateToken(120)
    expect(isRefreshTokenExpiring(token)).toBeFalsy()
  })

  it('should return true if the token is expiring within the given time', () => {
    const token = generateToken(7200)
    expect(isRefreshTokenExpiring(token, 8000)).toBeTruthy()
  })

  it('should return false if the token is not expiring within the given time', () => {
    const token = generateToken(120)
    expect(isRefreshTokenExpiring(token, 60)).toBeFalsy()
  })

  it('should return false for an opaque (non-JWT) token', () => {
    expect(
      isRefreshTokenExpiring('1f8da55057bd4f50a6577f0bc2b38b1a-r')
    ).toBeFalsy()
  })
})

describe('hasTokenExpired', () => {
  it('should return true if a token has expired', () => {
    const token = generateToken(0)
    expect(hasTokenExpired(token)).toBeTruthy()
  })

  it('should return true if a token is not provided', () => {
    expect(hasTokenExpired(undefined)).toBeTruthy()
  })

  it('should return false if a token has not expired', () => {
    const token = generateToken(36000)
    expect(hasTokenExpired(token)).toBeFalsy()
  })

  it('should return false for an opaque (non-JWT) token', () => {
    expect(hasTokenExpired('1f8da55057bd4f50a6577f0bc2b38b1a-r')).toBeFalsy()
  })

  it('should return false for a JWT without an exp claim', () => {
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' })
    ).toString('base64url')
    const payload = Buffer.from(JSON.stringify({ sub: 'test' })).toString(
      'base64url'
    )
    const signature = '4-iaDojEVl0pJQMjrbM1EzUIfAZgsbK_kgnVyVxFSVo'
    expect(hasTokenExpired(`${header}.${payload}.${signature}`)).toBeFalsy()
  })
})

describe('decodeToken', () => {
  it('decoded object should be of type DecodedToken', () => {
    const token =
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJ5dDVDNHRRYTNQZlFwczFadlg2MyIsImV4dF9pZCI6IlU3cWtaUWFsNzF1TjJxRXJqYmZ1IiwicmVtb3RlX2lwIjoiQ3l4Z0QzZEVvMGxkb0R0ZGxZcjUiLCJzdWIiOiJnZWJTM3pTZEM5MFNVTEx1MEpGZCIsInNjb3BlIjpbIjd2dFdUUUl2OU5yZ1dsRGd3YjNnIiwiZ1hlWU9sTUd1ZDdMdmtSUkpZeG4iXSwiY2xpZW50X2lkIjoiVUNvSHFteXMxcXRRa1VJQXRYUkoiLCJjaWQiOiJlaFM0V3NVZlVPWW80YmNjT0ZWZyIsImF6cCI6Ilg2dGUxbkRGeFZHN3ZFcUZxdlRZIiwiZ3JhbnRfdHlwZSI6InpyVUlmZFd4VEw1MnpqS29sMGx3IiwidXNlcl9pZCI6IkgyNkh2azJnMzZiNVhQU3NZZzBsIiwib3JpZ2luIjoidnJndGlUV1dqVU1VY3ZhdG92cFUiLCJ1c2VyX25hbWUiOiIxcDkxTmgzcXkyNDBHWDRDejN0cyIsImVtYWlsIjoiNXprcHZKaVludEdiSkdzTGU2bFIiLCJhdXRoX3RpbWUiOjE2MjU3NDY4NzEsInJldl9zaWciOiJ6RXdyNmlVbHB1N3dGMkVLek14UiIsImlhdCI6MTYyNTc0Njg3MSwiZXhwIjoxNjU1OTg2ODcxLCJpc3MiOiJ4RWFPNDdWMVRpc1FaVG54QjgyRSIsInppZCI6IkRycjlPNE9LU3J1R05HRXZZWWtOIiwiYXVkIjpbIlM3RU5pUk9LSGZ5OFZEMklOazJxIiwiMEgyZzI1cUpHaFNZdThkTjduWTgiXX0.N13nMjZ7CaMfNMZ_SzbVPnyBcTuau9V3x0SbiS45VOmz8veNgLEQ5fLqfyGStl8NzaHNr6B-Bh9DfmRIlr5KA-Hm2wXHSqvjDa52CZfD4R8JP2FyaSB7GJlv7X6Fz370WSeGR-Mwlrfgrrku8VSTXLKhha0NEft5nrOIXLW7Iel2_tkjTTiLtHyhlF3sM9BHkwJEn1t-0ppglrhBKb3MO0dQXjwDBHzqoXwGRMlvjK-6rU4RMYjRXv62cO2UEsRYWqZvvpJAnI-fj29HZTtjgPkWbEFlHAliHhyEZ5lLvP_S3sQ2Z2g5kK-ep4zMxqVKWvBbUI5GKi5PqcRnVWcptA'
    const decodedToken = decodeToken(token)
    expect(decodedToken).toBeTruthy()
  })
  it('should throw an error when token is invalid', () => {
    const token =
      'U4RMYjRXv62cO2UEsRYWqZvvpJAnI-fj29HZTtjgPkWbEFlHAliHhyEZ5lLvP_S3sQ2Z2g5kK-ep4zMxqVKWvBbUI5GKi5PqcRnVWcptA'
    let decodedToken
    let errorThrown = false
    try {
      decodedToken = decodeToken(token)
    } catch (error) {
      errorThrown = true
    }

    expect(errorThrown).toBeTruthy()
  })
})

const generateToken = (timeToLiveSeconds: number): string => {
  const exp =
    new Date(new Date().getTime() + timeToLiveSeconds * 1000).getTime() / 1000
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' })
  ).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url')
  const signature = '4-iaDojEVl0pJQMjrbM1EzUIfAZgsbK_kgnVyVxFSVo'
  const token = `${header}.${payload}.${signature}`
  return token
}

const generateTokenWithoutExp = (): string => {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' })
  ).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ sub: 'test' })).toString(
    'base64url'
  )
  const signature = '4-iaDojEVl0pJQMjrbM1EzUIfAZgsbK_kgnVyVxFSVo'
  return `${header}.${payload}.${signature}`
}
