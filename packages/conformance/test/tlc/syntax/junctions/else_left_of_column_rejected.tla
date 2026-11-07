(*---
description: An ELSE left of the bullet is flagged by the indentation check.
ref: "tla2sany/parser/TLAplusParser.java#checkIndentation"
features: [junctions]
outcome: parse-error
---*)
---- MODULE else_left_of_column_rejected ----
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
    | Item at line 11, col 3 to line 11, col 6 of module else_left_of_column_rejected is not properly indented inside conjunction or  disjunction list item at line 9, col 5 to line 11, col 11 of module else_left_of_column_rejected
    | Residual stack trace follows:
    | AND-OR Junction starting at line 9, column 5.
    | ExtendableExpr starting at line 9, column 5.
    | Expression starting at line 9, column 5.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file else_left_of_column_rejected
    | In module else_left_of_column_rejected
    | Could not parse module else_left_of_column_rejected from file else_left_of_column_rejected.tla
    | *** Errors: 1
    | In module else_left_of_column_rejected
    | Could not parse module else_left_of_column_rejected from file else_left_of_column_rejected.tla
    3002:1 Parsing or semantic analysis failed.
---*)
