(*---
description: 'On the same state an invariant violation preempts the sink.'
ref: tlc2/tool/liveness/LiveCheck.java#printErrorTrace
features: [liveness]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
  INVARIANT Inv
---*)
---- MODULE safety_like_invariant_preempts ----
EXTENDS Naturals, TLC
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Inv == x < 1
Prop == [](x = 1 => [](x = 1))
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 27 of module safety_like_invariant_preempts>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
