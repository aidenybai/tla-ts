(*---
description: An unknown simulate argument next to a known one is ignored.
ref: tlc2/TLC.java#handleParameters
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1,bogus=2
  - -depth
  - "2"
---*)
---- MODULE unknown_argument_ignored ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
---*)
