(*---
description: 'An implied action is checked per step under simulation.'
ref: tlc2/tool/SimulationWorker.java#simulateAndReport
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -simulate
  - num=8
  - -depth
  - 6
---*)
---- MODULE simulate_implied_action_violated ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == [][x' < 2]_x
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2112:1 Action property Prop is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate line 20, col 9 to line 20, col 13 of module simulate_implied_action_violated>
    x = 0
    2217:4 2: <Next line 19, col 9 to line 19, col 27 of module simulate_implied_action_violated>
    x = 1
    2217:4 3: <Next line 19, col 9 to line 19, col 27 of module simulate_implied_action_violated>
    x = 2
    2209:0 Progress(8) at <date>: 17 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 17
    Simulation using seed 4 and aril 0
    2209:0 Progress(8) at <date>: 17 states generated, -1 distinct states found, -1 states left on queue.
---*)
