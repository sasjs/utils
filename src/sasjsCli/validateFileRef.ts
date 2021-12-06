export const validateFileRef = (fileRef: string): boolean => {
  if (!fileRef) {
    throw new Error('Missing file ref.')
  }

  if (fileRef.length > 8) {
    throw new Error(
      'File ref is too long. File refs can have a maximum of 8 characters.'
    )
  }

  if (!/^[_a-zA-Z][_a-zA-Z0-9]*/.test(fileRef)) {
    throw new Error(
      'Invalid file ref. File refs can only start with a letter or an underscore, and contain only letters, numbers and underscores.'
    )
  }

  return true
}
