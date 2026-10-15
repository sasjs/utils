import * as barrel from './index'

/**
 * The helpers './fs' provides. They hash files and folders on disk, so they are
 * Node-only, and the barrel must not carry them: re-exporting './fs' put the
 * crypto chain - crypto-browserify, browserify-sign, parse-asn1, asn1.js,
 * vm-browserify - into every browser bundle that imported anything from the
 * barrel. See sasjs/utils#275.
 */
const NODE_ONLY_FS_HELPERS = [
  'getHash',
  'compareHashes',
  'extractHashArray',
  'generateCompileProgram',
  'generateProgramToGetRemoteHash',
  'generateProgramToSyncHashDiff',
  'findResourcesNotPresentLocally'
]

describe('the barrel', () => {
  it('does not re-export the node-only fs helpers', () => {
    for (const name of NODE_ONLY_FS_HELPERS) {
      expect(barrel).not.toHaveProperty(name)
    }
  })

  it('leaves them reachable at the fs subpath', () => {
    const fs = require('./fs')

    for (const name of NODE_ONLY_FS_HELPERS) {
      expect(typeof fs[name]).toBe('function')
    }
  })
})
