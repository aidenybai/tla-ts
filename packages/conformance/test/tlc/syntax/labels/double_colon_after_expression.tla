(*---
description: "`::` must follow a label, not an expression."
ref: "tla2sany/parser/TLAplusParser.java#isLabel"
features: [labels]
outcome: parse-error
---*)
---- MODULE double_colon_after_expression ----
EXTENDS Naturals
Op == 1 + 2 :: 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | `::' at line 9, col 13 to line 9, col 14 of module double_colon_after_expression does not follow a label.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 11.
    | ExtendableExpr starting at line 9, column 7.
    | Expression starting at line 9, column 7.
    | Definition starting at line 9, column 1.
    | Module body starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file double_colon_after_expression
    | In module double_colon_after_expression
    | Could not parse module double_colon_after_expression from file double_colon_after_expression.tla
    | *** Errors: 1
    | In module double_colon_after_expression
    | Could not parse module double_colon_after_expression from file double_colon_after_expression.tla
    3002:1 Parsing or semantic analysis failed.
---*)
