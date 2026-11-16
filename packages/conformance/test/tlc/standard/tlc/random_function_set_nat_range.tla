(*---
description: A function set into Nat fails picking a value from Nat.
ref: tlc2/module/TLC.java#RandomElement
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE random_function_set_nat_range ----
EXTENDS TLC, Naturals
Test == RandomElement([{1} -> Nat]) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module random_function_set_nat_range failed.
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    Nat
init:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in random_function_set_nat_range
    1. Line 14, column 29 to line 14, column 32 in random_function_set_nat_range
    2. Line 12, column 9 to line 12, column 39 in random_function_set_nat_range
    3. Line 12, column 9 to line 12, column 35 in random_function_set_nat_range
next:
  exit: 255
  transcript: |-
    2176:1 Applying RandomElement to the following value,
    which is not a finite set:
    Nat
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in random_function_set_nat_range
    1. Line 15, column 30 to line 15, column 33 in random_function_set_nat_range
    2. Line 12, column 9 to line 12, column 39 in random_function_set_nat_range
    3. Line 12, column 9 to line 12, column 35 in random_function_set_nat_range
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in random_function_set_nat_range
    1. Line 16, column 8 to line 16, column 32 in random_function_set_nat_range
    2. Line 16, column 29 to line 16, column 32 in random_function_set_nat_range
    3. Line 12, column 9 to line 12, column 39 in random_function_set_nat_range
    4. Line 12, column 9 to line 12, column 35 in random_function_set_nat_range
property:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in random_function_set_nat_range
    1. Line 15, column 12 to line 15, column 36 in random_function_set_nat_range
    2. Line 15, column 33 to line 15, column 36 in random_function_set_nat_range
    3. Line 12, column 9 to line 12, column 39 in random_function_set_nat_range
    4. Line 12, column 9 to line 12, column 35 in random_function_set_nat_range
---*)
