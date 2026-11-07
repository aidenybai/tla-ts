(*---
description: An unbounded \E in Next falls to the default case and evaluation rejects it, with the initial state in the trace.
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE exists_unbounded ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == \E v : x' = v
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : TLC attempted to evaluate an unbounded \E.
    Make sure that the expression is of form \E x \in S: P(x).
    line 13, col 9 to line 13, col 21 of module exists_unbounded
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 21 in exists_unbounded
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
