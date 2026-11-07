(*---
description: "Head has no string case, so Head of a string is an error although Tail works."
ref: "tlc2/module/Sequences.java#Head"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE head_not_supported ----
EXTENDS Integers, Sequences
Test == Head("abc") = "a"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    "abc"
    2283:0 The argument of Head should be a sequence, but instead it is:
    "abc"
init:
  exit: 75
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    "abc"
    2283:0 The argument of Head should be a sequence, but instead it is:
    "abc"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in head_not_supported
    1. Line 11, column 29 to line 11, column 32 in head_not_supported
    2. Line 9, column 9 to line 9, column 25 in head_not_supported
    3. Line 9, column 9 to line 9, column 19 in head_not_supported
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
    0. Line 12, column 9 to line 12, column 33 in head_not_supported
    1. Line 12, column 30 to line 12, column 33 in head_not_supported
    2. Line 9, column 9 to line 9, column 25 in head_not_supported
    3. Line 9, column 9 to line 9, column 19 in head_not_supported
invariant:
  exit: 75
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    "abc"
    2283:0 The argument of Head should be a sequence, but instead it is:
    "abc"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in head_not_supported
    1. Line 13, column 8 to line 13, column 32 in head_not_supported
    2. Line 13, column 29 to line 13, column 32 in head_not_supported
    3. Line 9, column 9 to line 9, column 25 in head_not_supported
    4. Line 9, column 9 to line 9, column 19 in head_not_supported
property:
  exit: 75
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    "abc"
    2283:0 The argument of Head should be a sequence, but instead it is:
    "abc"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in head_not_supported
    1. Line 12, column 12 to line 12, column 36 in head_not_supported
    2. Line 12, column 33 to line 12, column 36 in head_not_supported
    3. Line 9, column 9 to line 9, column 25 in head_not_supported
    4. Line 9, column 9 to line 9, column 19 in head_not_supported
---*)
