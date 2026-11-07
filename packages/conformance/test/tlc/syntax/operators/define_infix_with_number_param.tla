(*---
description: Parameters of an infix definition must be identifiers.
ref: "tla2sany/parser/TLAplusParser.java#InfixLHS"
features: [operators]
outcome: parse-error
---*)
---- MODULE define_infix_with_number_param ----
1 ++ 2 == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "1" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file define_infix_with_number_param
    | In module define_infix_with_number_param
    | Could not parse module define_infix_with_number_param from file define_infix_with_number_param.tla
    | *** Errors: 1
    | In module define_infix_with_number_param
    | Could not parse module define_infix_with_number_param from file define_infix_with_number_param.tla
    3002:1 Parsing or semantic analysis failed.
---*)
