(*---
description: SPECIFICATION with an initial predicate that misses a variable fails the same legality check as INIT.
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
---*)
---- MODULE spec_unbound_variable_partial ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Spec == x = 1 /\ [][Next]_<<x, y>>
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2102:1 current state is not a legal state
    While working on the initial state:
    /\ x = 1
    /\ y = null
---*)
