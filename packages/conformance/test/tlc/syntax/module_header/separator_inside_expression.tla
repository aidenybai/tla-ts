(*---
description: A separator cannot sit inside an expression.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [module_header]
outcome: parse-error
---*)
---- MODULE separator_inside_expression ----
A == 1 +
----
2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "----" at line 9, column 1 and token "+" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 1.
    | ExtendableExpr starting at line 8, column 6.
    | Expression starting at line 8, column 6.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file separator_inside_expression
    | In module separator_inside_expression
    | Could not parse module separator_inside_expression from file separator_inside_expression.tla
    | *** Errors: 1
    | In module separator_inside_expression
    | Could not parse module separator_inside_expression from file separator_inside_expression.tla
    3002:1 Parsing or semantic analysis failed.
---*)
