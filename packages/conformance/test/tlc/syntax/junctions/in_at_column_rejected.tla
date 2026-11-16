(*---
description: "The IN of a LET at the bullet's column is flagged by the indentation check."
ref: "tla2sany/parser/TLAplusParser.java#checkIndentation"
features: [junctions]
outcome: parse-error
---*)
---- MODULE in_at_column_rejected ----
Test ==
  /\ LET x == 1
  IN x = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Item at line 10, col 3 to line 10, col 4 of module in_at_column_rejected is not properly indented inside conjunction or  disjunction list item at line 9, col 3 to line 10, col 10 of module in_at_column_rejected
    | Residual stack trace follows:
    | AND-OR Junction starting at line 9, column 3.
    | ExtendableExpr starting at line 9, column 3.
    | Expression starting at line 9, column 3.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file in_at_column_rejected
    | In module in_at_column_rejected
    | Could not parse module in_at_column_rejected from file in_at_column_rejected.tla
    | *** Errors: 1
    | In module in_at_column_rejected
    | Could not parse module in_at_column_rejected from file in_at_column_rejected.tla
    3002:1 Parsing or semantic analysis failed.
---*)
