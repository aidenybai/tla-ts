(*---
description: 0^0 is undefined.
ref: tlc2/module/Integers.java#Expt
features:
  - Integers
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE expt_zero_zero ----
EXTENDS Integers
Test == 0 ^ 0 = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module expt_zero_zero failed.
    2180:0 0^0 is undefined.
init:
  exit: 75
  transcript: |-
    1000:1 
    2180:0 0^0 is undefined.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in expt_zero_zero
    1. Line 14, column 29 to line 14, column 32 in expt_zero_zero
    2. Line 12, column 9 to line 12, column 17 in expt_zero_zero
    3. Line 12, column 9 to line 12, column 13 in expt_zero_zero
next:
  exit: 255
  transcript: |-
    2180:1 0^0 is undefined.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in expt_zero_zero
    1. Line 15, column 30 to line 15, column 33 in expt_zero_zero
    2. Line 12, column 9 to line 12, column 17 in expt_zero_zero
    3. Line 12, column 9 to line 12, column 13 in expt_zero_zero
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2180:0 0^0 is undefined.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in expt_zero_zero
    1. Line 16, column 8 to line 16, column 32 in expt_zero_zero
    2. Line 16, column 29 to line 16, column 32 in expt_zero_zero
    3. Line 12, column 9 to line 12, column 17 in expt_zero_zero
    4. Line 12, column 9 to line 12, column 13 in expt_zero_zero
property:
  exit: 75
  transcript: |-
    1000:1 
    2180:0 0^0 is undefined.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in expt_zero_zero
    1. Line 15, column 12 to line 15, column 36 in expt_zero_zero
    2. Line 15, column 33 to line 15, column 36 in expt_zero_zero
    3. Line 12, column 9 to line 12, column 17 in expt_zero_zero
    4. Line 12, column 9 to line 12, column 13 in expt_zero_zero
---*)
