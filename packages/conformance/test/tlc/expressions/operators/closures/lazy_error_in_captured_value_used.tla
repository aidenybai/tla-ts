(*---
description: "A LET value that fails surfaces on the argument that uses it."
ref: "tlc2/value/impl/LazyValue.java"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE lazy_error_in_captured_value_used ----
EXTENDS Integers
Test == LET k == 1 \div 0 IN [y \in Nat |-> IF y = 0 THEN 0 ELSE k][1] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module lazy_error_in_captured_value_used failed.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_error_in_captured_value_used
    1. Line 11, column 29 to line 11, column 32 in lazy_error_in_captured_value_used
    2. Line 9, column 9 to line 9, column 74 in lazy_error_in_captured_value_used
    3. Line 9, column 30 to line 9, column 74 in lazy_error_in_captured_value_used
    4. Line 9, column 30 to line 9, column 70 in lazy_error_in_captured_value_used
    5. Line 9, column 45 to line 9, column 66 in lazy_error_in_captured_value_used
    6. Line 9, column 66 to line 9, column 66 in lazy_error_in_captured_value_used
    7. Line 9, column 18 to line 9, column 25 in lazy_error_in_captured_value_used
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in lazy_error_in_captured_value_used
    1. Line 12, column 30 to line 12, column 33 in lazy_error_in_captured_value_used
    2. Line 9, column 9 to line 9, column 74 in lazy_error_in_captured_value_used
    3. Line 9, column 30 to line 9, column 74 in lazy_error_in_captured_value_used
    4. Line 9, column 30 to line 9, column 70 in lazy_error_in_captured_value_used
    5. Line 9, column 45 to line 9, column 66 in lazy_error_in_captured_value_used
    6. Line 9, column 66 to line 9, column 66 in lazy_error_in_captured_value_used
    7. Line 9, column 18 to line 9, column 25 in lazy_error_in_captured_value_used
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_error_in_captured_value_used
    1. Line 13, column 8 to line 13, column 32 in lazy_error_in_captured_value_used
    2. Line 13, column 29 to line 13, column 32 in lazy_error_in_captured_value_used
    3. Line 9, column 9 to line 9, column 74 in lazy_error_in_captured_value_used
    4. Line 9, column 30 to line 9, column 74 in lazy_error_in_captured_value_used
    5. Line 9, column 30 to line 9, column 70 in lazy_error_in_captured_value_used
    6. Line 9, column 45 to line 9, column 66 in lazy_error_in_captured_value_used
    7. Line 9, column 66 to line 9, column 66 in lazy_error_in_captured_value_used
    8. Line 9, column 18 to line 9, column 25 in lazy_error_in_captured_value_used
property:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_error_in_captured_value_used
    1. Line 12, column 12 to line 12, column 36 in lazy_error_in_captured_value_used
    2. Line 12, column 33 to line 12, column 36 in lazy_error_in_captured_value_used
    3. Line 9, column 9 to line 9, column 74 in lazy_error_in_captured_value_used
    4. Line 9, column 30 to line 9, column 74 in lazy_error_in_captured_value_used
    5. Line 9, column 30 to line 9, column 70 in lazy_error_in_captured_value_used
    6. Line 9, column 45 to line 9, column 66 in lazy_error_in_captured_value_used
    7. Line 9, column 66 to line 9, column 66 in lazy_error_in_captured_value_used
    8. Line 9, column 18 to line 9, column 25 in lazy_error_in_captured_value_used
---*)
