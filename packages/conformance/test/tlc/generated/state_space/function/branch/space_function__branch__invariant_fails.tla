(*---
description: Explores init function and next branch with check invariant_fails.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE space_function__branch__invariant_fails ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == x = [e \in {1} |-> 0] /\ y = <<>>
Next == x' \in {x} /\ (y' = y \/ y' = y)
Inv == FALSE
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The invariant of Inv is equal to FALSE
---*)
