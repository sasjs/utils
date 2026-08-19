import jwtDecode, { InvalidTokenError } from 'jwt-decode'
import { DecodedToken } from '../types'

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
  let payload: { exp?: number }
  try {
    payload = jwtDecode<{ exp?: number }>(token)
  } catch (err) {
    // Only tolerate undecodable (opaque / non-JWT) tokens - anything else
    // is a genuine bug and should surface.
    if (!(err instanceof InvalidTokenError)) throw err
    // Opaque tokens cannot be expiry-checked client-side.
    // Assume the token is usable and let the server reject it if expired.
    // Deliberately silent - this is routine (opaque tokens are the norm for
    // SAS Logon Manager) and must never appear in CLI output.
    return false
  }

  // A JWT without an `exp` claim cannot be expiry-checked either.
  // Note: `== null` (not `!`) - exp of 0 is a real (long-expired) claim,
  // not a missing one.
  if (payload.exp == null) return false

  const timeToLive = payload.exp - new Date().valueOf() / 1000

  return timeToLive <= timeToLiveSeconds
}

export function decodeToken(token: string): DecodedToken {
  let payload: DecodedToken
  try {
    payload = jwtDecode(token)
  } catch (err) {
    throw new Error('Invalid token supplied.')
  }

  return payload
}
