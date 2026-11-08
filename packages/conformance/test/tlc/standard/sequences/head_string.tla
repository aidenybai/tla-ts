(*---
description: Head has no string branch, unlike Len and Tail, so a string is rejected.
ref: tlc2/module/Sequences.java#Head
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE head_string ----
EXTENDS Sequences, Naturals
Test == Head("abc") = "a"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module head_string failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    "abc"
init:
  exit: 75
  transcript: |-
    1000:1 
    2283:0 The argument of Head should be a sequence, but instead it is:
    "abc"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in head_string
    1. Line 14, column 29 to line 14, column 32 in head_string
    2. Line 12, column 9 to line 12, column 25 in head_string
    3. Line 12, column 9 to line 12, column 19 in head_string
next:
  exit: 255
  transcript: |-
    2283:1 The argument of Head should be a sequence, but instead it is:
    "abc"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in head_string
    1. Line 15, column 30 to line 15, column 33 in head_string
    2. Line 12, column 9 to line 12, column 25 in head_string
    3. Line 12, column 9 to line 12, column 19 in head_string
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2283:0 The argument of Head should be a sequence, but instead it is:
    "abc"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in head_string
    1. Line 16, column 8 to line 16, column 32 in head_string
    2. Line 16, column 29 to line 16, column 32 in head_string
    3. Line 12, column 9 to line 12, column 25 in head_string
    4. Line 12, column 9 to line 12, column 19 in head_string
property:
  exit: 75
  transcript: |-
    1000:1 
    2283:0 The argument of Head should be a sequence, but instead it is:
    "abc"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in head_string
    1. Line 15, column 12 to line 15, column 36 in head_string
    2. Line 15, column 33 to line 15, column 36 in head_string
    3. Line 12, column 9 to line 12, column 25 in head_string
    4. Line 12, column 9 to line 12, column 19 in head_string
---*)
