(*---
description: EXTENDS needs at least one name.
ref: "tla2sany/parser/TLAplusParser.java#Extends"
features: [module_header]
outcome: parse-error
---*)
---- MODULE extends_no_names ----
EXTENDS
ASSUME TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "TRUE" at line 9, column 8 and token "ASSUME" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file extends_no_names
    | In module extends_no_names
    | Could not parse module extends_no_names from file extends_no_names.tla
    | *** Errors: 1
    | In module extends_no_names
    | Could not parse module extends_no_names from file extends_no_names.tla
    3002:1 Parsing or semantic analysis failed.
---*)
