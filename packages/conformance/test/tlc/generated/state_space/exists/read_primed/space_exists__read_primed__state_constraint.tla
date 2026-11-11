(*---
description: Explores init exists and next read_primed with check state_constraint.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
---*)
---- MODULE space_exists__read_primed__state_constraint ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == \E v \in 0..1 : x = v /\ y = v
Next == x' = x /\ y' = x'
Con == FALSE
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The constraint of Con is equal to FALSE
---*)
