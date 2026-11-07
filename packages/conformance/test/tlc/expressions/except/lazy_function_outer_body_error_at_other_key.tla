(*---
description: "EXCEPT does not run the body for other keys, but a later application does."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE lazy_function_outer_body_error_at_other_key ----
EXTENDS Integers
Test == [[x \in Nat |-> IF x = 1 THEN 0 ELSE 1 \div 0] EXCEPT ![1] = 5][2] = 0
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
    0. Line 11, column 9 to line 11, column 32 in lazy_function_outer_body_error_at_other_key
    1. Line 11, column 29 to line 11, column 32 in lazy_function_outer_body_error_at_other_key
    2. Line 9, column 9 to line 9, column 78 in lazy_function_outer_body_error_at_other_key
    3. Line 9, column 9 to line 9, column 74 in lazy_function_outer_body_error_at_other_key
    4. Line 9, column 25 to line 9, column 53 in lazy_function_outer_body_error_at_other_key
    5. Line 9, column 46 to line 9, column 53 in lazy_function_outer_body_error_at_other_key
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in lazy_function_outer_body_error_at_other_key
    1. Line 12, column 30 to line 12, column 33 in lazy_function_outer_body_error_at_other_key
    2. Line 9, column 9 to line 9, column 78 in lazy_function_outer_body_error_at_other_key
    3. Line 9, column 9 to line 9, column 74 in lazy_function_outer_body_error_at_other_key
    4. Line 9, column 25 to line 9, column 53 in lazy_function_outer_body_error_at_other_key
    5. Line 9, column 46 to line 9, column 53 in lazy_function_outer_body_error_at_other_key
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_function_outer_body_error_at_other_key
    1. Line 13, column 8 to line 13, column 32 in lazy_function_outer_body_error_at_other_key
    2. Line 13, column 29 to line 13, column 32 in lazy_function_outer_body_error_at_other_key
    3. Line 9, column 9 to line 9, column 78 in lazy_function_outer_body_error_at_other_key
    4. Line 9, column 9 to line 9, column 74 in lazy_function_outer_body_error_at_other_key
    5. Line 9, column 25 to line 9, column 53 in lazy_function_outer_body_error_at_other_key
    6. Line 9, column 46 to line 9, column 53 in lazy_function_outer_body_error_at_other_key
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_function_outer_body_error_at_other_key
    1. Line 12, column 12 to line 12, column 36 in lazy_function_outer_body_error_at_other_key
    2. Line 12, column 33 to line 12, column 36 in lazy_function_outer_body_error_at_other_key
    3. Line 9, column 9 to line 9, column 78 in lazy_function_outer_body_error_at_other_key
    4. Line 9, column 9 to line 9, column 74 in lazy_function_outer_body_error_at_other_key
    5. Line 9, column 25 to line 9, column 53 in lazy_function_outer_body_error_at_other_key
    6. Line 9, column 46 to line 9, column 53 in lazy_function_outer_body_error_at_other_key
---*)
