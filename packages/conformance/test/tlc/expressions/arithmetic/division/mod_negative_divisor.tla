(*---
description: "A negative divisor of % is an argument error."
ref: "tlc2/module/Naturals.java#Mod"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE mod_negative_divisor ----
EXTENDS Integers
Test == 7 % -2 = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module mod_negative_divisor failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -2
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of % should be a positive number, but instead it is:
    -2
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in mod_negative_divisor
    1. Line 11, column 29 to line 11, column 32 in mod_negative_divisor
    2. Line 9, column 9 to line 9, column 18 in mod_negative_divisor
    3. Line 9, column 9 to line 9, column 14 in mod_negative_divisor
next:
  exit: 255
  transcript: |-
    2169:1 The second argument of % should be a positive number, but instead it is:
    -2
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in mod_negative_divisor
    1. Line 12, column 30 to line 12, column 33 in mod_negative_divisor
    2. Line 9, column 9 to line 9, column 18 in mod_negative_divisor
    3. Line 9, column 9 to line 9, column 14 in mod_negative_divisor
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of % should be a positive number, but instead it is:
    -2
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in mod_negative_divisor
    1. Line 13, column 8 to line 13, column 32 in mod_negative_divisor
    2. Line 13, column 29 to line 13, column 32 in mod_negative_divisor
    3. Line 9, column 9 to line 9, column 18 in mod_negative_divisor
    4. Line 9, column 9 to line 9, column 14 in mod_negative_divisor
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of % should be a positive number, but instead it is:
    -2
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in mod_negative_divisor
    1. Line 12, column 12 to line 12, column 36 in mod_negative_divisor
    2. Line 12, column 33 to line 12, column 36 in mod_negative_divisor
    3. Line 9, column 9 to line 9, column 18 in mod_negative_divisor
    4. Line 9, column 9 to line 9, column 14 in mod_negative_divisor
---*)
