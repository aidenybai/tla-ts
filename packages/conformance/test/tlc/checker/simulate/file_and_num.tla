(*---
description: file= writes trace modules without changing the printed output.
ref: tlc2/tool/SimulationWorker.java#simulateRandomTrace
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=2,file=trace
  - -depth
  - "2"
---*)
---- MODULE file_and_num ----
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
    2209:0 Progress(2) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(2) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 5
    Simulation using seed 4 and aril 0
---*)
