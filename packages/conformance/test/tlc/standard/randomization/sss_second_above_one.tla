(*---
description: A probability above 1 has the same message.
ref: tlc2/module/Randomization.java#RandomSubsetSet
features:
  - Randomization
flags:
  - expression
outcome: evaluation-failure
includes:
  - Randomization.tla
---*)
---- MODULE sss_second_above_one ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubsetSet(1, "1.1", {1}) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module sss_second_above_one failed.
    2169:0 The second argument of RandomSubsetSetProbability should be a string literal does not represent a parsable probability, but instead it is:
    "1.1"
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of RandomSubsetSetProbability should be a string literal does not represent a parsable probability, but instead it is:
    "1.1"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in sss_second_above_one
    1. Line 16, column 29 to line 16, column 32 in sss_second_above_one
    2. Line 14, column 9 to line 14, column 43 in sss_second_above_one
    3. Line 14, column 9 to line 14, column 38 in sss_second_above_one
next:
  exit: 255
  transcript: |-
    2169:1 The second argument of RandomSubsetSetProbability should be a string literal does not represent a parsable probability, but instead it is:
    "1.1"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in sss_second_above_one
    1. Line 17, column 30 to line 17, column 33 in sss_second_above_one
    2. Line 14, column 9 to line 14, column 43 in sss_second_above_one
    3. Line 14, column 9 to line 14, column 38 in sss_second_above_one
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of RandomSubsetSetProbability should be a string literal does not represent a parsable probability, but instead it is:
    "1.1"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in sss_second_above_one
    1. Line 18, column 8 to line 18, column 32 in sss_second_above_one
    2. Line 18, column 29 to line 18, column 32 in sss_second_above_one
    3. Line 14, column 9 to line 14, column 43 in sss_second_above_one
    4. Line 14, column 9 to line 14, column 38 in sss_second_above_one
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of RandomSubsetSetProbability should be a string literal does not represent a parsable probability, but instead it is:
    "1.1"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in sss_second_above_one
    1. Line 17, column 12 to line 17, column 36 in sss_second_above_one
    2. Line 17, column 33 to line 17, column 36 in sss_second_above_one
    3. Line 14, column 9 to line 14, column 43 in sss_second_above_one
    4. Line 14, column 9 to line 14, column 38 in sss_second_above_one
---*)
