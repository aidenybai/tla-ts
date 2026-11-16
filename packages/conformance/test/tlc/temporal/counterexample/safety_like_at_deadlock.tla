(*---
description: 'The deadlock check on a state runs before its sink check, so a sink on a deadlocking state reports deadlock, exit 11.'
ref: tlc2/tool/liveness/LiveCheck.java#printErrorTrace
features: [liveness]
outcome: deadlock
config: |
  SPECIFICATION Spec
  PROPERTY Prop
---*)
---- MODULE safety_like_at_deadlock ----
EXTENDS Naturals, TLC
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == [](x = 1 => [](x = 1))
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 13, col 9 to line 13, col 27 of module safety_like_at_deadlock>
    x = 1
    2217:4 3: <Next line 13, col 9 to line 13, col 27 of module safety_like_at_deadlock>
    x = 2
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 13, col 9 to line 13, col 27 of module safety_like_at_deadlock>
    x = 1
    2217:4 3: <Next line 13, col 9 to line 13, col 27 of module safety_like_at_deadlock>
    x = 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
