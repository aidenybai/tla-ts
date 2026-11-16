(*---
description: A reserved word cannot be an expression.
ref: "tla2sany/parser/TLAplusParser.java#Expression"
features: [reserved]
outcome: parse-error
---*)
---- MODULE used_as_expression ----
Test == THEN
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Expression or Instance"
    | Encountered "THEN" at line 8, column 9 and token "==" 
    | Residual stack trace follows:
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file used_as_expression
    | In module used_as_expression
    | Could not parse module used_as_expression from file used_as_expression.tla
    | *** Errors: 1
    | In module used_as_expression
    | Could not parse module used_as_expression from file used_as_expression.tla
    3002:1 Parsing or semantic analysis failed.
---*)
