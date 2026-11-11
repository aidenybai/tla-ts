(*---
description: Depth-first checking reports an initial state with an unassigned variable as this message.
ref: tlc2/tool/DFIDModelChecker.java#doInit
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "2"
---*)
---- MODULE dfid_missing_variable ----
VARIABLES x, y
Init == x = 0
Next == x' = x /\ y' = y
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2106:1 State is not completely specified by the initial predicate:
    /\ x = 0
    /\ y = null
---*)
