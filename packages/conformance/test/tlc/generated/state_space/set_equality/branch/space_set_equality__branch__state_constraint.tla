(*---
description: Explores init set_equality and next branch with check state_constraint.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
---*)
---- MODULE space_set_equality__branch__state_constraint ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == x \in {0} /\ y \in SUBSET {} /\ y = {} 
Next == x' \in {x} /\ (y' = y \/ y' = y)
Con == FALSE
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The constraint of Con is equal to FALSE
---*)
