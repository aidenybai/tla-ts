(*---
description: "SubSeq on a string checks its end."
ref: "tlc2/module/Sequences.java#SubSeq"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE subseq_end_out_of_range ----
EXTENDS Integers, Sequences
Test == SubSeq("abc", 1, 4) = ""
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    "abc"
    , but instead it is
    4
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    "abc"
    , but instead it is
    4
init:
  exit: 75
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    "abc"
    , but instead it is
    4
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    "abc"
    , but instead it is
    4
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in subseq_end_out_of_range
    1. Line 11, column 29 to line 11, column 32 in subseq_end_out_of_range
    2. Line 9, column 9 to line 9, column 32 in subseq_end_out_of_range
    3. Line 9, column 9 to line 9, column 27 in subseq_end_out_of_range
next:
  exit: 255
  transcript: |-
    2183:1 The third argument of SubSeq must be in the domain of its first argument:
    "abc"
    , but instead it is
    4
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in subseq_end_out_of_range
    1. Line 12, column 30 to line 12, column 33 in subseq_end_out_of_range
    2. Line 9, column 9 to line 9, column 32 in subseq_end_out_of_range
    3. Line 9, column 9 to line 9, column 27 in subseq_end_out_of_range
invariant:
  exit: 75
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    "abc"
    , but instead it is
    4
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    "abc"
    , but instead it is
    4
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in subseq_end_out_of_range
    1. Line 13, column 8 to line 13, column 32 in subseq_end_out_of_range
    2. Line 13, column 29 to line 13, column 32 in subseq_end_out_of_range
    3. Line 9, column 9 to line 9, column 32 in subseq_end_out_of_range
    4. Line 9, column 9 to line 9, column 27 in subseq_end_out_of_range
property:
  exit: 75
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    "abc"
    , but instead it is
    4
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    "abc"
    , but instead it is
    4
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in subseq_end_out_of_range
    1. Line 12, column 12 to line 12, column 36 in subseq_end_out_of_range
    2. Line 12, column 33 to line 12, column 36 in subseq_end_out_of_range
    3. Line 9, column 9 to line 9, column 32 in subseq_end_out_of_range
    4. Line 9, column 9 to line 9, column 27 in subseq_end_out_of_range
---*)
