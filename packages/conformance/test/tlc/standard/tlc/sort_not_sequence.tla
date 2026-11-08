(*---
description: "A non-sequence first argument is reported as not a natural number: the message is wrong in the source."
ref: tlc2/module/TLC.java#SortSeq
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE sort_not_sequence ----
EXTENDS TLC, Naturals
Test == SortSeq(3, LAMBDA x, y : TRUE) = <<>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module sort_not_sequence failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    3
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sort_not_sequence
    1. Line 14, column 29 to line 14, column 32 in sort_not_sequence
    2. Line 12, column 9 to line 12, column 45 in sort_not_sequence
    3. Line 12, column 9 to line 12, column 38 in sort_not_sequence
next:
  exit: 255
  transcript: |-
    2169:1 The first argument of SortSeq should be a natural number, but instead it is:
    3
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in sort_not_sequence
    1. Line 15, column 30 to line 15, column 33 in sort_not_sequence
    2. Line 12, column 9 to line 12, column 45 in sort_not_sequence
    3. Line 12, column 9 to line 12, column 38 in sort_not_sequence
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sort_not_sequence
    1. Line 16, column 8 to line 16, column 32 in sort_not_sequence
    2. Line 16, column 29 to line 16, column 32 in sort_not_sequence
    3. Line 12, column 9 to line 12, column 45 in sort_not_sequence
    4. Line 12, column 9 to line 12, column 38 in sort_not_sequence
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sort_not_sequence
    1. Line 15, column 12 to line 15, column 36 in sort_not_sequence
    2. Line 15, column 33 to line 15, column 36 in sort_not_sequence
    3. Line 12, column 9 to line 12, column 45 in sort_not_sequence
    4. Line 12, column 9 to line 12, column 38 in sort_not_sequence
---*)
