%let fsTarget=/tmp/remote/path;
/**
  @file
  @brief Returns a unique hash for each file in a directory
  @details Hashes each file in each directory, and then hashes the hashes to
  create a hash for each directory also.

  This makes use of the new `hashing_file()` and `hashing` functions, available
  since 9.4m6. Interestingly, these can even be used in pure macro, eg:

      %put %sysfunc(hashing_file(md5,/path/to/file.blob,0));

  Actual usage:

      %let fpath=/some/directory;

      %mp_hashdirectory(&fpath,outds=myhash,maxdepth=2)

      data _null_;
        set work.myhash;
        put (_all_)(=);
      run;

  Whilst files are hashed in their entirety, the logic for creating a folder
  hash is as follows:

  @li Sort the files by filename (case sensitive, uppercase then lower)
  @li Take the first 100 hashes, concatenate and hash
  @li Concatenate this hash with another 100 hashes and hash again
  @li Continue until the end of the folder.  This is the folder hash
  @li If a folder contains other folders, start from the bottom of the tree -
    the folder hashes cascade upwards so you know immediately if there is a
    change in a sub/sub directory
  @li If the folder has no content (empty) then it is ignored. No hash created.
  @li If the file is empty, it is also ignored / no hash created.

  <h4> SAS Macros </h4>
  @li mp_dirlist.sas

  <h4> Related Files </h4>
  @li mp_hashdataset.sas
  @li mp_hashdirectory.test.sas
  @li mp_md5.sas

  @param [in] inloc Full filepath of the file to be hashed (unquoted)
  @param [in] iftrue= (1=1) A condition under which the macro should be executed
  @param [in] maxdepth= (0) Set to a positive integer to indicate the level of
    subdirectory scan recursion - eg 3, to go `./3/levels/deep`.  For unlimited
    recursion, set to MAX.
  @param [in] method= (MD5) the hashing method to use.  Available options:
    @li MD5
    @li SH1
    @li SHA256
    @li SHA384
    @li SHA512
    @li CRC32
  @param [out] outds= (work.mp_hashdirectory) The output dataset.  Contains:
    @li directory - the parent folder
    @li file_hash - the hash output
    @li hash_duration - how long the hash took (first hash always takes longer)
    @li file_path - /full/path/to/each/file.ext
    @li file_or_folder - contains either "file" or "folder"
    @li level - the depth of the directory (top level is 0)

  @version 9.4m6
  @author Allan Bowe
**/

%macro mp_hashdirectory(inloc,
  outds=work.mp_hashdirectory,
  method=MD5,
  maxdepth=0,
  iftrue=%str(1=1)
)/*/STORE SOURCE*/;

%local curlevel tempds ;

%if not(%eval(%unquote(&iftrue))) %then %return;

/* get the directory listing */
%mp_dirlist(path=&inloc, outds=&outds, maxdepth=&maxdepth, showparent=YES)

/* create the hashes */
data &outds;
  set &outds (rename=(filepath=file_path));
  length FILE_HASH $32 HASH_DURATION 8;
  keep directory file_hash hash_duration file_path file_or_folder level;

  ts=datetime();
  if file_or_folder='file' then do;
    /* if file is empty, hashing_file will break - so ignore / delete */
    length fname val $8;
    drop fname val fid is_empty;
    rc=filename(fname,file_path);
    fid=fopen(fname);
    if fid > 0 then do;
      rc=fread(fid);
      is_empty=fget(fid,val);
    end;
    rc=fclose(fid);
    rc=filename(fname);
    if is_empty ne 0 then delete;
    else file_hash=hashing_file("&method",cats(file_path),0);
  end;
  hash_duration=datetime()-ts;
run;

proc sort data=&outds ;
  by descending level directory file_path;
run;

data _null_;
  set &outds;
  call symputx('maxlevel',level,'l');
  stop;
run;

/* now hash the hashes to populate folder hashes, starting from the bottom */
%do curlevel=&maxlevel %to 0 %by -1;
  data work._data_ (keep=directory file_hash);
    set &outds;
    where level=&curlevel;
    by descending level directory file_path;
    length str $32767 tmp_hash $32;
    retain str tmp_hash ;
    /* reset vars when starting a new directory */
    if first.directory then do;
      str='';
      tmp_hash='';
      i=0;
    end;
    /* hash each chunk of 100 file paths */
    i+1;
    str=cats(str,file_hash);
    if mod(i,100)=0 or last.directory then do;
      tmp_hash=hashing("&method",cats(tmp_hash,str));
      str='';
    end;
    /* output the hash at directory level */
    if last.directory then do;
      file_hash=tmp_hash;
      output;
    end;
    if last.level then stop;
  run;
  %let tempds=&syslast;
  /* join the hash back into the main table */
  proc sql undo_policy=none;
  create table &outds as
    select a.directory
      ,coalesce(b.file_hash,a.file_hash) as file_hash
      ,a.hash_duration
      ,a.file_path
      ,a.file_or_folder
      ,a.level
    from &outds a
    left join &tempds b
    on a.file_path=b.directory
    order by level desc, directory, file_path;
  drop table &tempds;
