(*---
description: -continue still checks liveness at the end, and a liveness violation then sets the exit status.
ref: tlc2/tool/ModelChecker.java#modelCheckImpl
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  INVARIANT Inv
  PROPERTY Prop
args:
  - -continue
---*)
---- MODULE liveness_after_invariant ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = IF x < 2 THEN x + 1 ELSE x
Spec == Init /\ [][Next]_x
Inv == x = 0
Prop == <>(x = 5)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 39 of module liveness_after_invariant>
    x = 1
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 39 of module liveness_after_invariant>
    x = 1
    2217:4 3: <Next line 16, col 9 to line 16, col 39 of module liveness_after_invariant>
    x = 2
    2192:0 Checking temporal properties for the complete state space with 3 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 39 of module liveness_after_invariant>
    x = 1
    2217:4 3: <Next line 16, col 9 to line 16, col 39 of module liveness_after_invariant>
    x = 2
    2218:4 4: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
