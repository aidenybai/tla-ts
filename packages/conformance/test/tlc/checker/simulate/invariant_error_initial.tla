(*---
description: An evaluation error in an invariant at an initial state reports the initial-state error in simulation.
ref: tlc2/tool/Simulator.java#simulate
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -simulate
  - num=1
  - -depth
  - "5"
---*)
---- MODULE invariant_error_initial ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == 1 \div x = 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2269:0 Computed 1 initial states...
    2179:0 The second argument of \div is 0.
    | While working on the initial state:
    | x = 0
    2179:0 The second argument of \div is 0.
    2209:0 Progress(0) at <date>: 1 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 1
    Simulation using seed 4 and aril 0
---*)
