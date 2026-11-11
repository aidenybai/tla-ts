(*---
description: A state-level predicate that never assigns reaches the functor with every variable null.
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE partial_no_assignment_guard ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == FALSE => x = 1
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2102:1 current state is not a legal state
    While working on the initial state:
    /\ x = null
    /\ y = null
---*)
