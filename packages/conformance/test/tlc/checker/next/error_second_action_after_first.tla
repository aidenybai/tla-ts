(*---
description: An error in a later action still stops the state's expansion after the first action's successors were counted.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE error_second_action_after_first ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
A == x' = 1
B == x' = 1 \div 0
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
    0. Line 14, column 6 to line 14, column 18 in error_second_action_after_first
    1. Line 14, column 11 to line 14, column 18 in error_second_action_after_first
    2199:0 2 states generated, 2 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
