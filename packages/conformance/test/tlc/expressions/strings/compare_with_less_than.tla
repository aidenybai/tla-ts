(*---
description: "< does not order strings."
ref: "tlc2/module/Integers.java#LT"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE compare_with_less_than ----
EXTENDS Integers
Test == "a" < "b"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module compare_with_less_than failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    "a"
init:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of < should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in compare_with_less_than
    1. Line 11, column 29 to line 11, column 32 in compare_with_less_than
    2. Line 9, column 9 to line 9, column 17 in compare_with_less_than
next:
  exit: 255
  transcript: |-
    2266:1 The first argument of < should be an integer, but instead it is:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in compare_with_less_than
    1. Line 12, column 30 to line 12, column 33 in compare_with_less_than
    2. Line 9, column 9 to line 9, column 17 in compare_with_less_than
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of < should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in compare_with_less_than
    1. Line 13, column 8 to line 13, column 32 in compare_with_less_than
    2. Line 13, column 29 to line 13, column 32 in compare_with_less_than
    3. Line 9, column 9 to line 9, column 17 in compare_with_less_than
property:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of < should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in compare_with_less_than
    1. Line 12, column 12 to line 12, column 36 in compare_with_less_than
    2. Line 12, column 33 to line 12, column 36 in compare_with_less_than
    3. Line 9, column 9 to line 9, column 17 in compare_with_less_than
---*)
