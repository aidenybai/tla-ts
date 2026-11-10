(*---
description: TLCSet("pause", TRUE) in simulation does nothing, since there is no ModelChecker.
ref: tlc2/module/TLCGetSet.java#TLCSet
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
---- MODULE pause_ignored ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2 /\ TLCSet("pause", TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 2
    Simulation using seed 4 and aril 0
---*)
