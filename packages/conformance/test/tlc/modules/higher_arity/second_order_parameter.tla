(*---
description: An operator parameter may not itself take an operator.
ref: "tla2sany/parser/TLAplusParser.java#IdentDecl"
features: [higher_arity]
outcome: parse-error
---*)
---- MODULE second_order_parameter ----
Op(F(G(_))) == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "_"
    | Encountered "G" at line 8, column 6 and token "(" 
    | Residual stack trace follows:
    | Identifier Declation starting at line 8, column 4.
    | Identifier LHS starting at line 8, column 1.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file second_order_parameter
    | In module second_order_parameter
    | Could not parse module second_order_parameter from file second_order_parameter.tla
    | *** Errors: 1
    | In module second_order_parameter
    | Could not parse module second_order_parameter from file second_order_parameter.tla
    3002:1 Parsing or semantic analysis failed.
---*)
