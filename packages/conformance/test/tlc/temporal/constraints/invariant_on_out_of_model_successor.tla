(*---
description: 'A []P property''s invariant is checked on a successor that the constraint prunes, because it counts as unseen.'
ref: tlc2/tool/ModelChecker.java#doNext
features: [liveness, constraint]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CONSTRAINT Con
---*)
---- MODULE invariant_on_out_of_model_successor ----
EXTENDS Naturals
VARIABLE x
Next == x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Con == x <= 2
Prop == [](x < 3)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Prop is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module invariant_on_out_of_model_successor>
    x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 18 of module invariant_on_out_of_model_successor>
    x = 2
    2217:4 4: <Next line 14, col 9 to line 14, col 18 of module invariant_on_out_of_model_successor>
    x = 3
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
