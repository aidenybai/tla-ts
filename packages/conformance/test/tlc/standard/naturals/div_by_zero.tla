(*---
description: Division by zero has its own message.
ref: tlc2/module/Naturals.java#Divide
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE div_by_zero ----
EXTENDS Naturals
Test == 1 \div 0 = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in div_by_zero
    1. Line 14, column 29 to line 14, column 32 in div_by_zero
    2. Line 12, column 9 to line 12, column 20 in div_by_zero
    3. Line 12, column 9 to line 12, column 16 in div_by_zero
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in div_by_zero
    1. Line 15, column 30 to line 15, column 33 in div_by_zero
    2. Line 12, column 9 to line 12, column 20 in div_by_zero
    3. Line 12, column 9 to line 12, column 16 in div_by_zero
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in div_by_zero
    1. Line 16, column 8 to line 16, column 32 in div_by_zero
    2. Line 16, column 29 to line 16, column 32 in div_by_zero
    3. Line 12, column 9 to line 12, column 20 in div_by_zero
    4. Line 12, column 9 to line 12, column 16 in div_by_zero
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in div_by_zero
    1. Line 15, column 12 to line 15, column 36 in div_by_zero
    2. Line 15, column 33 to line 15, column 36 in div_by_zero
    3. Line 12, column 9 to line 12, column 20 in div_by_zero
    4. Line 12, column 9 to line 12, column 16 in div_by_zero
---*)
