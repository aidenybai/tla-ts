(*---
description: '[](P => []Q) that fails is found by the tableau sink in addNextState: the trace ends at the violating state with no stutter marker or warning, the message is TLC_TEMPORAL_PROPERTY_VIOLATED, and the exit code is that of a safety violation, 12.'
ref: tlc2/tool/liveness/OrderOfSolution.java#hasEmptyPEMAndBoxFreePromises
features: [liveness]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE safety_like_box_implication ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == [](x = 1 => [](x = 1))
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module safety_like_box_implication>
    x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 27 of module safety_like_box_implication>
    x = 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
