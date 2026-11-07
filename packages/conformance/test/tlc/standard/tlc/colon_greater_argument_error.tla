(*---
description: An error in the value of :> is not deferred.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE colon_greater_argument_error ----
EXTENDS TLC, Naturals
Test == (1 :> 1 \div 0) = (1 :> 1)
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
    0. Line 14, column 9 to line 14, column 32 in colon_greater_argument_error
    1. Line 14, column 29 to line 14, column 32 in colon_greater_argument_error
    2. Line 12, column 9 to line 12, column 34 in colon_greater_argument_error
    3. Line 12, column 10 to line 12, column 22 in colon_greater_argument_error
    4. Line 12, column 15 to line 12, column 22 in colon_greater_argument_error
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in colon_greater_argument_error
    1. Line 15, column 30 to line 15, column 33 in colon_greater_argument_error
    2. Line 12, column 9 to line 12, column 34 in colon_greater_argument_error
    3. Line 12, column 10 to line 12, column 22 in colon_greater_argument_error
    4. Line 12, column 15 to line 12, column 22 in colon_greater_argument_error
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in colon_greater_argument_error
    1. Line 16, column 8 to line 16, column 32 in colon_greater_argument_error
    2. Line 16, column 29 to line 16, column 32 in colon_greater_argument_error
    3. Line 12, column 9 to line 12, column 34 in colon_greater_argument_error
    4. Line 12, column 10 to line 12, column 22 in colon_greater_argument_error
    5. Line 12, column 15 to line 12, column 22 in colon_greater_argument_error
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in colon_greater_argument_error
    1. Line 15, column 12 to line 15, column 36 in colon_greater_argument_error
    2. Line 15, column 33 to line 15, column 36 in colon_greater_argument_error
    3. Line 12, column 9 to line 12, column 34 in colon_greater_argument_error
    4. Line 12, column 10 to line 12, column 22 in colon_greater_argument_error
    5. Line 12, column 15 to line 12, column 22 in colon_greater_argument_error
---*)
