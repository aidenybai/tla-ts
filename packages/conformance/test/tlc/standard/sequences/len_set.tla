(*---
description: A set is not a sequence, even the empty set.
ref: tlc2/module/Sequences.java#Len
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE len_set ----
EXTENDS Sequences, Naturals
Test == Len({}) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    {}
    2283:0 The argument of Len should be a sequence, but instead it is:
    {}
init:
  exit: 75
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    {}
    2283:0 The argument of Len should be a sequence, but instead it is:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in len_set
    1. Line 14, column 29 to line 14, column 32 in len_set
    2. Line 12, column 9 to line 12, column 19 in len_set
    3. Line 12, column 9 to line 12, column 15 in len_set
next:
  exit: 255
  transcript: |-
    2283:1 The argument of Len should be a sequence, but instead it is:
    {}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in len_set
    1. Line 15, column 30 to line 15, column 33 in len_set
    2. Line 12, column 9 to line 12, column 19 in len_set
    3. Line 12, column 9 to line 12, column 15 in len_set
invariant:
  exit: 75
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    {}
    2283:0 The argument of Len should be a sequence, but instead it is:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in len_set
    1. Line 16, column 8 to line 16, column 32 in len_set
    2. Line 16, column 29 to line 16, column 32 in len_set
    3. Line 12, column 9 to line 12, column 19 in len_set
    4. Line 12, column 9 to line 12, column 15 in len_set
property:
  exit: 75
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    {}
    2283:0 The argument of Len should be a sequence, but instead it is:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in len_set
    1. Line 15, column 12 to line 15, column 36 in len_set
    2. Line 15, column 33 to line 15, column 36 in len_set
    3. Line 12, column 9 to line 12, column 19 in len_set
    4. Line 12, column 9 to line 12, column 15 in len_set
---*)
