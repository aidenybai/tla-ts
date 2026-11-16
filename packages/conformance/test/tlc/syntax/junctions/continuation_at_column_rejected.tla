(*---
description: "An operand on the bullet's column is not part of the item, so the infix before it has no operand."
ref: "tla2sany/parser/JunctionListContext.java#isAboveCurrent"
features: [junctions]
outcome: parse-error
---*)
---- MODULE continuation_at_column_rejected ----
Test ==
  /\ 1 =
  1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 10, column 3 and token "=" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 6.
    | Expression starting at line 9, column 6.
    | Junction Item starting at line 9, column 3.
    | AND-OR Junction starting at line 9, column 3.
    | ExtendableExpr starting at line 9, column 3.
    | Fatal errors while parsing TLA+ spec in file continuation_at_column_rejected
    | In module continuation_at_column_rejected
    | Could not parse module continuation_at_column_rejected from file continuation_at_column_rejected.tla
    | *** Errors: 1
    | In module continuation_at_column_rejected
    | Could not parse module continuation_at_column_rejected from file continuation_at_column_rejected.tla
    3002:1 Parsing or semantic analysis failed.
---*)
