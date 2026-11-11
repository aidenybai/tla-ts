(*---
description: -generate with x' \in {} is a deadlock.
ref: tlc2/tool/impl/Tool.java#getNextStatesAppl
outcome: deadlock
config: |
  INIT Init
  NEXT Next
args:
  - -generate
  - num=1
  - -depth
  - "4"
---*)
---- MODULE in_empty ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' \in {}
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 17, col 9 to line 17, col 13 of module in_empty>
    x = 0
    2209:0 Progress(1) at <date>: 1 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 1
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 1 states generated, -1 distinct states found, -1 states left on queue.
---*)
