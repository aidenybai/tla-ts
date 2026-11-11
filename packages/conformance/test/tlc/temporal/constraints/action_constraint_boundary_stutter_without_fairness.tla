(*---
description: 'Without fairness the state whose edge the action constraint removes stutters.'
ref: tlc2/tool/ModelChecker.java#doNext
features: [liveness, constraint]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  ACTION_CONSTRAINT Ac
---*)
---- MODULE action_constraint_boundary_stutter_without_fairness ----
EXTENDS Naturals
VARIABLE x
Next == x' = x + 1
Spec == x = 0 /\ [][Next]_x
Con == x <= 2
Ac == x' < 2
Prop == <>(x = 2)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 2 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module action_constraint_boundary_stutter_without_fairness>
    x = 1
    2218:4 3: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
