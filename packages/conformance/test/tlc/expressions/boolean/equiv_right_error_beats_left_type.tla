(*---
description: "P <=> Q evaluates Q before checking that P is a Boolean, so an error in Q wins over a non-Boolean P."
ref: "tlc2/tool/impl/Tool.java#OPCODE_equiv"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE equiv_right_error_beats_left_type ----
EXTENDS Integers
Test == 7 <=> 1 \div 0 = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module equiv_right_error_beats_left_type failed.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in equiv_right_error_beats_left_type
    1. Line 11, column 29 to line 11, column 32 in equiv_right_error_beats_left_type
    2. Line 9, column 9 to line 9, column 26 in equiv_right_error_beats_left_type
    3. Line 9, column 15 to line 9, column 26 in equiv_right_error_beats_left_type
    4. Line 9, column 15 to line 9, column 22 in equiv_right_error_beats_left_type
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in equiv_right_error_beats_left_type
    1. Line 12, column 30 to line 12, column 33 in equiv_right_error_beats_left_type
    2. Line 9, column 9 to line 9, column 26 in equiv_right_error_beats_left_type
    3. Line 9, column 15 to line 9, column 26 in equiv_right_error_beats_left_type
    4. Line 9, column 15 to line 9, column 22 in equiv_right_error_beats_left_type
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in equiv_right_error_beats_left_type
    1. Line 13, column 8 to line 13, column 32 in equiv_right_error_beats_left_type
    2. Line 13, column 29 to line 13, column 32 in equiv_right_error_beats_left_type
    3. Line 9, column 9 to line 9, column 26 in equiv_right_error_beats_left_type
    4. Line 9, column 15 to line 9, column 26 in equiv_right_error_beats_left_type
    5. Line 9, column 15 to line 9, column 22 in equiv_right_error_beats_left_type
property:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in equiv_right_error_beats_left_type
    1. Line 12, column 12 to line 12, column 36 in equiv_right_error_beats_left_type
    2. Line 12, column 33 to line 12, column 36 in equiv_right_error_beats_left_type
    3. Line 9, column 9 to line 9, column 26 in equiv_right_error_beats_left_type
    4. Line 9, column 15 to line 9, column 26 in equiv_right_error_beats_left_type
    5. Line 9, column 15 to line 9, column 22 in equiv_right_error_beats_left_type
---*)
