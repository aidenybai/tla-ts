(*---
description: "Three opening dashes do not start a module, so the rest of the file is prelude and the file ends without a module."
ref: "tla2sany/parser/TLAplusParser.java#BeginModule"
features: [module_header]
outcome: parse-error
---*)
--- MODULE three_dashes_open ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "---- MODULE (beginning of module)"
    | Encountered "<EOF>" at line 9, column 5 and token "" 
    | Residual stack trace follows:
    | Begin module starting at line 9, column 5.
    | Module definition starting at line 9, column 5.
    | Fatal errors while parsing TLA+ spec in file three_dashes_open
    | In module three_dashes_open
    | Could not parse module three_dashes_open from file three_dashes_open.tla
    | *** Errors: 1
    | In module three_dashes_open
    | Could not parse module three_dashes_open from file three_dashes_open.tla
    3002:1 Parsing or semantic analysis failed.
---*)
