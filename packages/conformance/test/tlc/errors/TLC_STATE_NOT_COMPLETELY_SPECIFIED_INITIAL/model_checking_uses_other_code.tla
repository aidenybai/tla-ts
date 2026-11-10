(*---
description: Breadth-first checking reports the same problem through TLC_INITIAL_STATE instead.
ref: tlc2/tool/ModelChecker.java#doInit
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE model_checking_uses_other_code ----
VARIABLES x, y
Init == x = 0
Next == x' = x /\ y' = y
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
