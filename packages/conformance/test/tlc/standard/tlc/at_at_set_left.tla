(*---
description: A set on the left is not a function.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE at_at_set_left ----
EXTENDS TLC, Naturals
Test == {} @@ (1 :> 1) = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module at_at_set_left failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    {}
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of @@ should be a function, but instead it is:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in at_at_set_left
    1. Line 14, column 29 to line 14, column 32 in at_at_set_left
    2. Line 12, column 9 to line 12, column 26 in at_at_set_left
    3. Line 12, column 9 to line 12, column 22 in at_at_set_left
next:
  exit: 255
  transcript: |-
    2169:1 The first argument of @@ should be a function, but instead it is:
    {}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in at_at_set_left
    1. Line 15, column 30 to line 15, column 33 in at_at_set_left
    2. Line 12, column 9 to line 12, column 26 in at_at_set_left
    3. Line 12, column 9 to line 12, column 22 in at_at_set_left
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of @@ should be a function, but instead it is:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in at_at_set_left
    1. Line 16, column 8 to line 16, column 32 in at_at_set_left
    2. Line 16, column 29 to line 16, column 32 in at_at_set_left
    3. Line 12, column 9 to line 12, column 26 in at_at_set_left
    4. Line 12, column 9 to line 12, column 22 in at_at_set_left
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of @@ should be a function, but instead it is:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in at_at_set_left
    1. Line 15, column 12 to line 15, column 36 in at_at_set_left
    2. Line 15, column 33 to line 15, column 36 in at_at_set_left
    3. Line 12, column 9 to line 12, column 26 in at_at_set_left
    4. Line 12, column 9 to line 12, column 22 in at_at_set_left
---*)
