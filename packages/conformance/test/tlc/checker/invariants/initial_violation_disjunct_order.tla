(*---
description: Initial states come in generation order, so the disjunct written first is the first checked.
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE initial_violation_disjunct_order ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 3 \/ x = 2
Next == x' = x
Inv == x < 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    x = 3
---*)
