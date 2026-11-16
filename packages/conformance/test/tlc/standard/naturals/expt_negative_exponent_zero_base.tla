(*---
description: The negative exponent check comes before the 0^0 check.
ref: tlc2/module/Naturals.java#Expt
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE expt_negative_exponent_zero_base ----
EXTENDS Naturals
Test == 0 ^ (0 - 1) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module expt_negative_exponent_zero_base failed.
    2169:0 The second argument of ^ should be a natural number, but instead it is:
    -1
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of ^ should be a natural number, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in expt_negative_exponent_zero_base
    1. Line 14, column 29 to line 14, column 32 in expt_negative_exponent_zero_base
    2. Line 12, column 9 to line 12, column 23 in expt_negative_exponent_zero_base
    3. Line 12, column 9 to line 12, column 19 in expt_negative_exponent_zero_base
next:
  exit: 255
  transcript: |-
    2169:1 The second argument of ^ should be a natural number, but instead it is:
    -1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in expt_negative_exponent_zero_base
    1. Line 15, column 30 to line 15, column 33 in expt_negative_exponent_zero_base
    2. Line 12, column 9 to line 12, column 23 in expt_negative_exponent_zero_base
    3. Line 12, column 9 to line 12, column 19 in expt_negative_exponent_zero_base
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of ^ should be a natural number, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in expt_negative_exponent_zero_base
    1. Line 16, column 8 to line 16, column 32 in expt_negative_exponent_zero_base
    2. Line 16, column 29 to line 16, column 32 in expt_negative_exponent_zero_base
    3. Line 12, column 9 to line 12, column 23 in expt_negative_exponent_zero_base
    4. Line 12, column 9 to line 12, column 19 in expt_negative_exponent_zero_base
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of ^ should be a natural number, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in expt_negative_exponent_zero_base
    1. Line 15, column 12 to line 15, column 36 in expt_negative_exponent_zero_base
    2. Line 15, column 33 to line 15, column 36 in expt_negative_exponent_zero_base
    3. Line 12, column 9 to line 12, column 23 in expt_negative_exponent_zero_base
    4. Line 12, column 9 to line 12, column 19 in expt_negative_exponent_zero_base
---*)
