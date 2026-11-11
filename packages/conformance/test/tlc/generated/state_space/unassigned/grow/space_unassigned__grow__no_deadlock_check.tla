(*---
description: Explores init unassigned and next grow with check no_deadlock_check.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  CHECK_DEADLOCK FALSE
---*)
---- MODULE space_unassigned__grow__no_deadlock_check ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == x = 0
Next == x' = x /\ y' = y /\ x = x

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
