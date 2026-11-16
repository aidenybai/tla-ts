(*---
description: "An = at the bullet's column ends the list, so the list item must be Boolean and evaluation fails on the integer."
ref: "tla2sany/parser/JunctionListContext.java#isAboveCurrent"
features: [junctions]
outcome: evaluation-failure
---*)
---- MODULE equals_at_column_ends_list ----
ASSUME
  /\ 1
  = 2
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 9, col 3 to line 10, col 5 of module equals_at_column_ends_list failed.
    A non-boolean expression (an integer) was used as a formula in a conjunction.
    1
---*)
