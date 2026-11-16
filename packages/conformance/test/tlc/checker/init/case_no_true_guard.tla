(*---
description: CASE with no true guard and no OTHER has its own initial-states message.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_case
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE case_no_true_guard ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == CASE FALSE -> x = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 In computing initial states, TLC encountered a CASE with no conditions true.
    line 13, col 9 to line 13, col 27 of module case_no_true_guard
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 27 in case_no_true_guard
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
