(*---
description: Simulation reports the same message, from its own check of the initial states.
ref: tlc2/tool/Simulator.java#simulate
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
---*)
---- MODULE simulation_missing_variable ----
VARIABLES x, y
Init == x = 0
Next == x' = x /\ y' = y
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2269:0 Computed 1 initial states...
    2106:1 State is not completely specified by the initial predicate:
    /\ x = 0
    /\ y = null
---*)
