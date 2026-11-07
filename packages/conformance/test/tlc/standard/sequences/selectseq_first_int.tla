(*---
description: A non-sequence first argument is reported.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE selectseq_first_int ----
EXTENDS Sequences, Naturals
Test == SelectSeq(3, LAMBDA e : TRUE) = <<>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    3
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    3
init:
  exit: 75
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    3
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in selectseq_first_int
    1. Line 14, column 29 to line 14, column 32 in selectseq_first_int
    2. Line 12, column 9 to line 12, column 44 in selectseq_first_int
    3. Line 12, column 9 to line 12, column 37 in selectseq_first_int
next:
  exit: 255
  transcript: |-
    2169:1 The first argument of SelectSeq should be a sequence, but instead it is:
    3
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in selectseq_first_int
    1. Line 15, column 30 to line 15, column 33 in selectseq_first_int
    2. Line 12, column 9 to line 12, column 44 in selectseq_first_int
    3. Line 12, column 9 to line 12, column 37 in selectseq_first_int
invariant:
  exit: 75
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    3
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in selectseq_first_int
    1. Line 16, column 8 to line 16, column 32 in selectseq_first_int
    2. Line 16, column 29 to line 16, column 32 in selectseq_first_int
    3. Line 12, column 9 to line 12, column 44 in selectseq_first_int
    4. Line 12, column 9 to line 12, column 37 in selectseq_first_int
property:
  exit: 75
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    3
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in selectseq_first_int
    1. Line 15, column 12 to line 15, column 36 in selectseq_first_int
    2. Line 15, column 33 to line 15, column 36 in selectseq_first_int
    3. Line 12, column 9 to line 12, column 44 in selectseq_first_int
    4. Line 12, column 9 to line 12, column 37 in selectseq_first_int
---*)
