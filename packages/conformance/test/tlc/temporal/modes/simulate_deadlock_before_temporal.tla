(*---
description: 'A deadlock ends simulation ahead of the check of its trace.'
ref: tlc2/tool/SimulationWorker.java#simulateAndReport
features: [liveness]
outcome: deadlock
config: |
  SPECIFICATION Spec
  PROPERTY Prop
args:
  - -simulate
  - num=8
  - -depth
  - 6
---*)
---- MODULE simulate_deadlock_before_temporal ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>(x = 2)
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate line 19, col 9 to line 19, col 13 of module simulate_deadlock_before_temporal>
    x = 0
    2217:4 2: <Next line 18, col 9 to line 18, col 27 of module simulate_deadlock_before_temporal>
    x = 1
    2217:4 3: <Next line 18, col 9 to line 18, col 27 of module simulate_deadlock_before_temporal>
    x = 2
    2209:0 Progress(8) at <date>: 17 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 17
    Simulation using seed 4 and aril 0
    2209:0 Progress(8) at <date>: 17 states generated, -1 distinct states found, -1 states left on queue.
---*)
