(*---
description: A negative k has the same naming.
ref: tlc2/module/Randomization.java#RandomSubsetSet
features:
  - Randomization
flags:
  - expression
outcome: evaluation-failure
includes:
  - Randomization.tla
---*)
---- MODULE sss_first_negative ----
EXTENDS Randomization, FiniteSets, Integers
Test == RandomSubsetSet(-1, "0.5", {1}) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2169:0 The first argument of RandomSubsetSetProbability should be a nonnegative integer, but instead it is:
    -1
    2169:0 The first argument of RandomSubsetSetProbability should be a nonnegative integer, but instead it is:
    -1
init:
  exit: 75
  transcript: |-
    2169:0 The first argument of RandomSubsetSetProbability should be a nonnegative integer, but instead it is:
    -1
    2169:0 The first argument of RandomSubsetSetProbability should be a nonnegative integer, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in sss_first_negative
    1. Line 16, column 29 to line 16, column 32 in sss_first_negative
    2. Line 14, column 9 to line 14, column 44 in sss_first_negative
    3. Line 14, column 9 to line 14, column 39 in sss_first_negative
next:
  exit: 255
  transcript: |-
    2169:1 The first argument of RandomSubsetSetProbability should be a nonnegative integer, but instead it is:
    -1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in sss_first_negative
    1. Line 17, column 30 to line 17, column 33 in sss_first_negative
    2. Line 14, column 9 to line 14, column 44 in sss_first_negative
    3. Line 14, column 9 to line 14, column 39 in sss_first_negative
invariant:
  exit: 75
  transcript: |-
    2169:0 The first argument of RandomSubsetSetProbability should be a nonnegative integer, but instead it is:
    -1
    2169:0 The first argument of RandomSubsetSetProbability should be a nonnegative integer, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in sss_first_negative
    1. Line 18, column 8 to line 18, column 32 in sss_first_negative
    2. Line 18, column 29 to line 18, column 32 in sss_first_negative
    3. Line 14, column 9 to line 14, column 44 in sss_first_negative
    4. Line 14, column 9 to line 14, column 39 in sss_first_negative
property:
  exit: 75
  transcript: |-
    2169:0 The first argument of RandomSubsetSetProbability should be a nonnegative integer, but instead it is:
    -1
    2169:0 The first argument of RandomSubsetSetProbability should be a nonnegative integer, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in sss_first_negative
    1. Line 17, column 12 to line 17, column 36 in sss_first_negative
    2. Line 17, column 33 to line 17, column 36 in sss_first_negative
    3. Line 14, column 9 to line 14, column 44 in sss_first_negative
    4. Line 14, column 9 to line 14, column 39 in sss_first_negative
---*)
