(*---
description: The replay with a call stack after an error in Next runs the action a second time.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE error_replay_print ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == PrintT("next") /\ x' = 1 \div x
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | "next"
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    | "next"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 39 in error_replay_print
    1. Line 13, column 9 to line 13, column 22 in error_replay_print
    2. Line 13, column 27 to line 13, column 39 in error_replay_print
    3. Line 13, column 32 to line 13, column 39 in error_replay_print
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
