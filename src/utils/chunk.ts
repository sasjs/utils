export function chunk(text: string, maxLength = 220) {
  if (text.length <= maxLength) {
    return [text]
  }
  return (text.match(new RegExp('.{1,' + maxLength + '}', 'g')) || []).filter(
    (m) => !!m
  )
}
