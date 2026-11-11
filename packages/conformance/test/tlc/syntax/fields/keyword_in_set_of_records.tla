(*---
description: "A set of records has no keyword allowance, even in the first field."
ref: "tla2sany/parser/TLAplusParser.java#SBracketCases"
features: [fields]
outcome: parse-error
---*)
---- MODULE keyword_in_set_of_records ----
Test == [x \in [IF : {1}] |-> 1] = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered ":" at line 8, column 20 and token "IF" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 20.
    | Expression starting at line 8, column 20.
    | IF THEN ELSE starting at line 8, column 17.
    | Expression starting at line 8, column 17.
    | Some [] Form starting at line 8, column 16.
    | Fatal errors while parsing TLA+ spec in file keyword_in_set_of_records
    | In module keyword_in_set_of_records
    | Could not parse module keyword_in_set_of_records from file keyword_in_set_of_records.tla
    | *** Errors: 1
    | In module keyword_in_set_of_records
    | Could not parse module keyword_in_set_of_records from file keyword_in_set_of_records.tla
    3002:1 Parsing or semantic analysis failed.
---*)
