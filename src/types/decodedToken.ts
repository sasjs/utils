export interface DecodedToken {
  jti: string
  ext_id: string
  remote_id: string
  sub: string
  scope: string[]
  client_id: string
  cid: string
  azp: string
  grant_type: string
  user_id: string
  origin: string
  user_name: string
  email: string
  auth_time: number
  rev_sig: string
  iat: number
  exp: number
  iss: string
  zid: string
  aud: string[]
}
