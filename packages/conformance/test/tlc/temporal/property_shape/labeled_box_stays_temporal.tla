(*---
description: 'A label has no case in processConfigProps, so a labeled box is level 3 and an implied temporal, though unlabeled it would be an invariant. Real TLC bug, as a label does not change the meaning of the formula it names.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness, tlc-bug]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
correct:
  all:
    exit: 12
    transcript: |-
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2110:1 Invariant Prop is violated.
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      x = 0
      2217:4 2: <Next line 27, col 9 to line 27, col 27 of module labeled_box_stays_temporal>
      x = 1
      2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 2.
---*)
---- MODULE labeled_box_stays_temporal ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == lbl :: [](x < 1)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 3 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module labeled_box_stays_temporal>
    x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 27 of module labeled_box_stays_temporal>
    x = 2
    2218:4 4: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
