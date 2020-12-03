export interface SasAuthResponse {
  access_token: string
  refresh_token: string
  id_token: string
  token_type: 'bearer'
  expires_in: number
  scope: string
  jti: string
}
