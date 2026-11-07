(*---
description: "A set map evaluates its body eagerly for every binding."
ref: "tlc2/tool/impl/Tool.java#OPCODE_soa"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE body_error_on_first_binding ----
EXTENDS Integers
Test == {1 \div x : x \in {0, 1}} # {}
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
    0. Line 11, column 9 to line 11, column 32 in body_error_on_first_binding
    1. Line 11, column 29 to line 11, column 32 in body_error_on_first_binding
    2. Line 9, column 9 to line 9, column 38 in body_error_on_first_binding
    3. Line 9, column 9 to line 9, column 33 in body_error_on_first_binding
    4. Line 9, column 10 to line 9, column 17 in body_error_on_first_binding
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in body_error_on_first_binding
    1. Line 12, column 30 to line 12, column 33 in body_error_on_first_binding
    2. Line 9, column 9 to line 9, column 38 in body_error_on_first_binding
    3. Line 9, column 9 to line 9, column 33 in body_error_on_first_binding
    4. Line 9, column 10 to line 9, column 17 in body_error_on_first_binding
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in body_error_on_first_binding
    1. Line 13, column 8 to line 13, column 32 in body_error_on_first_binding
    2. Line 13, column 29 to line 13, column 32 in body_error_on_first_binding
    3. Line 9, column 9 to line 9, column 38 in body_error_on_first_binding
    4. Line 9, column 9 to line 9, column 33 in body_error_on_first_binding
    5. Line 9, column 10 to line 9, column 17 in body_error_on_first_binding
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in body_error_on_first_binding
    1. Line 12, column 12 to line 12, column 36 in body_error_on_first_binding
    2. Line 12, column 33 to line 12, column 36 in body_error_on_first_binding
    3. Line 9, column 9 to line 9, column 38 in body_error_on_first_binding
    4. Line 9, column 9 to line 9, column 33 in body_error_on_first_binding
    5. Line 9, column 10 to line 9, column 17 in body_error_on_first_binding
---*)
