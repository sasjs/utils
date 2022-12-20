import path from 'path'
import {
  getInitialCode,
  getCompiledMacrosCode,
  generateCodeForFileCreation
} from './internal/helper'
import { HashedFolder } from '../types'
import { generatePathForSas } from '../utils'

// we need to inject this line to generated sas program
// ls means line size and ps means page size
// bigger page = less chance of hitting the page number
const OPTIONS = 'options ls=max ps=max;'

export const generateProgramToGetRemoteHash = async (remotePath: string) => {
  const compiledMacrosCode = await getCompiledMacrosCode([
    'mp_hashdirectory.sas',
    'mp_jsonout.sas',
    'mp_dirlist.sas',
    'mf_existds.sas',
    'mf_getvarlist.sas',
    'mf_wordsinstr1butnotstr2.sas',
    'mp_dropmembers.sas',
    'mf_isblank.sas'
  ])

  const codeForHashCreation = getCodeForHashCreation()

  const code = OPTIONS + compiledMacrosCode + codeForHashCreation

  return setTargetAtStart(code, remotePath)
}

export const generateProgramToSyncHashDiff = async (
  hashedFolder: HashedFolder,
  remotePath: string
) => {
  const compiledMacrosCode = await getCompiledMacrosCode([
    'mp_hashdirectory.sas',
    'mp_jsonout.sas',
    'mf_mkdir.sas',
    'mp_dirlist.sas',
    'mf_existds.sas',
    'mf_getvarlist.sas',
    'mf_wordsinstr1butnotstr2.sas',
    'mp_dropmembers.sas',
    'mf_isblank.sas'
  ])

  const initialProgramContent = getInitialCode()

  const pathRelativeTo = hashedFolder.absolutePath.endsWith(path.sep)
    ? hashedFolder.absolutePath.slice(0, -1)
    : hashedFolder.absolutePath

  const folderCreationCode = await generateCodeForFolderCreation(
    hashedFolder,
    pathRelativeTo
  )

  const codeForHashCreation = getCodeForHashCreation()

  const code =
    OPTIONS +
    compiledMacrosCode +
    initialProgramContent +
    folderCreationCode +
    codeForHashCreation

  return setTargetAtStart(code, remotePath)
}

export const findResourcesNotPresentLocally = (
  localHash: HashedFolder,
  remoteHashMap: { [key: string]: string }
) => {
  const localHashedArray = convertHashFolderTreeToArray(localHash)
  const remoteHashedArray = Object.keys(remoteHashMap)

  return remoteHashedArray.filter((item) => !localHashedArray.includes(item))
}

const generateCodeForFolderCreation = async (
  hashedFolder: HashedFolder,
  pathRelativeTo: string,
  resultCode: string = ''
) => {
  for (const member of hashedFolder.members) {
    if (member.isFile) {
      resultCode += await generateCodeForFileCreation(
        member.absolutePath,
        pathRelativeTo
      )
    } else {
      resultCode += `%mf_mkdir(&fsTarget${generatePathForSas(
        member.absolutePath.replace(pathRelativeTo, '')
      )})\n`
      resultCode = await generateCodeForFolderCreation(
        member as HashedFolder,
        pathRelativeTo,
        resultCode
      )
    }
  }

  return resultCode
}

const getCodeForHashCreation = () => {
  return `/* Get Hashes */
%mp_hashdirectory(&fsTarget,maxDepth=MAX,outds=work.hashes)

/* Prepare Response JSON */
filename tmp temp;
%mp_jsonout(OPEN,jref=tmp)
%mp_jsonout(OBJ,hashes,fmt=N,jref=tmp)
%mp_jsonout(CLOSE,jref=tmp)

/* Print to Log */
data _null_;
  retain eof;
  infile tmp end=eof lrecl=10000;
  if _n_=1 then putlog '>>weboutBEGIN<<';
  input;
  putlog _infile_;
  if eof then putlog '>>weboutEND<<';
run;
`
}

const setTargetAtStart = (code: string, targetPath: string) => {
  return `%let fsTarget=${generatePathForSas(targetPath)};\n${code}`
}

/**
 * convert hash folder tree to an array of relative paths,
 * the returned array will be used to check the resources that are present on remote but not local
 */

const convertHashFolderTreeToArray = (
  hashedFolder: HashedFolder,
  array: string[] = []
) => {
  if (hashedFolder.isFile) return [...array, hashedFolder.relativePath]

  for (const member of hashedFolder.members) {
    array = convertHashFolderTreeToArray(member as HashedFolder, array)
  }

  array.push(hashedFolder.relativePath)

  return array
}
