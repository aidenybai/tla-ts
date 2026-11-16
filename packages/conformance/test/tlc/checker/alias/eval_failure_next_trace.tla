(*---
description: An alias applies to the trace printed for an evaluation error in Next.
ref: tlc2/tool/impl/Tool.java#evalAlias
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  ALIAS A
---*)
---- MODULE eval_failure_next_trace ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1 \div (1 - x)
A == [p |-> x + 1]
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    p = 1
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module eval_failure_next_trace>
    p = 2
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 27 in eval_failure_next_trace
    1. Line 14, column 14 to line 14, column 27 in eval_failure_next_trace
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
