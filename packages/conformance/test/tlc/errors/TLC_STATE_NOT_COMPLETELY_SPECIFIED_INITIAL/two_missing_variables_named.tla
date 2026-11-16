(*---
description: The message names each missing variable.
ref: tlc2/tool/DFIDModelChecker.java#doInit
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "2"
---*)
---- MODULE two_missing_variables_named ----
VARIABLES x, y, z
Init == x = 0
Next == UNCHANGED <<x, y, z>>
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2106:1 State is not completely specified by the initial predicate:
    /\ x = 0
    /\ y = null
    /\ z = null
---*)
