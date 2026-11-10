(*---
description: "After \\/ ended a /\\ list, another /\\ at that column is an infix of the same precedence, which is a conflict."
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
outcome: parse-error
---*)
---- MODULE same_column_mix_precedence_conflict ----
Test ==
  /\ TRUE
  \/ FALSE
  /\ FALSE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \lor in block line 10, col 3 to line 10, col 4 of module same_column_mix_precedence_conflict and \land.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 10, column 6.
    | ExtendableExpr starting at line 9, column 3.
    | Expression starting at line 9, column 3.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file same_column_mix_precedence_conflict
    | In module same_column_mix_precedence_conflict
    | Could not parse module same_column_mix_precedence_conflict from file same_column_mix_precedence_conflict.tla
    | *** Errors: 1
    | In module same_column_mix_precedence_conflict
    | Could not parse module same_column_mix_precedence_conflict from file same_column_mix_precedence_conflict.tla
    3002:1 Parsing or semantic analysis failed.
---*)
