(*---
description: A non-integer second argument is reported as not a natural number.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE subseq_second_string ----
EXTENDS Sequences, Naturals
Test == SubSeq(<<1>>, "a", 1) = <<>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    "a"
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    "a"
init:
  exit: 75
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    "a"
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subseq_second_string
    1. Line 14, column 29 to line 14, column 32 in subseq_second_string
    2. Line 12, column 9 to line 12, column 36 in subseq_second_string
    3. Line 12, column 9 to line 12, column 29 in subseq_second_string
next:
  exit: 255
  transcript: |-
    2169:1 The second argument of SubSeq should be a natural number, but instead it is:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in subseq_second_string
    1. Line 15, column 30 to line 15, column 33 in subseq_second_string
    2. Line 12, column 9 to line 12, column 36 in subseq_second_string
    3. Line 12, column 9 to line 12, column 29 in subseq_second_string
invariant:
  exit: 75
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    "a"
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subseq_second_string
    1. Line 16, column 8 to line 16, column 32 in subseq_second_string
    2. Line 16, column 29 to line 16, column 32 in subseq_second_string
    3. Line 12, column 9 to line 12, column 36 in subseq_second_string
    4. Line 12, column 9 to line 12, column 29 in subseq_second_string
property:
  exit: 75
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    "a"
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subseq_second_string
    1. Line 15, column 12 to line 15, column 36 in subseq_second_string
    2. Line 15, column 33 to line 15, column 36 in subseq_second_string
    3. Line 12, column 9 to line 12, column 36 in subseq_second_string
    4. Line 12, column 9 to line 12, column 29 in subseq_second_string
---*)
