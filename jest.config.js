module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  resetMocks: true,
  restoreMocks: true,
  setupFilesAfterEnv: ['jest-extended/all'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  // json-summary is what .github/scripts/coverage-ratchet.mjs compares against
  // the published baseline; the rest are for a human reading a local run.
  coverageReporters: ['clover', 'json', 'json-summary', 'lcov', 'text'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10
    }
  },
  collectCoverageFrom: ['src/**/{!(index),}.ts']
}
