(*---
description: An application cannot have an empty argument list.
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
outcome: parse-error
---*)
---- MODULE empty_argument_list ----
Op == 1
Test == Op() = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "( )" at line 9, column 11 and token "Op" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file empty_argument_list
    | In module empty_argument_list
    | Could not parse module empty_argument_list from file empty_argument_list.tla
    | *** Errors: 1
    | In module empty_argument_list
    | Could not parse module empty_argument_list from file empty_argument_list.tla
    3002:1 Parsing or semantic analysis failed.
---*)
