(*---
description: 46341^2 overflows.
ref: tlc2/module/Naturals.java#Expt
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE expt_square_overflow ----
EXTENDS Naturals
Test == 46341 ^ 2 = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module expt_square_overflow failed.
    2178:0 Overflow when computing 46341^2
init:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 46341^2
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in expt_square_overflow
    1. Line 14, column 29 to line 14, column 32 in expt_square_overflow
    2. Line 12, column 9 to line 12, column 21 in expt_square_overflow
    3. Line 12, column 9 to line 12, column 17 in expt_square_overflow
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing 46341^2
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in expt_square_overflow
    1. Line 15, column 30 to line 15, column 33 in expt_square_overflow
    2. Line 12, column 9 to line 12, column 21 in expt_square_overflow
    3. Line 12, column 9 to line 12, column 17 in expt_square_overflow
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 46341^2
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in expt_square_overflow
    1. Line 16, column 8 to line 16, column 32 in expt_square_overflow
    2. Line 16, column 29 to line 16, column 32 in expt_square_overflow
    3. Line 12, column 9 to line 12, column 21 in expt_square_overflow
    4. Line 12, column 9 to line 12, column 17 in expt_square_overflow
property:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 46341^2
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in expt_square_overflow
    1. Line 15, column 12 to line 15, column 36 in expt_square_overflow
    2. Line 15, column 33 to line 15, column 36 in expt_square_overflow
    3. Line 12, column 9 to line 12, column 21 in expt_square_overflow
    4. Line 12, column 9 to line 12, column 17 in expt_square_overflow
---*)
