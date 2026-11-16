(*---
description: "A THEN at the bullet's column is flagged by the indentation check."
ref: "tla2sany/parser/TLAplusParser.java#checkIndentation"
features: [junctions]
outcome: parse-error
---*)
---- MODULE then_at_column_rejected ----
Test ==
  /\ IF TRUE
  THEN TRUE
  ELSE TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Item at line 10, col 3 to line 10, col 6 of module then_at_column_rejected is not properly indented inside conjunction or  disjunction list item at line 9, col 3 to line 11, col 11 of module then_at_column_rejected
    | Residual stack trace follows:
    | AND-OR Junction starting at line 9, column 3.
    | ExtendableExpr starting at line 9, column 3.
    | Expression starting at line 9, column 3.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file then_at_column_rejected
    | In module then_at_column_rejected
    | Could not parse module then_at_column_rejected from file then_at_column_rejected.tla
    | *** Errors: 1
    | In module then_at_column_rejected
    | Could not parse module then_at_column_rejected from file then_at_column_rejected.tla
    3002:1 Parsing or semantic analysis failed.
---*)
