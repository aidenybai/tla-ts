(*---
description: "TLC evaluates every bound first, so an error in a later bound surfaces even when an earlier one is empty."
ref: "tlc2/tool/impl/Tool.java#contexts"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE later_bound_error_after_empty ----
EXTENDS Integers
Test == \A x \in {}, y \in 1 \div 0 .. 1 : TRUE
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module later_bound_error_after_empty failed.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in later_bound_error_after_empty
    1. Line 11, column 29 to line 11, column 32 in later_bound_error_after_empty
    2. Line 9, column 9 to line 9, column 47 in later_bound_error_after_empty
    3. Line 9, column 28 to line 9, column 40 in later_bound_error_after_empty
    4. Line 9, column 28 to line 9, column 35 in later_bound_error_after_empty
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in later_bound_error_after_empty
    1. Line 12, column 30 to line 12, column 33 in later_bound_error_after_empty
    2. Line 9, column 9 to line 9, column 47 in later_bound_error_after_empty
    3. Line 9, column 28 to line 9, column 40 in later_bound_error_after_empty
    4. Line 9, column 28 to line 9, column 35 in later_bound_error_after_empty
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in later_bound_error_after_empty
    1. Line 13, column 8 to line 13, column 32 in later_bound_error_after_empty
    2. Line 13, column 29 to line 13, column 32 in later_bound_error_after_empty
    3. Line 9, column 9 to line 9, column 47 in later_bound_error_after_empty
    4. Line 9, column 28 to line 9, column 40 in later_bound_error_after_empty
    5. Line 9, column 28 to line 9, column 35 in later_bound_error_after_empty
property:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in later_bound_error_after_empty
    1. Line 12, column 12 to line 12, column 36 in later_bound_error_after_empty
    2. Line 12, column 33 to line 12, column 36 in later_bound_error_after_empty
    3. Line 9, column 9 to line 9, column 47 in later_bound_error_after_empty
    4. Line 9, column 28 to line 9, column 40 in later_bound_error_after_empty
    5. Line 9, column 28 to line 9, column 35 in later_bound_error_after_empty
---*)
