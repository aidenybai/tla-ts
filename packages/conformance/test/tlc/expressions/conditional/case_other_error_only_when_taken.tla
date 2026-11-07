(*---
description: "An error in OTHER surfaces when CASE takes it."
ref: "tlc2/tool/impl/Tool.java#OPCODE_case"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE case_other_error_only_when_taken ----
EXTENDS Integers
Test == CASE FALSE -> TRUE [] OTHER -> 1 \div 0 = 0
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
    0. Line 11, column 9 to line 11, column 32 in case_other_error_only_when_taken
    1. Line 11, column 29 to line 11, column 32 in case_other_error_only_when_taken
    2. Line 9, column 9 to line 9, column 51 in case_other_error_only_when_taken
    3. Line 9, column 40 to line 9, column 51 in case_other_error_only_when_taken
    4. Line 9, column 40 to line 9, column 47 in case_other_error_only_when_taken
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in case_other_error_only_when_taken
    1. Line 12, column 30 to line 12, column 33 in case_other_error_only_when_taken
    2. Line 9, column 9 to line 9, column 51 in case_other_error_only_when_taken
    3. Line 9, column 40 to line 9, column 51 in case_other_error_only_when_taken
    4. Line 9, column 40 to line 9, column 47 in case_other_error_only_when_taken
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in case_other_error_only_when_taken
    1. Line 13, column 8 to line 13, column 32 in case_other_error_only_when_taken
    2. Line 13, column 29 to line 13, column 32 in case_other_error_only_when_taken
    3. Line 9, column 9 to line 9, column 51 in case_other_error_only_when_taken
    4. Line 9, column 40 to line 9, column 51 in case_other_error_only_when_taken
    5. Line 9, column 40 to line 9, column 47 in case_other_error_only_when_taken
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in case_other_error_only_when_taken
    1. Line 12, column 12 to line 12, column 36 in case_other_error_only_when_taken
    2. Line 12, column 33 to line 12, column 36 in case_other_error_only_when_taken
    3. Line 9, column 9 to line 9, column 51 in case_other_error_only_when_taken
    4. Line 9, column 40 to line 9, column 51 in case_other_error_only_when_taken
    5. Line 9, column 40 to line 9, column 47 in case_other_error_only_when_taken
---*)
