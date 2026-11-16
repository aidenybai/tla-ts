(*---
description: A property of the form []P with a state predicate P is split off and checked as an invariant, so it reports an invariant violation and exits 12 instead of 13.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
---*)
---- MODULE property_box_state_predicate_is_invariant ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Spec == Init /\ [][Next]_x
Prop == [](x = 0)
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
    2217:4 2: <Next line 13, col 9 to line 13, col 24 of module property_box_state_predicate_is_invariant>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
