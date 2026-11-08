(*---
description: k > 2^|S| is rejected, naming the size.
ref: tlc2/module/Randomization.java#RandomSubsetSet
features:
  - Randomization
flags:
  - expression
outcome: evaluation-failure
includes:
  - Randomization.tla
---*)
---- MODULE sss_k_over_max ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubsetSet(5, "0.5", {1, 2}) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module sss_k_over_max failed.
    2169:0 The first argument of RandomSubsetSetProbability should be a nonnegative integer that is smaller than the subset's size of 2^2, but instead it is:
    5
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of RandomSubsetSetProbability should be a nonnegative integer that is smaller than the subset's size of 2^2, but instead it is:
    5
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in sss_k_over_max
    1. Line 16, column 29 to line 16, column 32 in sss_k_over_max
    2. Line 14, column 9 to line 14, column 46 in sss_k_over_max
    3. Line 14, column 9 to line 14, column 41 in sss_k_over_max
next:
  exit: 255
  transcript: |-
    2169:1 The first argument of RandomSubsetSetProbability should be a nonnegative integer that is smaller than the subset's size of 2^2, but instead it is:
    5
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in sss_k_over_max
    1. Line 17, column 30 to line 17, column 33 in sss_k_over_max
    2. Line 14, column 9 to line 14, column 46 in sss_k_over_max
    3. Line 14, column 9 to line 14, column 41 in sss_k_over_max
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of RandomSubsetSetProbability should be a nonnegative integer that is smaller than the subset's size of 2^2, but instead it is:
    5
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in sss_k_over_max
    1. Line 18, column 8 to line 18, column 32 in sss_k_over_max
    2. Line 18, column 29 to line 18, column 32 in sss_k_over_max
    3. Line 14, column 9 to line 14, column 46 in sss_k_over_max
    4. Line 14, column 9 to line 14, column 41 in sss_k_over_max
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of RandomSubsetSetProbability should be a nonnegative integer that is smaller than the subset's size of 2^2, but instead it is:
    5
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in sss_k_over_max
    1. Line 17, column 12 to line 17, column 36 in sss_k_over_max
    2. Line 17, column 33 to line 17, column 36 in sss_k_over_max
    3. Line 14, column 9 to line 14, column 46 in sss_k_over_max
    4. Line 14, column 9 to line 14, column 41 in sss_k_over_max
---*)
