(*---
description: ENABLED (UNCHANGED op(x)) is valid TLA+, yet TLC fails to evaluate it, because enabledUnchanged evaluates the expression in the partial next state with EvalControl.Primed. The comment in enabledUnchanged names this as a bug.
ref: tlc2/tool/impl/Tool.java#enabledUnchanged
features:
  - tlc-bug
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
correct:
  all:
    exit: 0
    transcript: |-
      | TRUE
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2193:0 Model checking completed. No error has been found.
        Estimates of the probability that TLC did not check all reachable states
        because two distinct states had the same fingerprint:
        calculated (optimistic):  val = 5.4E-20
      2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 1.
      2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
---- MODULE unchanged_operator_with_argument_bug ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Id(v) == v
Inv == PrintT(ENABLED (UNCHANGED Id(x)))
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    x = 0
    2148:0 The action formula A appearing in a WF_v(A) or SF_v(A) operator does not specify the primed value of the variable x occurring in the state formula v.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 13 in unchanged_operator_with_argument_bug
    1. Line 18, column 8 to line 18, column 40 in unchanged_operator_with_argument_bug
    2. Line 18, column 15 to line 18, column 39 in unchanged_operator_with_argument_bug
    3. Line 18, column 24 to line 18, column 38 in unchanged_operator_with_argument_bug
    4. Line 18, column 34 to line 18, column 38 in unchanged_operator_with_argument_bug
    5. Line 17, column 10 to line 17, column 10 in unchanged_operator_with_argument_bug
    6. Line 18, column 37 to line 18, column 37 in unchanged_operator_with_argument_bug
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
