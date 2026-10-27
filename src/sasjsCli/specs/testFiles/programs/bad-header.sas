/**
  @file bad-header.sas
  @brief A program whose header carries a block comment

      data _null_;
        /* this comment closes the header */
        set work.status;
      run;

**/

%put hello;
