(*---
description: "0^0 is an error rather than 1."
ref: "tlc2/module/Naturals.java#Expt"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE zero_to_zero ----
EXTENDS Integers
Test == 0 ^ 0 = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module zero_to_zero failed.
    2180:0 0^0 is undefined.
init:
  exit: 75
  transcript: |-
    1000:1 
    2180:0 0^0 is undefined.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in zero_to_zero
    1. Line 11, column 29 to line 11, column 32 in zero_to_zero
    2. Line 9, column 9 to line 9, column 17 in zero_to_zero
    3. Line 9, column 9 to line 9, column 13 in zero_to_zero
next:
  exit: 255
  transcript: |-
    2180:1 0^0 is undefined.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in zero_to_zero
    1. Line 12, column 30 to line 12, column 33 in zero_to_zero
    2. Line 9, column 9 to line 9, column 17 in zero_to_zero
    3. Line 9, column 9 to line 9, column 13 in zero_to_zero
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2180:0 0^0 is undefined.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in zero_to_zero
    1. Line 13, column 8 to line 13, column 32 in zero_to_zero
    2. Line 13, column 29 to line 13, column 32 in zero_to_zero
    3. Line 9, column 9 to line 9, column 17 in zero_to_zero
    4. Line 9, column 9 to line 9, column 13 in zero_to_zero
property:
  exit: 75
  transcript: |-
    1000:1 
    2180:0 0^0 is undefined.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in zero_to_zero
    1. Line 12, column 12 to line 12, column 36 in zero_to_zero
    2. Line 12, column 33 to line 12, column 36 in zero_to_zero
    3. Line 9, column 9 to line 9, column 17 in zero_to_zero
    4. Line 9, column 9 to line 9, column 13 in zero_to_zero
---*)
