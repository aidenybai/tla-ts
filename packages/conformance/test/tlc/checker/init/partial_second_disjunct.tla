(*---
description: "Disjuncts are checked in order: the first gives a complete state and the second fails the legality check."
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE partial_second_disjunct ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == (x = 1 /\ y = 1 /\ PrintT("first")) \/ x = 2
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    | "first"
    2102:1 current state is not a legal state
    While working on the initial state:
    /\ x = 2
    /\ y = null
---*)
