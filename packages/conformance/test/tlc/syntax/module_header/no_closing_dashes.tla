(*---
description: The header needs its closing dashes.
ref: "tla2sany/parser/TLAplusParser.java#BeginModule"
features: [module_header]
outcome: parse-error
---*)
---- MODULE no_closing_dashes
ASSUME TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "----"
    | Encountered "ASSUME" at line 8, column 1 and token "no_closing_dashes" 
    | Residual stack trace follows:
    | Begin module starting at line 7, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file no_closing_dashes
    | In module no_closing_dashes
    | Could not parse module no_closing_dashes from file no_closing_dashes.tla
    | *** Errors: 1
    | In module no_closing_dashes
    | Could not parse module no_closing_dashes from file no_closing_dashes.tla
    3002:1 Parsing or semantic analysis failed.
---*)
