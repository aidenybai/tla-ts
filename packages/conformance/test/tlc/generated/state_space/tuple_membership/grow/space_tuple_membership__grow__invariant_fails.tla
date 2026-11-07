(*---
description: Explores init tuple_membership and next grow with check invariant_fails.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE space_tuple_membership__grow__invariant_fails ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == <<x, y>> \in {0, 1} \X {0}
Next == x' = x /\ y' = y /\ x = x
Inv == FALSE
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The invariant of Inv is equal to FALSE
---*)
