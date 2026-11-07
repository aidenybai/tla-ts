(*---
description: ENABLED of a numeral isn't handled and fails.
ref: tlc2/tool/impl/Tool.java#enabledApplImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE numeral_body ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == PrintT(ENABLED 1)
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 Attempted to compute ENABLED on a non-boolean expression.
    1
    While working on the initial state:
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in numeral_body
    1. Line 15, column 8 to line 15, column 24 in numeral_body
    2. Line 15, column 15 to line 15, column 23 in numeral_body
    3. Line 15, column 23 to line 15, column 23 in numeral_body
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
