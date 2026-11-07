(*---
description: 'After a split, a conjunct invariant with a non-trivial argument has as its name the conjunct''s text location.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE conjunct_name_in_violated_invariant_is_body_text ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == [](x < 1) /\ [](x < 2)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant line 16, col 9 to line 16, col 17 of module conjunct_name_in_violated_invariant_is_body_text is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module conjunct_name_in_violated_invariant_is_body_text>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
