(*---
description: With two non-function elements, TLC_MODULE_BAG_UNION1 prints the whole set.
ref: tlc2/module/Bags.java#BagUnion
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE union_elements_not_bags ----
EXTENDS Bags, TLC, Naturals
Test == BagUnion({1, 2}) = EmptyBag
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2177:0 Attempted to apply BagUnion to the following set, whose
    element is not a bag:
    {1, 2}
    2177:0 Attempted to apply BagUnion to the following set, whose
    element is not a bag:
    {1, 2}
init:
  exit: 75
  transcript: |-
    2177:0 Attempted to apply BagUnion to the following set, whose
    element is not a bag:
    {1, 2}
    2177:0 Attempted to apply BagUnion to the following set, whose
    element is not a bag:
    {1, 2}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in union_elements_not_bags
    1. Line 14, column 29 to line 14, column 32 in union_elements_not_bags
    2. Line 12, column 9 to line 12, column 35 in union_elements_not_bags
    3. Line 12, column 9 to line 12, column 24 in union_elements_not_bags
next:
  exit: 255
  transcript: |-
    2177:1 Attempted to apply BagUnion to the following set, whose
    element is not a bag:
    {1, 2}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in union_elements_not_bags
    1. Line 15, column 30 to line 15, column 33 in union_elements_not_bags
    2. Line 12, column 9 to line 12, column 35 in union_elements_not_bags
    3. Line 12, column 9 to line 12, column 24 in union_elements_not_bags
invariant:
  exit: 75
  transcript: |-
    2177:0 Attempted to apply BagUnion to the following set, whose
    element is not a bag:
    {1, 2}
    2177:0 Attempted to apply BagUnion to the following set, whose
    element is not a bag:
    {1, 2}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in union_elements_not_bags
    1. Line 16, column 8 to line 16, column 32 in union_elements_not_bags
    2. Line 16, column 29 to line 16, column 32 in union_elements_not_bags
    3. Line 12, column 9 to line 12, column 35 in union_elements_not_bags
    4. Line 12, column 9 to line 12, column 24 in union_elements_not_bags
property:
  exit: 75
  transcript: |-
    2177:0 Attempted to apply BagUnion to the following set, whose
    element is not a bag:
    {1, 2}
    2177:0 Attempted to apply BagUnion to the following set, whose
    element is not a bag:
    {1, 2}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in union_elements_not_bags
    1. Line 15, column 12 to line 15, column 36 in union_elements_not_bags
    2. Line 15, column 33 to line 15, column 36 in union_elements_not_bags
    3. Line 12, column 9 to line 12, column 35 in union_elements_not_bags
    4. Line 12, column 9 to line 12, column 24 in union_elements_not_bags
---*)
