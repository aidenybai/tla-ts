(*---
description: An evaluation error in a later action stops the state before the deadlock check.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE eval_error_beats_deadlock ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
A == FALSE /\ x' = 1
B == 1 \div 0 = 1 /\ x' = 1
Next == A \/ B
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
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 6 to line 14, column 27 in eval_error_beats_deadlock
    1. Line 14, column 6 to line 14, column 17 in eval_error_beats_deadlock
    2. Line 14, column 6 to line 14, column 13 in eval_error_beats_deadlock
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
