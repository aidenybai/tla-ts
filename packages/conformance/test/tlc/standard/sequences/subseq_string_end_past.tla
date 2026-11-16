(*---
description: A string's out-of-domain end names the third argument.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE subseq_string_end_past ----
EXTENDS Sequences, Naturals
Test == SubSeq("abc", 1, 4) = "abc"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module subseq_string_end_past failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    "abc"
    , but instead it is
    4
init:
  exit: 75
  transcript: |-
    1000:1 
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    "abc"
    , but instead it is
    4
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subseq_string_end_past
    1. Line 14, column 29 to line 14, column 32 in subseq_string_end_past
    2. Line 12, column 9 to line 12, column 35 in subseq_string_end_past
    3. Line 12, column 9 to line 12, column 27 in subseq_string_end_past
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
    0. Line 15, column 9 to line 15, column 33 in subseq_string_end_past
    1. Line 15, column 30 to line 15, column 33 in subseq_string_end_past
    2. Line 12, column 9 to line 12, column 35 in subseq_string_end_past
    3. Line 12, column 9 to line 12, column 27 in subseq_string_end_past
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    "abc"
    , but instead it is
    4
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subseq_string_end_past
    1. Line 16, column 8 to line 16, column 32 in subseq_string_end_past
    2. Line 16, column 29 to line 16, column 32 in subseq_string_end_past
    3. Line 12, column 9 to line 12, column 35 in subseq_string_end_past
    4. Line 12, column 9 to line 12, column 27 in subseq_string_end_past
property:
  exit: 75
  transcript: |-
    1000:1 
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    "abc"
    , but instead it is
    4
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subseq_string_end_past
    1. Line 15, column 12 to line 15, column 36 in subseq_string_end_past
    2. Line 15, column 33 to line 15, column 36 in subseq_string_end_past
    3. Line 12, column 9 to line 12, column 35 in subseq_string_end_past
    4. Line 12, column 9 to line 12, column 27 in subseq_string_end_past
---*)
