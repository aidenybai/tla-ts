(*---
description: TLCGet("diameter") while simulation computes initial states is 0.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "1"
---*)
---- MODULE get_diameter_init ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0 /\ PrintT(TLCGet("diameter"))
Next == x' = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 0
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 2
    Simulation using seed 4 and aril 0
---*)
