export function diff(a: any[], b: any[]) {
  const notInA = a.filter(item =>
    typeof item === 'object'
      ? !JSON.stringify(b).includes(JSON.stringify(item))
      : !b.includes(item)
  )
  const notInB = b.filter(item =>
    typeof item === 'object'
      ? !JSON.stringify(a).includes(JSON.stringify(item))
      : !a.includes(item)
  )

  return [...notInA, ...notInB]
}
