import { ServerType } from '../types'
import { readFile } from '../file'
import path from 'path'

export const callWeboutMacro = (macro: string) =>
  `%macro webout(action,ds,dslabel=,fmt=,missing=NULL,showmeta=NO,maxobs=MAX);
  %${macro}(&action,ds=&ds,dslabel=&dslabel,fmt=&fmt
    ,missing=&missing
    ,showmeta=&showmeta
    ,maxobs=&maxobs
  ) %mend;
`
export const preCodeEnd = `/* provide additional debug info */
%global _program;
%put &=syscc;
%put user=%mf_getuser();
%put pgm=&_program;
%put timestamp=%sysfunc(datetime(),datetime19.);\n`

export const preCodeViya = `/* if calling viya service with _job param, _program will conflict */
/* so we provide instead as __program */
%global __program _program;
%let _program=%sysfunc(coalescec(&__program,&_program));
`

export async function getPreCode(
  serverType: ServerType,
  macroCorePath: string
) {
  const mf_getuser = await readFile(
    path.join(macroCorePath, 'base', 'mf_getuser.sas')
  )
  const mp_jsonout = await readFile(
    path.join(macroCorePath, 'base', 'mp_jsonout.sas')
  )

  let content = mf_getuser + mp_jsonout

  switch (serverType) {
    case ServerType.SasViya:
      content += await readFile(
        path.join(macroCorePath, 'viya', 'mv_webout.sas')
      )
      content += preCodeViya + callWeboutMacro('mv_webout')

      break

    case ServerType.Sas9:
      content += await readFile(
        path.join(macroCorePath, 'meta', 'mm_webout.sas')
      )
      content += callWeboutMacro('mm_webout')

      break

    case ServerType.Sasjs:
      content += await readFile(
        path.join(macroCorePath, 'server', 'ms_webout.sas')
      )
      content += callWeboutMacro('ms_webout')

      break
  }

  content += preCodeEnd

  return content
}
