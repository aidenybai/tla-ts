(*---
description: A false conjunct gives the same message.
ref: tlc2/tool/Simulator.java#simulate
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
---*)
---- MODULE simulation_false_init ----
VARIABLE x
Init == x = 0 /\ FALSE
Next == x' = x
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2269:0 Computed 0 initial states...
    2118:1 There is no state satisfying the initial state predicate.
---*)
