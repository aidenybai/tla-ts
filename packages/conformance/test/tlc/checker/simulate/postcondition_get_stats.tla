(*---
description: A postcondition in simulation reads the run's final statistics.
ref: tlc2/tool/Simulator.java#simulate
outcome: success
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
args:
  - -simulate
  - num=2
  - -depth
  - "3"
---*)
---- MODULE postcondition_get_stats ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Post == PrintT(<<TLCGet("stats").traces, TLCGet("stats").generated>>)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | <<2, 7>>
    2209:0 Progress(2) at <date>: 7 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(2) at <date>: 7 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 7
    Simulation using seed 4 and aril 0
---*)
