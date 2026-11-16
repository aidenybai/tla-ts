(*---
description: -generate returns from nested \E after one successor.
ref: tlc2/tool/impl/Tool.java#getNextStatesAppl
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -generate
  - num=1
  - -depth
  - "2"
---*)
---- MODULE exists_nested ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == \E i \in 0..3 : \E j \in 0..3 : x' = i + j /\ PrintT(<<i, j>>)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | <<0, 2>>
    | <<0, 3>>
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
---*)
