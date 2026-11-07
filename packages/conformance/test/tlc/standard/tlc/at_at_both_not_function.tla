(*---
description: With both bad, the first is reported.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE at_at_both_not_function ----
EXTENDS TLC, Naturals
Test == 3 @@ 4 = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    3
    2169:0 The first argument of @@ should be a function, but instead it is:
    3
init:
  exit: 75
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    3
    2169:0 The first argument of @@ should be a function, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in at_at_both_not_function
    1. Line 14, column 29 to line 14, column 32 in at_at_both_not_function
    2. Line 12, column 9 to line 12, column 18 in at_at_both_not_function
    3. Line 12, column 9 to line 12, column 14 in at_at_both_not_function
next:
  exit: 255
  transcript: |-
    2169:1 The first argument of @@ should be a function, but instead it is:
    3
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in at_at_both_not_function
    1. Line 15, column 30 to line 15, column 33 in at_at_both_not_function
    2. Line 12, column 9 to line 12, column 18 in at_at_both_not_function
    3. Line 12, column 9 to line 12, column 14 in at_at_both_not_function
invariant:
  exit: 75
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    3
    2169:0 The first argument of @@ should be a function, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in at_at_both_not_function
    1. Line 16, column 8 to line 16, column 32 in at_at_both_not_function
    2. Line 16, column 29 to line 16, column 32 in at_at_both_not_function
    3. Line 12, column 9 to line 12, column 18 in at_at_both_not_function
    4. Line 12, column 9 to line 12, column 14 in at_at_both_not_function
property:
  exit: 75
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    3
    2169:0 The first argument of @@ should be a function, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in at_at_both_not_function
    1. Line 15, column 12 to line 15, column 36 in at_at_both_not_function
    2. Line 15, column 33 to line 15, column 36 in at_at_both_not_function
    3. Line 12, column 9 to line 12, column 18 in at_at_both_not_function
    4. Line 12, column 9 to line 12, column 14 in at_at_both_not_function
---*)
