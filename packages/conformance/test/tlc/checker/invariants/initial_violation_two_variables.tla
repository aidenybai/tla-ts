(*---
description: An initial violation with two variables prints bullets.
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE initial_violation_two_variables ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = "a"
Next == UNCHANGED <<x, y>>
Inv == x > 0
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    /\ x = 0
    /\ y = "a"
---*)
