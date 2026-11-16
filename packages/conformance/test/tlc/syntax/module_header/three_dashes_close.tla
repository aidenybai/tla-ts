(*---
description: Three closing dashes do not make a separator.
ref: "tla2sany/parser/TLAplusParser.java#BeginModule"
features: [module_header]
outcome: parse-error
---*)
---- MODULE three_dashes_close ---
ASSUME TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "----"
    | Encountered "--" at line 7, column 32 and token "three_dashes_close" 
    | Residual stack trace follows:
    | Begin module starting at line 7, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file three_dashes_close
    | In module three_dashes_close
    | Could not parse module three_dashes_close from file three_dashes_close.tla
    | *** Errors: 1
    | In module three_dashes_close
    | Could not parse module three_dashes_close from file three_dashes_close.tla
    3002:1 Parsing or semantic analysis failed.
---*)
