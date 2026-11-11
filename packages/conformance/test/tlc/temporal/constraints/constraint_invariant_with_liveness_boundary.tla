(*---
description: 'Invariants run on the pruned successor while the liveness graph does not include it.'
ref: tlc2/tool/ModelChecker.java#doNext
features: [liveness, constraint]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  INVARIANT Inv
  CONSTRAINT Con
---*)
---- MODULE constraint_invariant_with_liveness_boundary ----
EXTENDS Naturals
VARIABLE x
Next == x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Con == x <= 2
Inv == x < 3
Prop == <>(x = 2)
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
    2217:4 2: <Next line 15, col 9 to line 15, col 18 of module constraint_invariant_with_liveness_boundary>
    x = 1
    2217:4 3: <Next line 15, col 9 to line 15, col 18 of module constraint_invariant_with_liveness_boundary>
    x = 2
    2217:4 4: <Next line 15, col 9 to line 15, col 18 of module constraint_invariant_with_liveness_boundary>
    x = 3
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
