(*---
description: A string is not a sequence to SortSeq.
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE sort_string ----
EXTENDS TLC, Naturals
Test == SortSeq("ba", LAMBDA x, y : TRUE) = "ab"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module sort_string failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    "ba"
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    "ba"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sort_string
    1. Line 14, column 29 to line 14, column 32 in sort_string
    2. Line 12, column 9 to line 12, column 48 in sort_string
    3. Line 12, column 9 to line 12, column 41 in sort_string
next:
  exit: 255
  transcript: |-
    2169:1 The first argument of SortSeq should be a natural number, but instead it is:
    "ba"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in sort_string
    1. Line 15, column 30 to line 15, column 33 in sort_string
    2. Line 12, column 9 to line 12, column 48 in sort_string
    3. Line 12, column 9 to line 12, column 41 in sort_string
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    "ba"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sort_string
    1. Line 16, column 8 to line 16, column 32 in sort_string
    2. Line 16, column 29 to line 16, column 32 in sort_string
    3. Line 12, column 9 to line 12, column 48 in sort_string
    4. Line 12, column 9 to line 12, column 41 in sort_string
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    "ba"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sort_string
    1. Line 15, column 12 to line 15, column 36 in sort_string
    2. Line 15, column 33 to line 15, column 36 in sort_string
    3. Line 12, column 9 to line 12, column 48 in sort_string
    4. Line 12, column 9 to line 12, column 41 in sort_string
---*)
