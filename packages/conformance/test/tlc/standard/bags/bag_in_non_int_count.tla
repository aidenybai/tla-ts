(*---
description: A non-integer count at the key asks for a bag in the second argument.
ref: tlc2/module/Bags.java#BagIn
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE bag_in_non_int_count ----
EXTENDS Bags, TLC, Naturals
Test == BagIn(1, 1 :> "a")
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module bag_in_non_int_count failed.
    2169:0 The second argument of BagIn should be a bag, but instead it is:
    <<"a">>
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of BagIn should be a bag, but instead it is:
    <<"a">>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in bag_in_non_int_count
    1. Line 14, column 29 to line 14, column 32 in bag_in_non_int_count
    2. Line 12, column 9 to line 12, column 26 in bag_in_non_int_count
next:
  exit: 255
  transcript: |-
    2169:1 The second argument of BagIn should be a bag, but instead it is:
    <<"a">>
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in bag_in_non_int_count
    1. Line 15, column 30 to line 15, column 33 in bag_in_non_int_count
    2. Line 12, column 9 to line 12, column 26 in bag_in_non_int_count
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of BagIn should be a bag, but instead it is:
    <<"a">>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in bag_in_non_int_count
    1. Line 16, column 8 to line 16, column 32 in bag_in_non_int_count
    2. Line 16, column 29 to line 16, column 32 in bag_in_non_int_count
    3. Line 12, column 9 to line 12, column 26 in bag_in_non_int_count
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of BagIn should be a bag, but instead it is:
    <<"a">>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in bag_in_non_int_count
    1. Line 15, column 12 to line 15, column 36 in bag_in_non_int_count
    2. Line 15, column 33 to line 15, column 36 in bag_in_non_int_count
    3. Line 12, column 9 to line 12, column 26 in bag_in_non_int_count
---*)
