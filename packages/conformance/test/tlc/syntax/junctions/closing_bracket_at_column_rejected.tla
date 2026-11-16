(*---
description: "A closing ] at the bullet's column is flagged by the indentation check."
ref: "tla2sany/parser/TLAplusParser.java#checkIndentation"
features: [junctions]
outcome: parse-error
---*)
---- MODULE closing_bracket_at_column_rejected ----
Test ==
  /\ [x \in {1} |-> x
  ][1] = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Item at line 10, col 3 to line 10, col 3 of module closing_bracket_at_column_rejected is not properly indented inside conjunction or  disjunction list item at line 9, col 3 to line 10, col 10 of module closing_bracket_at_column_rejected
    | Residual stack trace follows:
    | AND-OR Junction starting at line 9, column 3.
    | ExtendableExpr starting at line 9, column 3.
    | Expression starting at line 9, column 3.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file closing_bracket_at_column_rejected
    | In module closing_bracket_at_column_rejected
    | Could not parse module closing_bracket_at_column_rejected from file closing_bracket_at_column_rejected.tla
    | *** Errors: 1
    | In module closing_bracket_at_column_rejected
    | Could not parse module closing_bracket_at_column_rejected from file closing_bracket_at_column_rejected.tla
    3002:1 Parsing or semantic analysis failed.
---*)
