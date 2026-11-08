(*---
description: "A filter over a Reducible set evaluates its predicate when it is built."
ref: "tlc2/tool/impl/Tool.java#OPCODE_sso"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE reducible_is_eager ----
EXTENDS Integers
Test == {x \in {0} : 1 \div x = 1} # {0}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module reducible_is_eager failed.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in reducible_is_eager
    1. Line 11, column 29 to line 11, column 32 in reducible_is_eager
    2. Line 9, column 9 to line 9, column 40 in reducible_is_eager
    3. Line 9, column 9 to line 9, column 34 in reducible_is_eager
    4. Line 9, column 22 to line 9, column 33 in reducible_is_eager
    5. Line 9, column 22 to line 9, column 29 in reducible_is_eager
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in reducible_is_eager
    1. Line 12, column 30 to line 12, column 33 in reducible_is_eager
    2. Line 9, column 9 to line 9, column 40 in reducible_is_eager
    3. Line 9, column 9 to line 9, column 34 in reducible_is_eager
    4. Line 9, column 22 to line 9, column 33 in reducible_is_eager
    5. Line 9, column 22 to line 9, column 29 in reducible_is_eager
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in reducible_is_eager
    1. Line 13, column 8 to line 13, column 32 in reducible_is_eager
    2. Line 13, column 29 to line 13, column 32 in reducible_is_eager
    3. Line 9, column 9 to line 9, column 40 in reducible_is_eager
    4. Line 9, column 9 to line 9, column 34 in reducible_is_eager
    5. Line 9, column 22 to line 9, column 33 in reducible_is_eager
    6. Line 9, column 22 to line 9, column 29 in reducible_is_eager
property:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in reducible_is_eager
    1. Line 12, column 12 to line 12, column 36 in reducible_is_eager
    2. Line 12, column 33 to line 12, column 36 in reducible_is_eager
    3. Line 9, column 9 to line 9, column 40 in reducible_is_eager
    4. Line 9, column 9 to line 9, column 34 in reducible_is_eager
    5. Line 9, column 22 to line 9, column 33 in reducible_is_eager
    6. Line 9, column 22 to line 9, column 29 in reducible_is_eager
---*)
