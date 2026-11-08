(*---
description: (-) names its second argument when it is no function.
ref: tlc2/module/Bags.java#BagDiff
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE diff_second_not_function ----
EXTENDS Bags, TLC, Naturals
Test == EmptyBag (-) 3 = EmptyBag
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module diff_second_not_function failed.
    2169:0 The second argument of (-) should be a bag, but instead it is:
    3
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of (-) should be a bag, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in diff_second_not_function
    1. Line 14, column 29 to line 14, column 32 in diff_second_not_function
    2. Line 12, column 9 to line 12, column 33 in diff_second_not_function
    3. Line 12, column 9 to line 12, column 22 in diff_second_not_function
next:
  exit: 255
  transcript: |-
    2169:1 The second argument of (-) should be a bag, but instead it is:
    3
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in diff_second_not_function
    1. Line 15, column 30 to line 15, column 33 in diff_second_not_function
    2. Line 12, column 9 to line 12, column 33 in diff_second_not_function
    3. Line 12, column 9 to line 12, column 22 in diff_second_not_function
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of (-) should be a bag, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in diff_second_not_function
    1. Line 16, column 8 to line 16, column 32 in diff_second_not_function
    2. Line 16, column 29 to line 16, column 32 in diff_second_not_function
    3. Line 12, column 9 to line 12, column 33 in diff_second_not_function
    4. Line 12, column 9 to line 12, column 22 in diff_second_not_function
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of (-) should be a bag, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in diff_second_not_function
    1. Line 15, column 12 to line 15, column 36 in diff_second_not_function
    2. Line 15, column 33 to line 15, column 36 in diff_second_not_function
    3. Line 12, column 9 to line 12, column 33 in diff_second_not_function
    4. Line 12, column 9 to line 12, column 22 in diff_second_not_function
---*)
