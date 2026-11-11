(*---
description: Simulation removes finite stuttering from a behavior when it collects the trace.
ref: tlc2/tool/SimulationWorker.java#getTrace
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -simulate
  - num=1
  - -depth
  - "20"
---*)
---- MODULE trace_stuttering_eliminated ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Move == x' = x + 1 /\ y' = y
Stay == x' = x /\ y' = y
Next == Move \/ Stay
Inv == x < 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 18, col 9 to line 18, col 22 of module trace_stuttering_eliminated>
    /\ x = 0
    /\ y = 0
    2217:4 2: <Move line 19, col 9 to line 19, col 28 of module trace_stuttering_eliminated>
    /\ x = 1
    /\ y = 0
    2217:4 3: <Move line 19, col 9 to line 19, col 28 of module trace_stuttering_eliminated>
    /\ x = 2
    /\ y = 0
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
---*)
