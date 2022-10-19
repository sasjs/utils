import { getExecutorPath } from '../executor'

// Add more pair options to be tested here
const serverTypePathMap: { serverType: string; executorPath: string }[] = [
  { serverType: 'SASVIYA', executorPath: '/SASJobExecution' },
  { serverType: 'SAS9', executorPath: '/SASStoredProcess/do' }
]

describe('Get executor path', () => {
  it('should return the path based on server type', () => {
    for (let entry of serverTypePathMap) {
      expect(getExecutorPath(entry.serverType)).toEqual(entry.executorPath)
    }
  })

  it('should return the path based on server type provided lowercase', () => {
    for (let entry of serverTypePathMap) {
      expect(getExecutorPath(entry.serverType)).toEqual(entry.executorPath)
    }
  })

  it('should return empty string for incorrectly provided server type', () => {
    expect(getExecutorPath('invalid')).toEqual('')
    expect(getExecutorPath('')).toEqual('')
  })
})
