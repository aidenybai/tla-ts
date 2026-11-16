(*---
description: An error in the operator propagates.
ref: tlc2/module/Bags.java#BagOfAll
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE bag_of_all_operator_error ----
EXTENDS Bags, TLC, Naturals
Test == BagOfAll(LAMBDA x : x \div 0, 1 :> 1) = EmptyBag
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module bag_of_all_operator_error failed.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in bag_of_all_operator_error
    1. Line 14, column 29 to line 14, column 32 in bag_of_all_operator_error
    2. Line 12, column 9 to line 12, column 56 in bag_of_all_operator_error
    3. Line 12, column 9 to line 12, column 45 in bag_of_all_operator_error
    4. Line 12, column 29 to line 12, column 36 in bag_of_all_operator_error
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in bag_of_all_operator_error
    1. Line 15, column 30 to line 15, column 33 in bag_of_all_operator_error
    2. Line 12, column 9 to line 12, column 56 in bag_of_all_operator_error
    3. Line 12, column 9 to line 12, column 45 in bag_of_all_operator_error
    4. Line 12, column 29 to line 12, column 36 in bag_of_all_operator_error
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in bag_of_all_operator_error
    1. Line 16, column 8 to line 16, column 32 in bag_of_all_operator_error
    2. Line 16, column 29 to line 16, column 32 in bag_of_all_operator_error
    3. Line 12, column 9 to line 12, column 56 in bag_of_all_operator_error
    4. Line 12, column 9 to line 12, column 45 in bag_of_all_operator_error
    5. Line 12, column 29 to line 12, column 36 in bag_of_all_operator_error
property:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in bag_of_all_operator_error
    1. Line 15, column 12 to line 15, column 36 in bag_of_all_operator_error
    2. Line 15, column 33 to line 15, column 36 in bag_of_all_operator_error
    3. Line 12, column 9 to line 12, column 56 in bag_of_all_operator_error
    4. Line 12, column 9 to line 12, column 45 in bag_of_all_operator_error
    5. Line 12, column 29 to line 12, column 36 in bag_of_all_operator_error
---*)
