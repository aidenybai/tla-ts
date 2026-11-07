(*---
description: Head of a set is an error.
ref: tlc2/module/Sequences.java#Head
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE head_set ----
EXTENDS Sequences, Naturals
Test == Head({1}) = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    {1}
    2283:0 The argument of Head should be a sequence, but instead it is:
    {1}
init:
  exit: 75
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    {1}
    2283:0 The argument of Head should be a sequence, but instead it is:
    {1}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in head_set
    1. Line 14, column 29 to line 14, column 32 in head_set
    2. Line 12, column 9 to line 12, column 21 in head_set
    3. Line 12, column 9 to line 12, column 17 in head_set
next:
  exit: 255
  transcript: |-
    2283:1 The argument of Head should be a sequence, but instead it is:
    {1}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in head_set
    1. Line 15, column 30 to line 15, column 33 in head_set
    2. Line 12, column 9 to line 12, column 21 in head_set
    3. Line 12, column 9 to line 12, column 17 in head_set
invariant:
  exit: 75
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    {1}
    2283:0 The argument of Head should be a sequence, but instead it is:
    {1}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in head_set
    1. Line 16, column 8 to line 16, column 32 in head_set
    2. Line 16, column 29 to line 16, column 32 in head_set
    3. Line 12, column 9 to line 12, column 21 in head_set
    4. Line 12, column 9 to line 12, column 17 in head_set
property:
  exit: 75
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    {1}
    2283:0 The argument of Head should be a sequence, but instead it is:
    {1}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in head_set
    1. Line 15, column 12 to line 15, column 36 in head_set
    2. Line 15, column 33 to line 15, column 36 in head_set
    3. Line 12, column 9 to line 12, column 21 in head_set
    4. Line 12, column 9 to line 12, column 17 in head_set
---*)
