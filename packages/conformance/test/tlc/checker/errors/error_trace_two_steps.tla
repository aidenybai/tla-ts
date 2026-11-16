(*---
description: An error in Next after two steps prints all states up to the state being expanded.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE error_trace_two_steps ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1 /\ 1 \div (2 - x) >= 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 13, col 9 to line 13, col 41 of module error_trace_two_steps>
    x = 1
    2217:4 3: <Next line 13, col 9 to line 13, col 41 of module error_trace_two_steps>
    x = 2
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 41 in error_trace_two_steps
    1. Line 13, column 9 to line 13, column 18 in error_trace_two_steps
    2. Line 13, column 23 to line 13, column 41 in error_trace_two_steps
    3. Line 13, column 23 to line 13, column 36 in error_trace_two_steps
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
