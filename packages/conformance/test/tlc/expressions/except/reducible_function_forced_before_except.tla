(*---
description: "EXCEPT does not keep its base lazy, so a function over an interval runs every body first."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE reducible_function_forced_before_except ----
EXTENDS Integers
Test == [[x \in 1..2 |-> 1 \div 0] EXCEPT ![1] = 0][1] = 0
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
    0. Line 11, column 9 to line 11, column 32 in reducible_function_forced_before_except
    1. Line 11, column 29 to line 11, column 32 in reducible_function_forced_before_except
    2. Line 9, column 9 to line 9, column 58 in reducible_function_forced_before_except
    3. Line 9, column 9 to line 9, column 54 in reducible_function_forced_before_except
    4. Line 9, column 9 to line 9, column 51 in reducible_function_forced_before_except
    5. Line 9, column 26 to line 9, column 33 in reducible_function_forced_before_except
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in reducible_function_forced_before_except
    1. Line 12, column 30 to line 12, column 33 in reducible_function_forced_before_except
    2. Line 9, column 9 to line 9, column 58 in reducible_function_forced_before_except
    3. Line 9, column 9 to line 9, column 54 in reducible_function_forced_before_except
    4. Line 9, column 9 to line 9, column 51 in reducible_function_forced_before_except
    5. Line 9, column 26 to line 9, column 33 in reducible_function_forced_before_except
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in reducible_function_forced_before_except
    1. Line 13, column 8 to line 13, column 32 in reducible_function_forced_before_except
    2. Line 13, column 29 to line 13, column 32 in reducible_function_forced_before_except
    3. Line 9, column 9 to line 9, column 58 in reducible_function_forced_before_except
    4. Line 9, column 9 to line 9, column 54 in reducible_function_forced_before_except
    5. Line 9, column 9 to line 9, column 51 in reducible_function_forced_before_except
    6. Line 9, column 26 to line 9, column 33 in reducible_function_forced_before_except
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in reducible_function_forced_before_except
    1. Line 12, column 12 to line 12, column 36 in reducible_function_forced_before_except
    2. Line 12, column 33 to line 12, column 36 in reducible_function_forced_before_except
    3. Line 9, column 9 to line 9, column 58 in reducible_function_forced_before_except
    4. Line 9, column 9 to line 9, column 54 in reducible_function_forced_before_except
    5. Line 9, column 9 to line 9, column 51 in reducible_function_forced_before_except
    6. Line 9, column 26 to line 9, column 33 in reducible_function_forced_before_except
---*)
