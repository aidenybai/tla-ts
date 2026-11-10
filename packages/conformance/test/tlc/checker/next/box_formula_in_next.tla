(*---
description: "Conjoining a temporal formula with an action in Next is a level error from the semantic pass."
ref: tlc2/tool/impl/Tool.java#evalAppl
outcome: parse-error
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE box_formula_in_next ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1 /\ []TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 9 to line 13, col 24 of module box_formula_in_next
    | \land has both temporal formula and action as arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
