(*---
description: 'A CONSTRAINT is not level checked: a temporal one fails on the first state with TLC_ENCOUNTERED_FORMULA_IN_PREDICATE, exit 75.'
ref: tlc2/tool/impl/SpecProcessor.java#processModelConstraints
features: [liveness, constraint]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CONSTRAINT Bad
---*)
---- MODULE constraint_uses_temporal_rejected ----
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
    2102:1 While working on the initial state:
    x = 0
    2261:0 TLC encountered a temporal formula (<>A) when evaluating a predicate or action.
    line 17, col 8 to line 17, col 16 of module constraint_uses_temporal_rejected
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 13 in constraint_uses_temporal_rejected
    1. Line 17, column 8 to line 17, column 16 in constraint_uses_temporal_rejected
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
