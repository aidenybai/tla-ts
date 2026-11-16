(*---
description: An initial violation still prints the counts of the states so far.
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE initial_violation_counts ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in 1..3
Next == x' = x
Inv == x < 3
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 2 initial states...
    2107:1 Invariant Inv is violated by the initial state:
    x = 3
---*)
