(*---
description: "A non-integer second operand of > is reported as the second argument."
ref: "tlc2/module/Integers.java#GT"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE gt_second_argument ----
EXTENDS Integers
Test == 1 > "a"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module gt_second_argument failed.
    2266:0 The second argument of > should be an integer, but instead it is:
    "a"
init:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The second argument of > should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in gt_second_argument
    1. Line 11, column 29 to line 11, column 32 in gt_second_argument
    2. Line 9, column 9 to line 9, column 15 in gt_second_argument
next:
  exit: 255
  transcript: |-
    2266:1 The second argument of > should be an integer, but instead it is:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in gt_second_argument
    1. Line 12, column 30 to line 12, column 33 in gt_second_argument
    2. Line 9, column 9 to line 9, column 15 in gt_second_argument
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The second argument of > should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in gt_second_argument
    1. Line 13, column 8 to line 13, column 32 in gt_second_argument
    2. Line 13, column 29 to line 13, column 32 in gt_second_argument
    3. Line 9, column 9 to line 9, column 15 in gt_second_argument
property:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The second argument of > should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in gt_second_argument
    1. Line 12, column 12 to line 12, column 36 in gt_second_argument
    2. Line 12, column 33 to line 12, column 36 in gt_second_argument
    3. Line 9, column 9 to line 9, column 15 in gt_second_argument
---*)