%end;

%mend mp_hashdirectory;

/**
  @file mp_jsonout.sas
  @brief Writes JSON in SASjs format to a fileref
  @details This macro can be used to OPEN a JSON stream and send one or more
  tables as arrays of rows, where each row can be an object or a nested array.

  There are two engines available - DATASTEP or PROCJSON.

  PROC JSON is fast but will produce errs like the ones below if
  special chars are encountered.

  > (ERR)OR: Some code points did not transcode.

  > An object or array close is not valid at this point in the JSON text.

  > Date value out of range

  If this happens, try running with ENGINE=DATASTEP.

  The DATASTEP engine is used to handle special SAS missing numerics, and
  can also convert entire datasets to formatted values.  Output JSON is always
  in UTF-8.

  Usage:

        filename tmp temp;
        data class; set sashelp.class;run;

        %mp_jsonout(OPEN,jref=tmp)
        %mp_jsonout(OBJ,class,jref=tmp)
        %mp_jsonout(OBJ,class,dslabel=class2,jref=tmp,showmeta=Y)
        %mp_jsonout(CLOSE,jref=tmp)

        data _null_;
        infile tmp;
        input;putlog _infile_;
        run;

  If you are building web apps with SAS then you are strongly encouraged to use
  the mX_createwebservice macros in combination with the
  [sasjs adapter](https://github.com/sasjs/adapter).
  For more information see https://sasjs.io

  @param [in] action Valid values:
    @li OPEN - opens the JSON
    @li OBJ - sends a table with each row as an object
    @li ARR - sends a table with each row in an array
    @li CLOSE - closes the JSON
  @param [in] ds The dataset to send.  Must be a work table.
  @param [out] jref= (_webout) The fileref to which to send the JSON
  @param [out] dslabel= The name to give the table in the exported JSON
  @param [in] fmt= (Y) Whether to keep (Y) or strip (N) formats from the table
  @param [in] engine= (DATASTEP) Which engine to use to send the JSON. Options:
    @li PROCJSON (default)
    @li DATASTEP (more reliable when data has non standard characters)
  @param [in] missing= (NULL) Special numeric missing values can be sent as NULL
    (eg `null`) or as STRING values (eg `".a"` or `".b"`)
  @param [in] showmeta= (N) Set to Y to output metadata alongside each table,
    such as the column formats and types.  The metadata is contained inside an
    object with the same name as the table but prefixed with a dollar sign - ie,
    `,"$tablename":{"formats":{"col1":"$CHAR1"},"types":{"COL1":"C"}}`
  @param [in] maxobs= (MAX) Provide an integer to limit the number of input rows
    that should be converted to JSON

  <h4> Related Files </h4>
  @li mp_ds2fmtds.sas

  @version 9.2
  @author Allan Bowe
  @source https://github.com/sasjs/core

**/
%macro mp_jsonout(action,ds,jref=_webout,dslabel=,fmt=Y
  ,engine=DATASTEP
  ,missing=NULL
  ,showmeta=N
  ,maxobs=MAX
)/*/STORE SOURCE*/;
%local tempds colinfo fmtds i numcols numobs stmt_obs lastobs optval
  tmpds1 tmpds2 tmpds3 tmpds4;
%let numcols=0;
%if &maxobs ne MAX %then %let stmt_obs=%str(if _n_>&maxobs then stop;);

%if &action=OPEN %then %do;
  options nobomfile;
  data _null_;file &jref encoding='utf-8' lrecl=200;
    put '{"PROCESSED_DTTM" : "' "%sysfunc(datetime(),E8601DT26.6)" '"';
  run;
