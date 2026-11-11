(*---
description: A spec that extends RealTime and leaves now unassigned does not fully specify its initial state.
ref: tla2sany/StandardModules/RealTime.tla#now
features:
  - RealTime
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE now_must_be_assigned ----
EXTENDS RealTime
VARIABLE x
Init == x = 0
Next == x' = x /\ now' = now
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2102:1 current state is not a legal state
    While working on the initial state:
    /\ now = null
    /\ x = 0
---*)
