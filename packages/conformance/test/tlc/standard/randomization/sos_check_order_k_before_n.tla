(*---
description: The k bound is checked before the n range.
ref: tlc2/module/Randomization.java#RandomSetOfSubsets
features:
  - Randomization
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE sos_check_order_k_before_n ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSetOfSubsets(5, 3, {1, 2}) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2169:0 The first argument of RandomSetOfSubsets should be a nonnegative integer that is smaller than the subset's size of 2^2, but instead it is:
    5
    2169:0 The first argument of RandomSetOfSubsets should be a nonnegative integer that is smaller than the subset's size of 2^2, but instead it is:
    5
init:
  exit: 75
  transcript: |-
    2169:0 The first argument of RandomSetOfSubsets should be a nonnegative integer that is smaller than the subset's size of 2^2, but instead it is:
    5
    2169:0 The first argument of RandomSetOfSubsets should be a nonnegative integer that is smaller than the subset's size of 2^2, but instead it is:
    5
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sos_check_order_k_before_n
    1. Line 14, column 29 to line 14, column 32 in sos_check_order_k_before_n
    2. Line 12, column 9 to line 12, column 45 in sos_check_order_k_before_n
    3. Line 12, column 9 to line 12, column 40 in sos_check_order_k_before_n
next:
  exit: 255
  transcript: |-
    2169:1 The first argument of RandomSetOfSubsets should be a nonnegative integer that is smaller than the subset's size of 2^2, but instead it is:
    5
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in sos_check_order_k_before_n
    1. Line 15, column 30 to line 15, column 33 in sos_check_order_k_before_n
    2. Line 12, column 9 to line 12, column 45 in sos_check_order_k_before_n
    3. Line 12, column 9 to line 12, column 40 in sos_check_order_k_before_n
invariant:
  exit: 75
  transcript: |-
    2169:0 The first argument of RandomSetOfSubsets should be a nonnegative integer that is smaller than the subset's size of 2^2, but instead it is:
    5
    2169:0 The first argument of RandomSetOfSubsets should be a nonnegative integer that is smaller than the subset's size of 2^2, but instead it is:
    5
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sos_check_order_k_before_n
    1. Line 16, column 8 to line 16, column 32 in sos_check_order_k_before_n
    2. Line 16, column 29 to line 16, column 32 in sos_check_order_k_before_n
    3. Line 12, column 9 to line 12, column 45 in sos_check_order_k_before_n
    4. Line 12, column 9 to line 12, column 40 in sos_check_order_k_before_n
property:
  exit: 75
  transcript: |-
    2169:0 The first argument of RandomSetOfSubsets should be a nonnegative integer that is smaller than the subset's size of 2^2, but instead it is:
    5
    2169:0 The first argument of RandomSetOfSubsets should be a nonnegative integer that is smaller than the subset's size of 2^2, but instead it is:
    5
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sos_check_order_k_before_n
    1. Line 15, column 12 to line 15, column 36 in sos_check_order_k_before_n
    2. Line 15, column 33 to line 15, column 36 in sos_check_order_k_before_n
    3. Line 12, column 9 to line 12, column 45 in sos_check_order_k_before_n
    4. Line 12, column 9 to line 12, column 40 in sos_check_order_k_before_n
---*)
