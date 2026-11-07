(*---
description: "Inside parens within an item, a token left of the bullet is still flagged."
ref: "tla2sany/parser/TLAplusParser.java#checkIndentation"
features: [junctions]
outcome: parse-error
---*)
---- MODULE parens_do_not_excuse_outer_column ----
Test ==
    /\ (TRUE
  )
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Item at line 10, col 3 to line 10, col 3 of module parens_do_not_excuse_outer_column is not properly indented inside conjunction or  disjunction list item at line 9, col 5 to line 10, col 3 of module parens_do_not_excuse_outer_column
    | Residual stack trace follows:
    | AND-OR Junction starting at line 9, column 5.
    | ExtendableExpr starting at line 9, column 5.
    | Expression starting at line 9, column 5.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file parens_do_not_excuse_outer_column
    | In module parens_do_not_excuse_outer_column
    | Could not parse module parens_do_not_excuse_outer_column from file parens_do_not_excuse_outer_column.tla
    | *** Errors: 1
    | In module parens_do_not_excuse_outer_column
    | Could not parse module parens_do_not_excuse_outer_column from file parens_do_not_excuse_outer_column.tla
    3002:1 Parsing or semantic analysis failed.
---*)
