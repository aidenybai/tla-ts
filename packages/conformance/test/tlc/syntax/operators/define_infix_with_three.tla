(*---
description: An infix definition has exactly two parameters.
ref: "tla2sany/parser/TLAplusParser.java#InfixLHS"
features: [operators]
outcome: parse-error
---*)
---- MODULE define_infix_with_three ----
a ++ b ++ c == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "a" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file define_infix_with_three
    | In module define_infix_with_three
    | Could not parse module define_infix_with_three from file define_infix_with_three.tla
    | *** Errors: 1
    | In module define_infix_with_three
    | Could not parse module define_infix_with_three from file define_infix_with_three.tla
    3002:1 Parsing or semantic analysis failed.
---*)
