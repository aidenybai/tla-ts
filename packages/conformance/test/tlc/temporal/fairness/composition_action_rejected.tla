(*---
description: 'Action composition inside fairness is not supported by TLC.'
ref: tlc2/tool/impl/Tool.java#evalAppl
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE composition_action_rejected ----
EXTENDS Naturals
VARIABLE x
A == x < 2 /\ x' = x + 1
Prop == <>(x = 2)

Spec == x = 0 /\ [][A]_x /\ WF_x(A \cdot A)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 34 to line 17, column 42 in composition_action_rejected
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : The current version of TLC does not support action composition.  An incomplete implementation can be enabled via the tlc2.tool.impl.Tool.cdot=true java property.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2199:0 2 states generated, 2 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).
---*)
