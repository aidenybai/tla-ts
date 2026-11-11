(*---
description: Explores init disjunction and next except with check state_constraint.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
---*)
---- MODULE space_disjunction__except__state_constraint ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == (x = 0 \/ x = 1) /\ y = 0
Next == x' = [[z \in {1} |-> 0] EXCEPT ![1] = 1] /\ y' = y
Con == FALSE
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The constraint of Con is equal to FALSE
---*)
