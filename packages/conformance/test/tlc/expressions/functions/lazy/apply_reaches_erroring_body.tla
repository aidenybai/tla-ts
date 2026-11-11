(*---
description: "A lazy application still evaluates the body for the argument it applies to."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE apply_reaches_erroring_body ----
EXTENDS Integers
Test == [x \in 1..2 |-> IF x = 1 THEN 7 ELSE 1 \div 0][2] = 7
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module apply_reaches_erroring_body failed.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in apply_reaches_erroring_body
    1. Line 11, column 29 to line 11, column 32 in apply_reaches_erroring_body
    2. Line 9, column 9 to line 9, column 61 in apply_reaches_erroring_body
    3. Line 9, column 9 to line 9, column 57 in apply_reaches_erroring_body
    4. Line 9, column 25 to line 9, column 53 in apply_reaches_erroring_body
    5. Line 9, column 46 to line 9, column 53 in apply_reaches_erroring_body
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in apply_reaches_erroring_body
    1. Line 12, column 30 to line 12, column 33 in apply_reaches_erroring_body
    2. Line 9, column 9 to line 9, column 61 in apply_reaches_erroring_body
    3. Line 9, column 9 to line 9, column 57 in apply_reaches_erroring_body
    4. Line 9, column 25 to line 9, column 53 in apply_reaches_erroring_body
    5. Line 9, column 46 to line 9, column 53 in apply_reaches_erroring_body
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in apply_reaches_erroring_body
    1. Line 13, column 8 to line 13, column 32 in apply_reaches_erroring_body
    2. Line 13, column 29 to line 13, column 32 in apply_reaches_erroring_body
    3. Line 9, column 9 to line 9, column 61 in apply_reaches_erroring_body
    4. Line 9, column 9 to line 9, column 57 in apply_reaches_erroring_body
    5. Line 9, column 25 to line 9, column 53 in apply_reaches_erroring_body
    6. Line 9, column 46 to line 9, column 53 in apply_reaches_erroring_body
property:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in apply_reaches_erroring_body
    1. Line 12, column 12 to line 12, column 36 in apply_reaches_erroring_body
    2. Line 12, column 33 to line 12, column 36 in apply_reaches_erroring_body
    3. Line 9, column 9 to line 9, column 61 in apply_reaches_erroring_body
    4. Line 9, column 9 to line 9, column 57 in apply_reaches_erroring_body
    5. Line 9, column 25 to line 9, column 53 in apply_reaches_erroring_body
    6. Line 9, column 46 to line 9, column 53 in apply_reaches_erroring_body
---*)
