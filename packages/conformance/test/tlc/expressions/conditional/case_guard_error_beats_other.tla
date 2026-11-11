(*---
description: "An error in a guard surfaces even when OTHER could have been taken."
ref: "tlc2/tool/impl/Tool.java#OPCODE_case"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE case_guard_error_beats_other ----
EXTENDS Integers
Test == CASE 1 \div 0 = 0 -> TRUE [] OTHER -> TRUE
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module case_guard_error_beats_other failed.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in case_guard_error_beats_other
    1. Line 11, column 29 to line 11, column 32 in case_guard_error_beats_other
    2. Line 9, column 9 to line 9, column 50 in case_guard_error_beats_other
    3. Line 9, column 14 to line 9, column 25 in case_guard_error_beats_other
    4. Line 9, column 14 to line 9, column 21 in case_guard_error_beats_other
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in case_guard_error_beats_other
    1. Line 12, column 30 to line 12, column 33 in case_guard_error_beats_other
    2. Line 9, column 9 to line 9, column 50 in case_guard_error_beats_other
    3. Line 9, column 14 to line 9, column 25 in case_guard_error_beats_other
    4. Line 9, column 14 to line 9, column 21 in case_guard_error_beats_other
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in case_guard_error_beats_other
    1. Line 13, column 8 to line 13, column 32 in case_guard_error_beats_other
    2. Line 13, column 29 to line 13, column 32 in case_guard_error_beats_other
    3. Line 9, column 9 to line 9, column 50 in case_guard_error_beats_other
    4. Line 9, column 14 to line 9, column 25 in case_guard_error_beats_other
    5. Line 9, column 14 to line 9, column 21 in case_guard_error_beats_other
property:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in case_guard_error_beats_other
    1. Line 12, column 12 to line 12, column 36 in case_guard_error_beats_other
    2. Line 12, column 33 to line 12, column 36 in case_guard_error_beats_other
    3. Line 9, column 9 to line 9, column 50 in case_guard_error_beats_other
    4. Line 9, column 14 to line 9, column 25 in case_guard_error_beats_other
    5. Line 9, column 14 to line 9, column 21 in case_guard_error_beats_other
---*)
