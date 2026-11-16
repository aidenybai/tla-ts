(*---
description: An invariant violated by an initial state prints the state in the message, with no trace.
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE initial_violation ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == x > 0
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    x = 0
---*)
