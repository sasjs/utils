/**
 * Convert bytes to KB, MB, GB, TB
 * @method
 * @param {number} bytes amount of bytes
 * @param {number} [decimals = 1] amount of digits after decimal point
 * @param {number} [maxValue = 1TB] maximum value
 * @returns {string} Formatted string representing converted bytes
 */
export const bytesToSize = (
  bytes: number,
  decimals = 1,
  maxValue = 1024 * 1024 * 1024 * 1024 // 1TB
) => {
  if (bytes === 0) return '0 B'

  bytes = bytes > maxValue ? maxValue : bytes

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return (bytes / Math.pow(k, i)).toFixed(dm) + ' ' + sizes[i]
}
