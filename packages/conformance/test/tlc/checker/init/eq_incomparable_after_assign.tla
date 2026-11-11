(*---
description: Comparing an assigned integer with a string in a second x = e is the equality error of IntValue.equals, not a dropped branch.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE eq_incomparable_after_assign ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x = 1 /\ x = "a"
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 24 in eq_incomparable_after_assign
    1. Line 13, column 9 to line 13, column 13 in eq_incomparable_after_assign
    2. Line 13, column 18 to line 13, column 24 in eq_incomparable_after_assign
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
