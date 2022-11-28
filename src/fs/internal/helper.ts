import path from 'path'
import { chunk, getMacrosPath, generatePathForSas } from '../../utils'
import { readFile, base64EncodeFile } from '../../file'

export const generateCodeForFileCreation = async (
  filePath: string,
  pathRelativeTo: string
) => {
  const base64EncodedFileContent = await base64EncodeFile(filePath)
  const chunkedFileContent = chunkFileContent(base64EncodedFileContent)
  return `
filename _in64 temp lrecl=99999999;
data _null_;
file _in64;
${chunkedFileContent}
run;

filename _out64 "&fsTarget${generatePathForSas(
    filePath.replace(pathRelativeTo, '')
  )}";

/* convert from base64 */
data _null_;
length filein 8 fileout 8;
filein = fopen("_in64",'I',4,'B');
fileout = fopen("_out64",'O',3,'B');
char= '20'x;
do while(fread(filein)=0);
  length raw $4 ;
  do i=1 to 4;
    rc=fget(filein,char,1);
    substr(raw,i,1)=char;
  end;
  rc = fput(fileout, input(raw,$base64X4.));
  rc =fwrite(fileout);
end;
rc = fclose(filein);
rc = fclose(fileout);
run;

filename _in64 clear;
filename _out64 clear;
`
}

export const chunkFileContent = (fileContent: string) => {
  const chunkedLines = chunk(fileContent)

  if (chunkedLines.length === 1) {
    return ` put '${chunkedLines[0].split("'").join("''")}';\n`
  }

  let combinedLines = ''

  chunkedLines.forEach((chunkedLine, index) => {
    const text = ` put '${chunkedLine.split("'").join("''")}'${
      index !== chunkedLines.length - 1 ? '@;\n' : ';\n'
    }`

    combinedLines += text
  })

  return combinedLines
}

export const getInitialCode = () => `%global fsTarget;
%let compiled_fsTarget=%sysfunc(pathname(work));
%let fsTarget=%sysfunc(coalescec(&fsTarget,&compiled_fsTarget));
options nobomfile;

%mf_mkdir(&fsTarget)
`

export const getCompiledMacrosCode = async (macros: string[]) => {
  let compiledCode = ''

  for (const macro of macros) {
    const macroPath = path.join(getMacrosPath(), macro)
    const macroContent = await readFile(macroPath)

    compiledCode += macroContent + '\n'
  }

  return compiledCode
}
