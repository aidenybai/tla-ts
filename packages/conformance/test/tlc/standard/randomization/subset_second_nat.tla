(*---
description: Nat is rejected with the same wording.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE subset_second_nat ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubset(1, Nat) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2169:0 The second argument of RandomSubset should be a a finite set, but instead it is:
    Nat
    2169:0 The second argument of RandomSubset should be a a finite set, but instead it is:
    Nat
init:
  exit: 75
  transcript: |-
    2169:0 The second argument of RandomSubset should be a a finite set, but instead it is:
    Nat
    2169:0 The second argument of RandomSubset should be a a finite set, but instead it is:
    Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subset_second_nat
    1. Line 14, column 29 to line 14, column 32 in subset_second_nat
    2. Line 12, column 9 to line 12, column 33 in subset_second_nat
    3. Line 12, column 9 to line 12, column 28 in subset_second_nat
next:
  exit: 255
  transcript: |-
    2169:1 The second argument of RandomSubset should be a a finite set, but instead it is:
    Nat
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in subset_second_nat
    1. Line 15, column 30 to line 15, column 33 in subset_second_nat
    2. Line 12, column 9 to line 12, column 33 in subset_second_nat
    3. Line 12, column 9 to line 12, column 28 in subset_second_nat
invariant:
  exit: 75
  transcript: |-
    2169:0 The second argument of RandomSubset should be a a finite set, but instead it is:
    Nat
    2169:0 The second argument of RandomSubset should be a a finite set, but instead it is:
    Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subset_second_nat
    1. Line 16, column 8 to line 16, column 32 in subset_second_nat
    2. Line 16, column 29 to line 16, column 32 in subset_second_nat
    3. Line 12, column 9 to line 12, column 33 in subset_second_nat
    4. Line 12, column 9 to line 12, column 28 in subset_second_nat
property:
  exit: 75
  transcript: |-
    2169:0 The second argument of RandomSubset should be a a finite set, but instead it is:
    Nat
    2169:0 The second argument of RandomSubset should be a a finite set, but instead it is:
    Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subset_second_nat
    1. Line 15, column 12 to line 15, column 36 in subset_second_nat
    2. Line 15, column 33 to line 15, column 36 in subset_second_nat
    3. Line 12, column 9 to line 12, column 33 in subset_second_nat
    4. Line 12, column 9 to line 12, column 28 in subset_second_nat
---*)
