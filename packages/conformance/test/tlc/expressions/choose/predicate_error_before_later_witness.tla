(*---
description: "CHOOSE runs the predicate on smaller elements first, so an error there beats a larger witness."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE predicate_error_before_later_witness ----
EXTENDS Integers
Test == (CHOOSE x \in {2, 1} : 2 \div (x - 1) = 2) = 2
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
    0. Line 11, column 9 to line 11, column 32 in predicate_error_before_later_witness
    1. Line 11, column 29 to line 11, column 32 in predicate_error_before_later_witness
    2. Line 9, column 9 to line 9, column 54 in predicate_error_before_later_witness
    3. Line 9, column 10 to line 9, column 49 in predicate_error_before_later_witness
    4. Line 9, column 32 to line 9, column 49 in predicate_error_before_later_witness
    5. Line 9, column 32 to line 9, column 45 in predicate_error_before_later_witness
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in predicate_error_before_later_witness
    1. Line 12, column 30 to line 12, column 33 in predicate_error_before_later_witness
    2. Line 9, column 9 to line 9, column 54 in predicate_error_before_later_witness
    3. Line 9, column 10 to line 9, column 49 in predicate_error_before_later_witness
    4. Line 9, column 32 to line 9, column 49 in predicate_error_before_later_witness
    5. Line 9, column 32 to line 9, column 45 in predicate_error_before_later_witness
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in predicate_error_before_later_witness
    1. Line 13, column 8 to line 13, column 32 in predicate_error_before_later_witness
    2. Line 13, column 29 to line 13, column 32 in predicate_error_before_later_witness
    3. Line 9, column 9 to line 9, column 54 in predicate_error_before_later_witness
    4. Line 9, column 10 to line 9, column 49 in predicate_error_before_later_witness
    5. Line 9, column 32 to line 9, column 49 in predicate_error_before_later_witness
    6. Line 9, column 32 to line 9, column 45 in predicate_error_before_later_witness
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in predicate_error_before_later_witness
    1. Line 12, column 12 to line 12, column 36 in predicate_error_before_later_witness
    2. Line 12, column 33 to line 12, column 36 in predicate_error_before_later_witness
    3. Line 9, column 9 to line 9, column 54 in predicate_error_before_later_witness
    4. Line 9, column 10 to line 9, column 49 in predicate_error_before_later_witness
    5. Line 9, column 32 to line 9, column 49 in predicate_error_before_later_witness
    6. Line 9, column 32 to line 9, column 45 in predicate_error_before_later_witness
---*)
