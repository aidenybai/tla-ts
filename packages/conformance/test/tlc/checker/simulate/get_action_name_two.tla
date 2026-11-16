(*---
description: TLCGet("action").name in simulation is the action that made the current state.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "3"
---*)
---- MODULE get_action_name_two ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
A == x' = x + 1 /\ PrintT(TLCGet("action").name)
B == FALSE /\ x' = x
Next == A \/ B
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | "Init"
    | "A"
    | "A"
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 4
    Simulation using seed 4 and aril 0
---*)
