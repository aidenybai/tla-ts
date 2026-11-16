(*---
description: 'A CONSTRAINT ends the trace at its boundary, where WF rules out stuttering, so the unreachable goal passes.'
ref: tlc2/tool/SimulationWorker.java#simulateAndReport
features: [liveness]
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
  CONSTRAINT C
args:
  - -simulate
  - num=8
  - -depth
  - 6
---*)
---- MODULE simulate_constraint_truncates_trace ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
C == x < 2
Prop == <>(x = 2)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(8) at <date>: 17 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(8) at <date>: 17 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 17
    Simulation using seed 4 and aril 0
---*)
