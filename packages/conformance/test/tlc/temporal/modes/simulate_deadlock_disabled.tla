(*---
description: 'With deadlock disabled, the trace ending at a terminal state is checked.'
ref: tlc2/tool/SimulationWorker.java#simulateAndReport
features: [liveness]
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
args:
  - -simulate
  - num=8
  - -depth
  - 6
  - -deadlock
---*)
---- MODULE simulate_deadlock_disabled ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
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
