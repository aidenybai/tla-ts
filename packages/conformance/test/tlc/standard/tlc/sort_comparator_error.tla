(*---
description: An error in the comparator propagates.
ref: tlc2/module/TLC.java#compare
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE sort_comparator_error ----
EXTENDS TLC, Naturals
Test == SortSeq(<<"a", "b">>, LAMBDA x, y : x < y) = <<>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    "b"
    2266:0 The first argument of < should be an integer, but instead it is:
    "b"
init:
  exit: 75
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    "b"
    2266:0 The first argument of < should be an integer, but instead it is:
    "b"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sort_comparator_error
    1. Line 14, column 29 to line 14, column 32 in sort_comparator_error
    2. Line 12, column 9 to line 12, column 57 in sort_comparator_error
    3. Line 12, column 9 to line 12, column 50 in sort_comparator_error
    4. Line 12, column 45 to line 12, column 49 in sort_comparator_error
next:
  exit: 255
  transcript: |-
    2266:1 The first argument of < should be an integer, but instead it is:
    "b"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in sort_comparator_error
    1. Line 15, column 30 to line 15, column 33 in sort_comparator_error
    2. Line 12, column 9 to line 12, column 57 in sort_comparator_error
    3. Line 12, column 9 to line 12, column 50 in sort_comparator_error
    4. Line 12, column 45 to line 12, column 49 in sort_comparator_error
invariant:
  exit: 75
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    "b"
    2266:0 The first argument of < should be an integer, but instead it is:
    "b"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sort_comparator_error
    1. Line 16, column 8 to line 16, column 32 in sort_comparator_error
    2. Line 16, column 29 to line 16, column 32 in sort_comparator_error
    3. Line 12, column 9 to line 12, column 57 in sort_comparator_error
    4. Line 12, column 9 to line 12, column 50 in sort_comparator_error
    5. Line 12, column 45 to line 12, column 49 in sort_comparator_error
property:
  exit: 75
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    "b"
    2266:0 The first argument of < should be an integer, but instead it is:
    "b"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sort_comparator_error
    1. Line 15, column 12 to line 15, column 36 in sort_comparator_error
    2. Line 15, column 33 to line 15, column 36 in sort_comparator_error
    3. Line 12, column 9 to line 12, column 57 in sort_comparator_error
    4. Line 12, column 9 to line 12, column 50 in sort_comparator_error
    5. Line 12, column 45 to line 12, column 49 in sort_comparator_error
---*)
