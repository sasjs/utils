import groupBy from 'lodash.groupby'
import uniqBy from 'lodash.uniqby'

export const validateProgramsList = (
  programsList: { fileName: string; fileRef: string }[]
) => {
  const areFileRefsUnique =
    uniqBy(
      programsList.map((p) => p.fileRef),
      (x) => x.toLocaleUpperCase()
    ).length === programsList.length

  if (areFileRefsUnique) {
    return true
  }

  const duplicatePrograms: { fileName: string; fileRef: string }[] = []
  programsList.forEach((program, index, list) => {
    const duplicates = list.filter(
      (p, i) =>
        i !== index &&
        p.fileRef.toLocaleUpperCase() === program.fileRef.toLocaleUpperCase() &&
        !duplicatePrograms.some(
          (d) =>
            d.fileName === p.fileName &&
            d.fileRef.toLocaleUpperCase() === p.fileRef.toLocaleUpperCase()
        )
    )
    duplicatePrograms.push(...duplicates)
  })
  const groupedDuplicates = groupBy(duplicatePrograms, (x) =>
    x.fileRef.toLocaleUpperCase()
  )
  let errorMessage = ''
  Object.keys(groupedDuplicates).forEach((fileRef) => {
    errorMessage += `The following files have duplicate fileref '${fileRef}':\n${groupedDuplicates[
      fileRef
    ]
      .map((d) => d.fileName)
      .join(', ')}\n`
  })
  throw new Error(errorMessage)
}
