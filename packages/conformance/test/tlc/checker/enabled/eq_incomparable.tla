(*---
description: ENABLED of a second x' = e with an incomparable value is an equality error.
ref: tlc2/tool/impl/Tool.java#enabledApplImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE eq_incomparable ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == PrintT(ENABLED (x' = 1 /\ x' = "a"))
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    While working on the initial state:
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in eq_incomparable
    1. Line 15, column 8 to line 15, column 43 in eq_incomparable
    2. Line 15, column 15 to line 15, column 42 in eq_incomparable
    3. Line 15, column 24 to line 15, column 41 in eq_incomparable
    4. Line 15, column 24 to line 15, column 29 in eq_incomparable
    5. Line 15, column 34 to line 15, column 41 in eq_incomparable
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
