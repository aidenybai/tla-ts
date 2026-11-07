(*---
description: 'An action that reads x'' before binding it fails with the generic undefined identifier error, in ENABLED, and not the LIVE variant.'
ref: tlc2/tool/impl/Tool.java#enabled
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE weak_action_primes_other_side ----
EXTENDS Naturals
VARIABLE x
A == x < 2 /\ x' = x + 1
Prop == <>(x = 2)

Spec == x = 0 /\ [][A]_x /\ WF_x(x' = x' + 1)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 34 to line 17, column 44 in weak_action_primes_other_side
    1. Line 17, column 39 to line 17, column 44 in weak_action_primes_other_side
    2. Line 17, column 39 to line 17, column 40 in weak_action_primes_other_side
    3. Line 17, column 39 to line 17, column 39 in weak_action_primes_other_side
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 17, col 39 to line 17, col 39 of module weak_action_primes_other_side
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 17, col 39 to line 17, col 39 of module weak_action_primes_other_side
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2199:0 2 states generated, 2 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).
---*)
