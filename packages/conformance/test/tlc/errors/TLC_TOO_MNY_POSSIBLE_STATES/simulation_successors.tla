(*---
description: Simulation also collects successors in a StateVec.
ref: tlc2/tool/StateVec.java#grow
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -maxSetSize
  - "2"
---*)
---- MODULE simulation_successors ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' \in 1..9
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2172:1 Too many possible next states for the last state in the trace.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 17, col 9 to line 17, col 13 of module simulation_successors>
    x = 0
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
---*)
