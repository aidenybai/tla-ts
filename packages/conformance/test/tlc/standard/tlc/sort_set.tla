(*---
description: A set is not a sequence to SortSeq.
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE sort_set ----
EXTENDS TLC, Naturals
Test == SortSeq({2, 1}, LAMBDA x, y : TRUE) = <<>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2}
init:
  exit: 75
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sort_set
    1. Line 14, column 29 to line 14, column 32 in sort_set
    2. Line 12, column 9 to line 12, column 50 in sort_set
    3. Line 12, column 9 to line 12, column 43 in sort_set
next:
  exit: 255
  transcript: |-
    2169:1 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in sort_set
    1. Line 15, column 30 to line 15, column 33 in sort_set
    2. Line 12, column 9 to line 12, column 50 in sort_set
    3. Line 12, column 9 to line 12, column 43 in sort_set
invariant:
  exit: 75
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sort_set
    1. Line 16, column 8 to line 16, column 32 in sort_set
    2. Line 16, column 29 to line 16, column 32 in sort_set
    3. Line 12, column 9 to line 12, column 50 in sort_set
    4. Line 12, column 9 to line 12, column 43 in sort_set
property:
  exit: 75
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sort_set
    1. Line 15, column 12 to line 15, column 36 in sort_set
    2. Line 15, column 33 to line 15, column 36 in sort_set
    3. Line 12, column 9 to line 12, column 50 in sort_set
    4. Line 12, column 9 to line 12, column 43 in sort_set
---*)
