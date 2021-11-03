import * as https from 'https'

export interface HttpsAgentOptions extends https.AgentOptions {
  caPath?: string
  keyPath?: string
  certPath?: string
  allowInsecureRequests: boolean
}
