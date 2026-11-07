(*---
description: ":> evaluates its value argument eagerly."
ref: "tlc2/module/TLC.java#MakeFcn"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE colon_greater_eager_value ----
EXTENDS Integers, TLC
Test == (1 :> 1 \div 0)[2] = 0
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
    0. Line 11, column 9 to line 11, column 32 in colon_greater_eager_value
    1. Line 11, column 29 to line 11, column 32 in colon_greater_eager_value
    2. Line 9, column 9 to line 9, column 30 in colon_greater_eager_value
    3. Line 9, column 9 to line 9, column 26 in colon_greater_eager_value
    4. Line 9, column 10 to line 9, column 22 in colon_greater_eager_value
    5. Line 9, column 15 to line 9, column 22 in colon_greater_eager_value
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in colon_greater_eager_value
    1. Line 12, column 30 to line 12, column 33 in colon_greater_eager_value
    2. Line 9, column 9 to line 9, column 30 in colon_greater_eager_value
    3. Line 9, column 9 to line 9, column 26 in colon_greater_eager_value
    4. Line 9, column 10 to line 9, column 22 in colon_greater_eager_value
    5. Line 9, column 15 to line 9, column 22 in colon_greater_eager_value
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in colon_greater_eager_value
    1. Line 13, column 8 to line 13, column 32 in colon_greater_eager_value
    2. Line 13, column 29 to line 13, column 32 in colon_greater_eager_value
    3. Line 9, column 9 to line 9, column 30 in colon_greater_eager_value
    4. Line 9, column 9 to line 9, column 26 in colon_greater_eager_value
    5. Line 9, column 10 to line 9, column 22 in colon_greater_eager_value
    6. Line 9, column 15 to line 9, column 22 in colon_greater_eager_value
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in colon_greater_eager_value
    1. Line 12, column 12 to line 12, column 36 in colon_greater_eager_value
    2. Line 12, column 33 to line 12, column 36 in colon_greater_eager_value
    3. Line 9, column 9 to line 9, column 30 in colon_greater_eager_value
    4. Line 9, column 9 to line 9, column 26 in colon_greater_eager_value
    5. Line 9, column 10 to line 9, column 22 in colon_greater_eager_value
    6. Line 9, column 15 to line 9, column 22 in colon_greater_eager_value
---*)
