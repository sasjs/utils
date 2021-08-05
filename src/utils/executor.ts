/**
 *  Function that will return correct the executor path based on the server type provided
 */

//Add more options here
const executorPathMap: ExecutorPathMap = {
    SASVIYA: '/SASJobExecution',
    SAS9: '/SASStoredProcess/do'
}

export const getExecutorPath = (serverType: string) => {
    if (!serverType) return ''

    serverType = serverType.toUpperCase()

    return executorPathMap[serverType] || ''
}

interface ExecutorPathMap {
    [key: string]: string
}