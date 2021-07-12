import jwtDecode from 'jwt-decode'

/**
 * Checks if the Access Token is expired or is expiring in 1 hour.  A default Access Token
 * lasts 12 hours. If the Access Token expires, the Refresh Token is used to fetch a new
 * Access Token. In the case that the Refresh Token is expired, 1 hour is enough to let
 * most jobs finish.
 * @param {string} token- token string that will be evaluated
 * @param {number} timeToLiveSeconds - the amount of time that the token has before it expires, defaults to 3600
 * @returns {boolean} a value indicating whether the token is about to expire
 */
export function isAccessTokenExpiring(
  token?: string,
  timeToLiveSeconds = 3600
): boolean {
  if (!token) {
    return true
  }
  return isTokenExpiring(token, timeToLiveSeconds)
}

/**
 * Checks if the Refresh Token is expired or expiring in 30 secs. A default Refresh Token
 * lasts 30 days.  Once the Refresh Token expires, the user must re-authenticate (provide
 * credentials in a browser to obtain an authorisation code). 30 seconds is enough time
 * to make a request for a final Access Token.
 * @param {string} token- token string that will be evaluated
 * @param {number} timeToLiveSeconds - the amount of time that the token has before it expires, defaults to 30
 * @returns {boolean} a value indicating whether the token is about to expire
 */
export function isRefreshTokenExpiring(
  token?: string,
  timeToLiveSeconds = 30
): boolean {
  if (!token) {
    return true
  }
  return isTokenExpiring(token, timeToLiveSeconds)
}

/**
 * Checks if the given token has expired.
 * @param {string} token- token string that will be evaluated
 * @returns {boolean} a value indicating whether the token has expired
 */
export function hasTokenExpired(token?: string): boolean {
  if (!token) {
    return true
  }
  return isTokenExpiring(token, 0)
}

function isTokenExpiring(token: string, timeToLiveSeconds: number) {
  const payload = jwtDecode<{ exp: number }>(token)
  const timeToLive = payload.exp - new Date().valueOf() / 1000

  return timeToLive <= timeToLiveSeconds
}
