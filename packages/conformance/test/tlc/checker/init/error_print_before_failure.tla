(*---
description: PrintT output before a failing conjunct appears, and the failing conjunct stops the run.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE error_print_before_failure ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x = 1 /\ PrintT("before") /\ 1 \div 0 = 0 /\ PrintT("after")
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    | "before"
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    | "before"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 68 in error_print_before_failure
    1. Line 13, column 9 to line 13, column 49 in error_print_before_failure
    2. Line 13, column 9 to line 13, column 33 in error_print_before_failure
    3. Line 13, column 9 to line 13, column 13 in error_print_before_failure
    4. Line 13, column 38 to line 13, column 49 in error_print_before_failure
    5. Line 13, column 38 to line 13, column 45 in error_print_before_failure
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
