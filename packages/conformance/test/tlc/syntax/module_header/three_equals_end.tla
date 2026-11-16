(*---
description: Three equals signs do not end a module.
ref: "tla2sany/parser/TLAplusParser.java#EndModule"
features: [module_header]
outcome: parse-error
---*)
---- MODULE three_equals_end ----
ASSUME TRUE
===

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "<EOF>" at line 9, column 4 and token "=" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file three_equals_end
    | In module three_equals_end
    | Could not parse module three_equals_end from file three_equals_end.tla
    | *** Errors: 1
    | In module three_equals_end
    | Could not parse module three_equals_end from file three_equals_end.tla
    3002:1 Parsing or semantic analysis failed.
---*)
