(*---
description: Explores init unassigned and next exists with check invariant_non_boolean.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE space_unassigned__exists__invariant_non_boolean ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == x = 0
Next == \E v \in {y} : y' = v /\ x' = x
Inv == 1
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2102:1 current state is not a legal state
    While working on the initial state:
    /\ x = 0
    /\ y = null
---*)
