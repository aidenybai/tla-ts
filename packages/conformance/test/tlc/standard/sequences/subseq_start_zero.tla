(*---
description: m = 0 is not in the domain.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE subseq_start_zero ----
EXTENDS Sequences, Naturals
Test == SubSeq(<<1, 2>>, 0, 1) = <<>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module subseq_start_zero failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
init:
  exit: 75
  transcript: |-
    1000:1 
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subseq_start_zero
    1. Line 14, column 29 to line 14, column 32 in subseq_start_zero
    2. Line 12, column 9 to line 12, column 37 in subseq_start_zero
    3. Line 12, column 9 to line 12, column 30 in subseq_start_zero
next:
  exit: 255
  transcript: |-
    2183:1 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in subseq_start_zero
    1. Line 15, column 30 to line 15, column 33 in subseq_start_zero
    2. Line 12, column 9 to line 12, column 37 in subseq_start_zero
    3. Line 12, column 9 to line 12, column 30 in subseq_start_zero
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subseq_start_zero
    1. Line 16, column 8 to line 16, column 32 in subseq_start_zero
    2. Line 16, column 29 to line 16, column 32 in subseq_start_zero
    3. Line 12, column 9 to line 12, column 37 in subseq_start_zero
    4. Line 12, column 9 to line 12, column 30 in subseq_start_zero
property:
  exit: 75
  transcript: |-
    1000:1 
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subseq_start_zero
    1. Line 15, column 12 to line 15, column 36 in subseq_start_zero
    2. Line 15, column 33 to line 15, column 36 in subseq_start_zero
    3. Line 12, column 9 to line 12, column 37 in subseq_start_zero
    4. Line 12, column 9 to line 12, column 30 in subseq_start_zero
---*)
