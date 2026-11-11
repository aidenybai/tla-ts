(*---
description: 'An ACTION_CONSTRAINT is not level checked: a temporal one fails on the first step, exit 75.'
ref: tlc2/tool/impl/SpecProcessor.java#processActionConstraints
features: [liveness, constraint]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  ACTION_CONSTRAINT Bad
---*)
---- MODULE action_constraint_temporal_rejected ----
EXTENDS Naturals
VARIABLE x
Next == x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Con == x <= 2
Bad == <>(x = 1)
Prop == <>(x = 1)
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2261:0 TLC encountered a temporal formula (<>A) when evaluating a predicate or action.
    line 17, col 8 to line 17, col 16 of module action_constraint_temporal_rejected
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module action_constraint_temporal_rejected>
    x = 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 8 to line 17, column 16 in action_constraint_temporal_rejected
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
