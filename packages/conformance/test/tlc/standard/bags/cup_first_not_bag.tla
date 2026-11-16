(*---
description: A function with a zero count is not a bag on the left.
ref: tlc2/module/Bags.java#BagCup
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE cup_first_not_bag ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> 0) (+) EmptyBag = EmptyBag
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module cup_first_not_bag failed.
    2169:0 The first argument of (+) should be a bag, but instead it is:
    <<0>>
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of (+) should be a bag, but instead it is:
    <<0>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in cup_first_not_bag
    1. Line 14, column 29 to line 14, column 32 in cup_first_not_bag
    2. Line 12, column 9 to line 12, column 40 in cup_first_not_bag
    3. Line 12, column 9 to line 12, column 29 in cup_first_not_bag
next:
  exit: 255
  transcript: |-
    2169:1 The first argument of (+) should be a bag, but instead it is:
    <<0>>
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in cup_first_not_bag
    1. Line 15, column 30 to line 15, column 33 in cup_first_not_bag
    2. Line 12, column 9 to line 12, column 40 in cup_first_not_bag
    3. Line 12, column 9 to line 12, column 29 in cup_first_not_bag
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of (+) should be a bag, but instead it is:
    <<0>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in cup_first_not_bag
    1. Line 16, column 8 to line 16, column 32 in cup_first_not_bag
    2. Line 16, column 29 to line 16, column 32 in cup_first_not_bag
    3. Line 12, column 9 to line 12, column 40 in cup_first_not_bag
    4. Line 12, column 9 to line 12, column 29 in cup_first_not_bag
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of (+) should be a bag, but instead it is:
    <<0>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in cup_first_not_bag
    1. Line 15, column 12 to line 15, column 36 in cup_first_not_bag
    2. Line 15, column 33 to line 15, column 36 in cup_first_not_bag
    3. Line 12, column 9 to line 12, column 40 in cup_first_not_bag
    4. Line 12, column 9 to line 12, column 29 in cup_first_not_bag
---*)
