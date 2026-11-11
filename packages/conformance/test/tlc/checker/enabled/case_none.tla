(*---
description: ENABLED of CASE with no true guard has its own message.
ref: tlc2/tool/impl/Tool.java#enabledApplImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE case_none ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == PrintT(ENABLED (CASE x = 1 -> x' = 1))
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 In computing ENABLED, TLC encountered a CASE with no conditions true.
    line 15, col 24 to line 15, col 43 of module case_none
    While working on the initial state:
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in case_none
    1. Line 15, column 8 to line 15, column 45 in case_none
    2. Line 15, column 15 to line 15, column 44 in case_none
    3. Line 15, column 24 to line 15, column 43 in case_none
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
