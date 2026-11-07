(*---
description: A set k asks for a nonnegative integer, checked before the second argument.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE subset_first_set ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubset({}, 3) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2169:0 The first argument of RandomSubset should be a nonnegative integer, but instead it is:
    {}
    2169:0 The first argument of RandomSubset should be a nonnegative integer, but instead it is:
    {}
init:
  exit: 75
  transcript: |-
    2169:0 The first argument of RandomSubset should be a nonnegative integer, but instead it is:
    {}
    2169:0 The first argument of RandomSubset should be a nonnegative integer, but instead it is:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subset_first_set
    1. Line 14, column 29 to line 14, column 32 in subset_first_set
    2. Line 12, column 9 to line 12, column 32 in subset_first_set
    3. Line 12, column 9 to line 12, column 27 in subset_first_set
next:
  exit: 255
  transcript: |-
    2169:1 The first argument of RandomSubset should be a nonnegative integer, but instead it is:
    {}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in subset_first_set
    1. Line 15, column 30 to line 15, column 33 in subset_first_set
    2. Line 12, column 9 to line 12, column 32 in subset_first_set
    3. Line 12, column 9 to line 12, column 27 in subset_first_set
invariant:
  exit: 75
  transcript: |-
    2169:0 The first argument of RandomSubset should be a nonnegative integer, but instead it is:
    {}
    2169:0 The first argument of RandomSubset should be a nonnegative integer, but instead it is:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subset_first_set
    1. Line 16, column 8 to line 16, column 32 in subset_first_set
    2. Line 16, column 29 to line 16, column 32 in subset_first_set
    3. Line 12, column 9 to line 12, column 32 in subset_first_set
    4. Line 12, column 9 to line 12, column 27 in subset_first_set
property:
  exit: 75
  transcript: |-
    2169:0 The first argument of RandomSubset should be a nonnegative integer, but instead it is:
    {}
    2169:0 The first argument of RandomSubset should be a nonnegative integer, but instead it is:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subset_first_set
    1. Line 15, column 12 to line 15, column 36 in subset_first_set
    2. Line 15, column 33 to line 15, column 36 in subset_first_set
    3. Line 12, column 9 to line 12, column 32 in subset_first_set
    4. Line 12, column 9 to line 12, column 27 in subset_first_set
---*)
