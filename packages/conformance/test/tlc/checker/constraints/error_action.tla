(*---
description: An evaluation error in an action constraint prints the behavior.
ref: tlc2/tool/impl/Tool.java#isInActions
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  ACTION_CONSTRAINT Con
---*)
---- MODULE error_action ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Con == 1 \div x' > 0
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
    2217:4 2: <Next line 14, col 9 to line 14, col 14 of module error_action>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 8 to line 15, column 20 in error_action
    1. Line 15, column 8 to line 15, column 16 in error_action
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
