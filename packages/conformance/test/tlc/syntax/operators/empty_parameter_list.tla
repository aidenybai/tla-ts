(*---
description: A definition cannot have an empty parameter list.
ref: "tla2sany/parser/TLAplusParser.java#IdentLHS"
features: [operators]
outcome: parse-error
---*)
---- MODULE empty_parameter_list ----
Op() == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Identifier Declaration, prefix op, _ or )"
    | Encountered ")" at line 8, column 4 and token "(" 
    | Residual stack trace follows:
    | Identifier LHS starting at line 8, column 1.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file empty_parameter_list
    | In module empty_parameter_list
    | Could not parse module empty_parameter_list from file empty_parameter_list.tla
    | *** Errors: 1
    | In module empty_parameter_list
    | Could not parse module empty_parameter_list from file empty_parameter_list.tla
    3002:1 Parsing or semantic analysis failed.
---*)
