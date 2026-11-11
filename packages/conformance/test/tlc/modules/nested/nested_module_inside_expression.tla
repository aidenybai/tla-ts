(*---
description: A nested module cannot begin inside an expression.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [nested]
outcome: parse-error
---*)
---- MODULE nested_module_inside_expression ----
A == 1 +
---- MODULE I ----
====
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "---- MODULE" at line 9, column 1 and token "+" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 1.
    | ExtendableExpr starting at line 8, column 6.
    | Expression starting at line 8, column 6.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file nested_module_inside_expression
    | In module nested_module_inside_expression
    | Could not parse module nested_module_inside_expression from file nested_module_inside_expression.tla
    | *** Errors: 1
    | In module nested_module_inside_expression
    | Could not parse module nested_module_inside_expression from file nested_module_inside_expression.tla
    3002:1 Parsing or semantic analysis failed.
---*)
