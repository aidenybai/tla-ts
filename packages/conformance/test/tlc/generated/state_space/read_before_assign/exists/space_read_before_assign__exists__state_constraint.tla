(*---
description: Explores init read_before_assign and next exists with check state_constraint.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
---*)
---- MODULE space_read_before_assign__exists__state_constraint ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == x = y /\ y = 0
Next == \E v \in {y} : y' = v /\ x' = x
Con == FALSE
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The constraint of Con is equal to FALSE
---*)
