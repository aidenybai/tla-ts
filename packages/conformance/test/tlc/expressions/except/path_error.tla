(*---
description: "An error in a path expression surfaces before select."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE path_error ----
EXTENDS Integers
Test == [<<1>> EXCEPT ![1 \div 0] = 2] = <<1>>
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
    0. Line 11, column 9 to line 11, column 32 in path_error
    1. Line 11, column 29 to line 11, column 32 in path_error
    2. Line 9, column 9 to line 9, column 46 in path_error
    3. Line 9, column 9 to line 9, column 38 in path_error
    4. Line 9, column 25 to line 9, column 32 in path_error
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in path_error
    1. Line 12, column 30 to line 12, column 33 in path_error
    2. Line 9, column 9 to line 9, column 46 in path_error
    3. Line 9, column 9 to line 9, column 38 in path_error
    4. Line 9, column 25 to line 9, column 32 in path_error
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in path_error
    1. Line 13, column 8 to line 13, column 32 in path_error
    2. Line 13, column 29 to line 13, column 32 in path_error
    3. Line 9, column 9 to line 9, column 46 in path_error
    4. Line 9, column 9 to line 9, column 38 in path_error
    5. Line 9, column 25 to line 9, column 32 in path_error
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in path_error
    1. Line 12, column 12 to line 12, column 36 in path_error
    2. Line 12, column 33 to line 12, column 36 in path_error
    3. Line 9, column 9 to line 9, column 46 in path_error
    4. Line 9, column 9 to line 9, column 38 in path_error
    5. Line 9, column 25 to line 9, column 32 in path_error
---*)
