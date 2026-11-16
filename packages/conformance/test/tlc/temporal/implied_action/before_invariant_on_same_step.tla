(*---
description: 'On one step invariants are checked before implied actions.'
ref: tlc2/tool/Worker.java#doNext
features: [liveness, implied-action]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  INVARIANT Inv
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE before_invariant_on_same_step ----
EXTENDS Naturals
VARIABLE x
Next == x < 3 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Inv == x < 1
Prop == [][x' = 99]_x
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 27 of module before_invariant_on_same_step>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
