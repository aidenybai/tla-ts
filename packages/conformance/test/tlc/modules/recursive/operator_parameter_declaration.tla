(*---
description: A RECURSIVE declaration has no form for an operator parameter.
ref: "tla2sany/parser/TLAplusParser.java#Recursive"
features: [recursive]
outcome: parse-error
---*)
---- MODULE operator_parameter_declaration ----
RECURSIVE F(G(_))
F(G(_)) == G(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "( G" at line 8, column 12 and token "F" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file operator_parameter_declaration
    | In module operator_parameter_declaration
    | Could not parse module operator_parameter_declaration from file operator_parameter_declaration.tla
    | *** Errors: 1
    | In module operator_parameter_declaration
    | Could not parse module operator_parameter_declaration from file operator_parameter_declaration.tla
    3002:1 Parsing or semantic analysis failed.
---*)
