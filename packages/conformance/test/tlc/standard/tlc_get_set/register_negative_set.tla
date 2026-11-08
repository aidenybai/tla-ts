(*---
description: TLCSet with a negative index names its first argument.
ref: tlc2/module/TLCGetSet.java#TLCSet
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE register_negative_set ----
EXTENDS TLC, Integers
Test == TLCSet(-1, 0)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module register_negative_set failed.
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    -1
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in register_negative_set
    1. Line 14, column 29 to line 14, column 32 in register_negative_set
    2. Line 12, column 9 to line 12, column 21 in register_negative_set
next:
  exit: 255
  transcript: |-
    2169:1 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    -1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in register_negative_set
    1. Line 15, column 30 to line 15, column 33 in register_negative_set
    2. Line 12, column 9 to line 12, column 21 in register_negative_set
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in register_negative_set
    1. Line 16, column 8 to line 16, column 32 in register_negative_set
    2. Line 16, column 29 to line 16, column 32 in register_negative_set
    3. Line 12, column 9 to line 12, column 21 in register_negative_set
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in register_negative_set
    1. Line 15, column 12 to line 15, column 36 in register_negative_set
    2. Line 15, column 33 to line 15, column 36 in register_negative_set
    3. Line 12, column 9 to line 12, column 21 in register_negative_set
---*)
