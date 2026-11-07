(*---
description: "A conjunction list evaluates in order, so a division by zero wins over a later non-Boolean bullet."
ref: "tlc2/tool/impl/Tool.java#OPCODE_cl"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE conj_list_error_before_non_boolean ----
EXTENDS Integers
Test ==
  /\ 1 \div 0 = 0
  /\ 7
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
    0. Line 13, column 9 to line 13, column 32 in conj_list_error_before_non_boolean
    1. Line 13, column 29 to line 13, column 32 in conj_list_error_before_non_boolean
    2. Line 10, column 3 to line 11, column 6 in conj_list_error_before_non_boolean
    3. Line 10, column 6 to line 10, column 17 in conj_list_error_before_non_boolean
    4. Line 10, column 6 to line 10, column 13 in conj_list_error_before_non_boolean
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 33 in conj_list_error_before_non_boolean
    1. Line 14, column 30 to line 14, column 33 in conj_list_error_before_non_boolean
    2. Line 10, column 3 to line 11, column 6 in conj_list_error_before_non_boolean
    3. Line 10, column 6 to line 10, column 17 in conj_list_error_before_non_boolean
    4. Line 10, column 6 to line 10, column 13 in conj_list_error_before_non_boolean
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 32 in conj_list_error_before_non_boolean
    1. Line 15, column 8 to line 15, column 32 in conj_list_error_before_non_boolean
    2. Line 15, column 29 to line 15, column 32 in conj_list_error_before_non_boolean
    3. Line 10, column 3 to line 11, column 6 in conj_list_error_before_non_boolean
    4. Line 10, column 6 to line 10, column 17 in conj_list_error_before_non_boolean
    5. Line 10, column 6 to line 10, column 13 in conj_list_error_before_non_boolean
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 32 in conj_list_error_before_non_boolean
    1. Line 14, column 12 to line 14, column 36 in conj_list_error_before_non_boolean
    2. Line 14, column 33 to line 14, column 36 in conj_list_error_before_non_boolean
    3. Line 10, column 3 to line 11, column 6 in conj_list_error_before_non_boolean
    4. Line 10, column 6 to line 10, column 17 in conj_list_error_before_non_boolean
    5. Line 10, column 6 to line 10, column 13 in conj_list_error_before_non_boolean
---*)
