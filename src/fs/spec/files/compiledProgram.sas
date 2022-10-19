%global fsTarget;
%let compiled_fsTarget=%sysfunc(pathname(work));
%let fsTarget=%sysfunc(coalescec(&fsTarget,&compiled_fsTarget));
options nobomfile;

/* mf_mkdir macro begins */
/**
  @file
  @brief Creates a directory, including any intermediate directories
  @details Works on windows and unix environments via dcreate function.
Usage:

    %mf_mkdir(/some/path/name)


  @param dir relative or absolute pathname.  Unquoted.
  @version 9.2

**/

%macro mf_mkdir(dir
)/*/STORE SOURCE*/;

  %local lastchar child parent;

  %let lastchar = %substr(&dir, %length(&dir));
  %if (%bquote(&lastchar) eq %str(:)) %then %do;
    /* Cannot create drive mappings */
    %return;
  %end;

  %if (%bquote(&lastchar)=%str(/)) or (%bquote(&lastchar)=%str(\)) %then %do;
    /* last char is a slash */
    %if (%length(&dir) eq 1) %then %do;
      /* one single slash - root location is assumed to exist */
      %return;
    %end;
    %else %do;
      /* strip last slash */
      %let dir = %substr(&dir, 1, %length(&dir)-1);
    %end;
  %end;

  %if (%sysfunc(fileexist(%bquote(&dir))) = 0) %then %do;
    /* directory does not exist so prepare to create */
    /* first get the childmost directory */
    %let child = %scan(&dir, -1, %str(/\:));

    /*
      If child name = path name then there are no parents to create. Else
      they must be recursively scanned.
    */

    %if (%length(&dir) gt %length(&child)) %then %do;
      %let parent = %substr(&dir, 1, %length(&dir)-%length(&child));
      %mf_mkdir(&parent)
    %end;

    /*
      Now create the directory.  Complain loudly of any errs.
    */

    %let dname = %sysfunc(dcreate(&child, &parent));
    %if (%bquote(&dname) eq ) %then %do;
      %put %str(ERR)OR: could not create &parent + &child;
      %abort cancel;
    %end;
    %else %do;
      %put Directory created:  &dir;
    %end;
  %end;
  /* exit quietly if directory did exist.*/
%mend mf_mkdir;

/* mf_mkdir macro ends */

%mf_mkdir(&fsTarget)


%mf_mkdir(&fsTarget/subFolder)

filename _in64 temp lrecl=99999999;
data _null_;
file _in64;
 put 'dGhpcyBpcyBkdW1teSBmaWxlIGNvbnRlbnQ=';

run;

filename _out64 "&fsTarget/subFolder/file.txt";

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

