(*---
description: 0^0 is undefined with its own message.
ref: tlc2/module/Naturals.java#Expt
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE expt_zero_to_zero ----
EXTENDS Naturals
Test == 0 ^ 0 = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2180:0 0^0 is undefined.
    2180:0 0^0 is undefined.
init:
  exit: 75
  transcript: |-
    2180:0 0^0 is undefined.
    2180:0 0^0 is undefined.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in expt_zero_to_zero
    1. Line 14, column 29 to line 14, column 32 in expt_zero_to_zero
    2. Line 12, column 9 to line 12, column 17 in expt_zero_to_zero
    3. Line 12, column 9 to line 12, column 13 in expt_zero_to_zero
next:
  exit: 255
  transcript: |-
    2180:1 0^0 is undefined.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in expt_zero_to_zero
    1. Line 15, column 30 to line 15, column 33 in expt_zero_to_zero
    2. Line 12, column 9 to line 12, column 17 in expt_zero_to_zero
    3. Line 12, column 9 to line 12, column 13 in expt_zero_to_zero
invariant:
  exit: 75
  transcript: |-
    2180:0 0^0 is undefined.
    2180:0 0^0 is undefined.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in expt_zero_to_zero
    1. Line 16, column 8 to line 16, column 32 in expt_zero_to_zero
    2. Line 16, column 29 to line 16, column 32 in expt_zero_to_zero
    3. Line 12, column 9 to line 12, column 17 in expt_zero_to_zero
    4. Line 12, column 9 to line 12, column 13 in expt_zero_to_zero
property:
  exit: 75
  transcript: |-
    2180:0 0^0 is undefined.
    2180:0 0^0 is undefined.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in expt_zero_to_zero
    1. Line 15, column 12 to line 15, column 36 in expt_zero_to_zero
    2. Line 15, column 33 to line 15, column 36 in expt_zero_to_zero
    3. Line 12, column 9 to line 12, column 17 in expt_zero_to_zero
    4. Line 12, column 9 to line 12, column 13 in expt_zero_to_zero
---*)
