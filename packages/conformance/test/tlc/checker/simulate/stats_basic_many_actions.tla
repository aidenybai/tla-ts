(*---
description: stats=basic reduces the contexts of one action definition to one vertex.
ref: tlc2/tool/Simulator.java#getActionFlowGraphSnapshot
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1,stats=basic
  - -depth
  - "2"
---*)
---- MODULE stats_basic_many_actions ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
A(i) == x' = i
Next == \E i \in 0..1 : A(i)
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
