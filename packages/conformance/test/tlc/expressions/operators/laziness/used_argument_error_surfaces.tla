(*---
description: "An argument the body reaches is evaluated, and its error surfaces."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE used_argument_error_surfaces ----
EXTENDS Integers
F(a) == a + 1
Test == F(1 \div 0) = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 11 of module used_argument_error_surfaces failed.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in used_argument_error_surfaces
    1. Line 12, column 29 to line 12, column 32 in used_argument_error_surfaces
    2. Line 10, column 9 to line 10, column 23 in used_argument_error_surfaces
    3. Line 10, column 9 to line 10, column 19 in used_argument_error_surfaces
    4. Line 9, column 9 to line 9, column 13 in used_argument_error_surfaces
    5. Line 9, column 9 to line 9, column 9 in used_argument_error_surfaces
    6. Line 10, column 11 to line 10, column 18 in used_argument_error_surfaces
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 33 in used_argument_error_surfaces
    1. Line 13, column 30 to line 13, column 33 in used_argument_error_surfaces
    2. Line 10, column 9 to line 10, column 23 in used_argument_error_surfaces
    3. Line 10, column 9 to line 10, column 19 in used_argument_error_surfaces
    4. Line 9, column 9 to line 9, column 13 in used_argument_error_surfaces
    5. Line 9, column 9 to line 9, column 9 in used_argument_error_surfaces
    6. Line 10, column 11 to line 10, column 18 in used_argument_error_surfaces
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in used_argument_error_surfaces
    1. Line 14, column 8 to line 14, column 32 in used_argument_error_surfaces
    2. Line 14, column 29 to line 14, column 32 in used_argument_error_surfaces
    3. Line 10, column 9 to line 10, column 23 in used_argument_error_surfaces
    4. Line 10, column 9 to line 10, column 19 in used_argument_error_surfaces
    5. Line 9, column 9 to line 9, column 13 in used_argument_error_surfaces
    6. Line 9, column 9 to line 9, column 9 in used_argument_error_surfaces
    7. Line 10, column 11 to line 10, column 18 in used_argument_error_surfaces
property:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in used_argument_error_surfaces
    1. Line 13, column 12 to line 13, column 36 in used_argument_error_surfaces
    2. Line 13, column 33 to line 13, column 36 in used_argument_error_surfaces
    3. Line 10, column 9 to line 10, column 23 in used_argument_error_surfaces
    4. Line 10, column 9 to line 10, column 19 in used_argument_error_surfaces
    5. Line 9, column 9 to line 9, column 13 in used_argument_error_surfaces
    6. Line 9, column 9 to line 9, column 9 in used_argument_error_surfaces
    7. Line 10, column 11 to line 10, column 18 in used_argument_error_surfaces
---*)
