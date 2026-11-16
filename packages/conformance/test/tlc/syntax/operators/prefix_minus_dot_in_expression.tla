(*---
description: "-. is not a prefix operator in an expression unless it is applied with parentheses."
ref: "tla2sany/parser/TLAplusParser.java#PrefixOp"
features: [operators]
outcome: parse-error
---*)
---- MODULE prefix_minus_dot_in_expression ----
-. a == a
Test == -. 5 = 5
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "5" at line 9, column 12 and token "-." 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file prefix_minus_dot_in_expression
    | In module prefix_minus_dot_in_expression
    | Could not parse module prefix_minus_dot_in_expression from file prefix_minus_dot_in_expression.tla
    | *** Errors: 1
    | In module prefix_minus_dot_in_expression
    | Could not parse module prefix_minus_dot_in_expression from file prefix_minus_dot_in_expression.tla
    3002:1 Parsing or semantic analysis failed.
---*)
