(*---
description: With the last two bad, the second is reported.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE subseq_check_order_second ----
EXTENDS Sequences, Naturals
Test == SubSeq(<<1>>, "a", "b") = <<>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module subseq_check_order_second failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    "a"
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subseq_check_order_second
    1. Line 14, column 29 to line 14, column 32 in subseq_check_order_second
    2. Line 12, column 9 to line 12, column 38 in subseq_check_order_second
    3. Line 12, column 9 to line 12, column 31 in subseq_check_order_second
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
    0. Line 15, column 9 to line 15, column 33 in subseq_check_order_second
    1. Line 15, column 30 to line 15, column 33 in subseq_check_order_second
    2. Line 12, column 9 to line 12, column 38 in subseq_check_order_second
    3. Line 12, column 9 to line 12, column 31 in subseq_check_order_second
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subseq_check_order_second
    1. Line 16, column 8 to line 16, column 32 in subseq_check_order_second
    2. Line 16, column 29 to line 16, column 32 in subseq_check_order_second
    3. Line 12, column 9 to line 12, column 38 in subseq_check_order_second
    4. Line 12, column 9 to line 12, column 31 in subseq_check_order_second
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subseq_check_order_second
    1. Line 15, column 12 to line 15, column 36 in subseq_check_order_second
    2. Line 15, column 33 to line 15, column 36 in subseq_check_order_second
    3. Line 12, column 9 to line 12, column 38 in subseq_check_order_second
    4. Line 12, column 9 to line 12, column 31 in subseq_check_order_second
---*)
