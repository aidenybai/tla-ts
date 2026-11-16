(*---
description: A partial first disjunct stops TLC before the complete second disjunct, because the functor throws.
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE partial_first_disjunct ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == x = 2 \/ (x = 1 /\ y = 1 /\ PrintT("second"))
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2102:1 current state is not a legal state
    While working on the initial state:
    /\ x = 2
    /\ y = null
---*)
