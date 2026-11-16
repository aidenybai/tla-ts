(*---
description: "\\E visits the normalized order, so an error on a smaller element beats a larger witness."
ref: "tlc2/tool/impl/Tool.java#OPCODE_be"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE exists_error_on_smaller_element_first ----
EXTENDS Integers
Test == \E x \in {2, 1} : IF x = 2 THEN TRUE ELSE 1 \div 0 = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module exists_error_on_smaller_element_first failed.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in exists_error_on_smaller_element_first
    1. Line 11, column 29 to line 11, column 32 in exists_error_on_smaller_element_first
    2. Line 9, column 9 to line 9, column 62 in exists_error_on_smaller_element_first
    3. Line 9, column 27 to line 9, column 62 in exists_error_on_smaller_element_first
    4. Line 9, column 51 to line 9, column 62 in exists_error_on_smaller_element_first
    5. Line 9, column 51 to line 9, column 58 in exists_error_on_smaller_element_first
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in exists_error_on_smaller_element_first
    1. Line 12, column 30 to line 12, column 33 in exists_error_on_smaller_element_first
    2. Line 9, column 9 to line 9, column 62 in exists_error_on_smaller_element_first
    3. Line 9, column 27 to line 9, column 62 in exists_error_on_smaller_element_first
    4. Line 9, column 51 to line 9, column 62 in exists_error_on_smaller_element_first
    5. Line 9, column 51 to line 9, column 58 in exists_error_on_smaller_element_first
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in exists_error_on_smaller_element_first
    1. Line 13, column 8 to line 13, column 32 in exists_error_on_smaller_element_first
    2. Line 13, column 29 to line 13, column 32 in exists_error_on_smaller_element_first
    3. Line 9, column 9 to line 9, column 62 in exists_error_on_smaller_element_first
    4. Line 9, column 27 to line 9, column 62 in exists_error_on_smaller_element_first
    5. Line 9, column 51 to line 9, column 62 in exists_error_on_smaller_element_first
    6. Line 9, column 51 to line 9, column 58 in exists_error_on_smaller_element_first
property:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in exists_error_on_smaller_element_first
    1. Line 12, column 12 to line 12, column 36 in exists_error_on_smaller_element_first
    2. Line 12, column 33 to line 12, column 36 in exists_error_on_smaller_element_first
    3. Line 9, column 9 to line 9, column 62 in exists_error_on_smaller_element_first
    4. Line 9, column 27 to line 9, column 62 in exists_error_on_smaller_element_first
    5. Line 9, column 51 to line 9, column 62 in exists_error_on_smaller_element_first
    6. Line 9, column 51 to line 9, column 58 in exists_error_on_smaller_element_first
---*)