%end;
%else %if (&action=ARR or &action=OBJ) %then %do;
  /* force variable names to always be uppercase in the JSON */
  options validvarname=upcase;
  /* To avoid issues with _webout on EBI - such as encoding diffs and truncation
    (https://support.sas.com/kb/49/325.html) we use temporary files */
  filename _sjs1 temp lrecl=200 ;
  data _null_; file _sjs1 encoding='utf-8';
    put ", ""%lowcase(%sysfunc(coalescec(&dslabel,&ds)))"":";
  run;
  /* now write to _webout 1 char at a time */
  data _null_;
    infile _sjs1 lrecl=1 recfm=n;
    file &jref mod lrecl=1 recfm=n;
    input sourcechar $char1. @@;
    format sourcechar hex2.;
    put sourcechar char1. @@;
  run;
  filename _sjs1 clear;

  /* grab col defs */
  proc contents noprint data=&ds
    out=_data_(keep=name type length format formatl formatd varnum label);
  run;
  %let colinfo=%scan(&syslast,2,.);
  proc sort data=&colinfo;
    by varnum;
  run;
  /* move meta to mac vars */
  data &colinfo;
    if _n_=1 then call symputx('numcols',nobs,'l');
    set &colinfo end=last nobs=nobs;
    name=upcase(name);
    /* fix formats */
    if type=2 or type=6 then do;
      typelong='char';
      length fmt $49.;
      if format='' then fmt=cats('$',length,'.');
      else if formatl=0 then fmt=cats(format,'.');
      else fmt=cats(format,formatl,'.');
    end;
    else do;
      typelong='num';
      if format='' then fmt='best.';
      else if formatl=0 then fmt=cats(format,'.');
      else if formatd=0 then fmt=cats(format,formatl,'.');
      else fmt=cats(format,formatl,'.',formatd);
    end;
    /* 32 char unique name */
    newname='sasjs'!!substr(cats(put(md5(name),$hex32.)),1,27);

    call symputx(cats('name',_n_),name,'l');
    call symputx(cats('newname',_n_),newname,'l');
    call symputx(cats('length',_n_),length,'l');
    call symputx(cats('fmt',_n_),fmt,'l');
    call symputx(cats('type',_n_),type,'l');
    call symputx(cats('typelong',_n_),typelong,'l');
    call symputx(cats('label',_n_),coalescec(label,name),'l');
    /* overwritten when fmt=Y and a custom format exists in catalog */
    if typelong='num' then call symputx(cats('fmtlen',_n_),200,'l');
    else call symputx(cats('fmtlen',_n_),min(32767,ceil((length+10)*1.5)),'l');
  run;

  %let tempds=%substr(_%sysfunc(compress(%sysfunc(uuidgen()),-)),1,32);
  proc sql;
  select count(*) into: lastobs from &ds;
  %if &maxobs ne MAX %then %let lastobs=%sysfunc(min(&lastobs,&maxobs));

  %if &engine=PROCJSON %then %do;
    %if &missing=STRING %then %do;
      %put &sysmacroname: Special Missings not supported in proc json.;
      %put &sysmacroname: Switching to DATASTEP engine;
      %goto datastep;
    %end;
    data &tempds;
      set &ds;
      &stmt_obs;
    %if &fmt=N %then format _numeric_ best32.;;
    /* PRETTY is necessary to avoid line truncation in large files */
    filename _sjs2 temp lrecl=131068 encoding='utf-8';
    proc json out=_sjs2 pretty
        %if &action=ARR %then nokeys ;
        ;export &tempds / nosastags fmtnumeric;
    run;
    /* send back to webout */
    data _null_;
      infile _sjs2 lrecl=1 recfm=n;
      file &jref mod lrecl=1 recfm=n;
      input sourcechar $char1. @@;
      format sourcechar hex2.;
      put sourcechar char1. @@;
    run;
    filename _sjs2 clear;
  %end;
  %else %if &engine=DATASTEP %then %do;
    %datastep:
    %if %sysfunc(exist(&ds)) ne 1 & %sysfunc(exist(&ds,VIEW)) ne 1
    %then %do;
      %put &sysmacroname:  &ds NOT FOUND!!!;
      %return;
    %end;

    %if &fmt=Y %then %do;
      /**
        * Extract format definitions
        * First, by getting library locations from dictionary.formats
        * Then, by exporting the width using proc format
        * Cannot use maxw from sashelp.vformat as not always populated
        * Cannot use fmtinfo() as not supported in all flavours
        */
      %let tmpds1=%substr(fmtsum%sysfunc(compress(%sysfunc(uuidgen()),-)),1,32);
      %let tmpds2=%substr(cntl%sysfunc(compress(%sysfunc(uuidgen()),-)),1,32);
      %let tmpds3=%substr(cntl%sysfunc(compress(%sysfunc(uuidgen()),-)),1,32);
      %let tmpds4=%substr(col%sysfunc(compress(%sysfunc(uuidgen()),-)),1,32);
      proc sql noprint;
      create table &tmpds1 as
          select cats(libname,'.',memname) as FMTCAT,
          FMTNAME
        from dictionary.formats
        where fmttype='F' and libname is not null
          and fmtname in (select format from &colinfo where format is not null)
        order by 1;
      create table &tmpds2(
          FMTNAME char(32),
          LENGTH num
      );
      %local catlist cat fmtlist i;
      select distinct fmtcat into: catlist separated by ' ' from &tmpds1;
      %do i=1 %to %sysfunc(countw(&catlist,%str( )));
        %let cat=%scan(&catlist,&i,%str( ));
        proc sql;
        select distinct fmtname into: fmtlist separated by ' '
          from &tmpds1 where fmtcat="&cat";
        proc format lib=&cat cntlout=&tmpds3(keep=fmtname length);
          select &fmtlist;
        run;
        proc sql;
        insert into &tmpds2 select distinct fmtname,length from &tmpds3;
      %end;

      proc sql;
      create table &tmpds4 as
        select a.*, b.length as MAXW
        from &colinfo a
        left join &tmpds2 b
        on cats(a.format)=cats(upcase(b.fmtname))
        order by a.varnum;
      data _null_;
        set &tmpds4;
        if not missing(maxw);
        call symputx(
          cats('fmtlen',_n_),
          /* vars need extra padding due to JSON escaping of special chars */
          min(32767,ceil((max(length,maxw)+10)*1.5))
          ,'l'
        );
      run;

      /* configure varlenchk - as we are explicitly shortening the variables */
      %let optval=%sysfunc(getoption(varlenchk));
      options varlenchk=NOWARN;
      data _data_(compress=char);
        /* shorten the new vars */
        length
      %do i=1 %to &numcols;
          &&name&i $&&fmtlen&i
      %end;
          ;
        /* rename on entry */
        set &ds(rename=(
      %do i=1 %to &numcols;
          &&name&i=&&newname&i
      %end;
        ));
      &stmt_obs;

      drop
      %do i=1 %to &numcols;
        &&newname&i
      %end;
        ;
      %do i=1 %to &numcols;
        %if &&typelong&i=num %then %do;
          &&name&i=cats(put(&&newname&i,&&fmt&i));
        %end;
        %else %do;
          &&name&i=put(&&newname&i,&&fmt&i);
        %end;
      %end;
        if _error_ then do;
          call symputx('syscc',1012);
          stop;
        end;
      run;
      %let fmtds=&syslast;
      options varlenchk=&optval;
    %end;

    proc format; /* credit yabwon for special null removal */
    value bart (default=40)
    %if &missing=NULL %then %do;
      ._ - .z = null
    %end;
    %else %do;
      ._ = [quote()]
      . = null
      .a - .z = [quote()]
    %end;
      other = [best.];

    data &tempds;
      attrib _all_ label='';
      %do i=1 %to &numcols;
        %if &&typelong&i=char or &fmt=Y %then %do;
          length &&name&i $&&fmtlen&i...;
          format &&name&i $&&fmtlen&i...;
        %end;
      %end;
      %if &fmt=Y %then %do;
        set &fmtds;
      %end;
      %else %do;
        set &ds;
      %end;
      &stmt_obs;
      format _numeric_ bart.;
    %do i=1 %to &numcols;
      %if &&typelong&i=char or &fmt=Y %then %do;
        if findc(&&name&i,'"\'!!'0A0D09000E0F010210111A'x) then do;
          &&name&i='"'!!trim(
            prxchange('s/"/\\"/',-1,        /* double quote */
            prxchange('s/\x0A/\n/',-1,      /* new line */
            prxchange('s/\x0D/\r/',-1,      /* carriage return */
            prxchange('s/\x09/\\t/',-1,     /* tab */
            prxchange('s/\x00/\\u0000/',-1, /* NUL */
            prxchange('s/\x0E/\\u000E/',-1, /* SS  */
            prxchange('s/\x0F/\\u000F/',-1, /* SF  */
            prxchange('s/\x01/\\u0001/',-1, /* SOH */
            prxchange('s/\x02/\\u0002/',-1, /* STX */
            prxchange('s/\x10/\\u0010/',-1, /* DLE */
            prxchange('s/\x11/\\u0011/',-1, /* DC1 */
            prxchange('s/\x1A/\\u001A/',-1, /* SUB */
            prxchange('s/\\/\\\\/',-1,&&name&i)
          )))))))))))))!!'"';
        end;
        else &&name&i=quote(cats(&&name&i));
      %end;
    %end;
    run;

    filename _sjs3 temp lrecl=131068 ;
    data _null_;
      file _sjs3 encoding='utf-8';
      if _n_=1 then put "[";
      set &tempds;
      if _n_>1 then put "," @; put
      %if &action=ARR %then "[" ; %else "{" ;
      %do i=1 %to &numcols;
        %if &i>1 %then  "," ;
        %if &action=OBJ %then """&&name&i"":" ;
        "&&name&i"n /* name literal for reserved variable names */
      %end;
      %if &action=ARR %then "]" ; %else "}" ; ;

    /* close out the table */
    data _null_;
      file _sjs3 mod encoding='utf-8';
      put ']';
    run;
    data _null_;
      infile _sjs3 lrecl=1 recfm=n;
      file &jref mod lrecl=1 recfm=n;
      input sourcechar $char1. @@;
      format sourcechar hex2.;
      put sourcechar char1. @@;
    run;
    filename _sjs3 clear;
  %end;

  proc sql;
  drop table &colinfo, &tempds;

  %if %substr(&showmeta,1,1)=Y %then %do;
    filename _sjs4 temp lrecl=131068 encoding='utf-8';
    data _null_;
      file _sjs4;
      length label $350;
      put ", ""$%lowcase(%sysfunc(coalescec(&dslabel,&ds)))"":{""vars"":{";
      do i=1 to &numcols;
        name=quote(trim(symget(cats('name',i))));
        format=quote(trim(symget(cats('fmt',i))));
        label=quote(prxchange('s/\\/\\\\/',-1,trim(symget(cats('label',i)))));
        length=quote(trim(symget(cats('length',i))));
        type=quote(trim(symget(cats('typelong',i))));
        if i>1 then put "," @@;
        put name ':{"format":' format ',"label":' label
          ',"length":' length ',"type":' type '}';
      end;
      put '}}';
    run;
    /* send back to webout */
    data _null_;
      infile _sjs4 lrecl=1 recfm=n;
      file &jref mod lrecl=1 recfm=n;
      input sourcechar $char1. @@;
      format sourcechar hex2.;
      put sourcechar char1. @@;
    run;
    filename _sjs4 clear;
  %end;
%end;

%else %if &action=CLOSE %then %do;
  data _null_; file &jref encoding='utf-8' mod ;
    put "}";
  run;
%end;
%mend mp_jsonout;

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

%global fsTarget;
%let compiled_fsTarget=%sysfunc(pathname(work));
%let fsTarget=%sysfunc(coalescec(&fsTarget,&compiled_fsTarget));
options nobomfile;

%mf_mkdir(&fsTarget)

filename _in64 temp lrecl=99999999;
data _null_;
file _in64;
 put 'VGhpcyBpcyBhIGZpbGUxLnR4dCBpbiBoYXNoRm9sZGVy';

run;

filename _out64 "&fsTarget/file1.txt";

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

filename _in64 temp lrecl=99999999;
data _null_;
file _in64;
 put 'VGhpcyBpcyBhIGZpbGUyLnR4dCBpbiBoYXNoRm9sZGVy';

run;

filename _out64 "&fsTarget/file2.txt";

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
%mf_mkdir(&fsTarget/subFolder2)

filename _in64 temp lrecl=99999999;
data _null_;
file _in64;
 put 'VGhpcyBpcyBhIGZpbGUxLnR4dCBpbiBzdWJmb2xkZXIy';

run;

filename _out64 "&fsTarget/subFolder2/file1.txt";

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

filename _in64 temp lrecl=99999999;
data _null_;
file _in64;
 put 'VGhpcyBpcyBhIGZpbGUyLnR4dCBpbiBzdWJmb2xkZXIy';

run;

filename _out64 "&fsTarget/subFolder2/file2.txt";

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
%mf_mkdir(&fsTarget/subfolder1)

filename _in64 temp lrecl=99999999;
data _null_;
file _in64;
 put 'VGhpcyBpcyBhIGZpbGUxLnR4dCBpbiBzdWJmb2xkZXIx';

run;

filename _out64 "&fsTarget/subfolder1/file1.txt";

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

filename _in64 temp lrecl=99999999;
data _null_;
file _in64;
 put 'VGhpcyBpcyBhIGZpbGUyLnR4dCBpbiBzdWJmb2xkZXIx';

run;

filename _out64 "&fsTarget/subfolder1/file2.txt";

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
/* Get Hashes */
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
