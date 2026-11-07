(*---
description: The first initial state that violates the invariant is reported, in generation order.
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE initial_violation_second_state ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in 1..3
Next == x' = x
Inv == x < 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    x = 2
---*)
