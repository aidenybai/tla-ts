(*---
description: An operand left of the bullet is not part of the item.
ref: "tla2sany/parser/JunctionListContext.java#isAboveCurrent"
features: [junctions]
outcome: parse-error
---*)
---- MODULE continuation_left_of_column_rejected ----
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
    | ExtendableExpr starting at line 9, column 8.
    | Expression starting at line 9, column 8.
    | Junction Item starting at line 9, column 5.
    | AND-OR Junction starting at line 9, column 5.
    | ExtendableExpr starting at line 9, column 5.
    | Fatal errors while parsing TLA+ spec in file continuation_left_of_column_rejected
    | In module continuation_left_of_column_rejected
    | Could not parse module continuation_left_of_column_rejected from file continuation_left_of_column_rejected.tla
    | *** Errors: 1
    | In module continuation_left_of_column_rejected
    | Could not parse module continuation_left_of_column_rejected from file continuation_left_of_column_rejected.tla
    3002:1 Parsing or semantic analysis failed.
---*)
