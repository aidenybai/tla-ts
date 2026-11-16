(*---
description: TLCGet("stats").behavior in simulation reports the running behavior's statistics.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=2
  - -depth
  - "2"
---*)
---- MODULE get_stats_behavior ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1 /\ PrintT(TLCGet("stats").behavior)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | [id |-> 1, actions |-> []]
    | [id |-> 1, actions |-> [Next |-> 1]]
    | [id |-> 2, actions |-> []]
    | [id |-> 2, actions |-> [Next |-> 1]]
    2209:0 Progress(2) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(2) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 5
    Simulation using seed 4 and aril 0
---*)
