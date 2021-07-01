import { isAccessTokenExpiring, isRefreshTokenExpiring } from './auth'

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
})

const generateToken = (timeToLiveSeconds: number): string => {
  const exp =
    new Date(new Date().getTime() + timeToLiveSeconds * 1000).getTime() / 1000
  const header = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9'
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64')
  const signature = '4-iaDojEVl0pJQMjrbM1EzUIfAZgsbK_kgnVyVxFSVo'
  const token = `${header}.${payload}.${signature}`
  return token
}
