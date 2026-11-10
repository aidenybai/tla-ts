(*---
description: Explores init equal and next exists with check invariant_fails.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE space_equal__exists__invariant_fails ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == x = 0 /\ y = 0
Next == \E v \in {y} : y' = v /\ x' = x
Inv == FALSE
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The invariant of Inv is equal to FALSE
---*)
