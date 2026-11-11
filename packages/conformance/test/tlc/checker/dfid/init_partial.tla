(*---
description: An initial state missing a variable reports the initial-state error under -dfid.
ref: tlc2/tool/DFIDModelChecker.java#doInit
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "10"
---*)
---- MODULE init_partial ----
EXTENDS Naturals, TLC
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
