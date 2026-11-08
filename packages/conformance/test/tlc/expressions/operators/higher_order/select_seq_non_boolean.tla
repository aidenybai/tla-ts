(*---
description: "SelectSeq reports a test that does not yield a Boolean."
ref: "tlc2/module/Sequences.java#SelectSeq"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE select_seq_non_boolean ----
EXTENDS Integers, Sequences
Test == SelectSeq(<<1>>, LAMBDA x : x) = <<>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module select_seq_non_boolean failed.
    2169:0 The second argument of SelectSeq should be a boolean-valued operator, but instead it is:
    <Operator LAMBDA>
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of SelectSeq should be a boolean-valued operator, but instead it is:
    <Operator LAMBDA>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in select_seq_non_boolean
    1. Line 11, column 29 to line 11, column 32 in select_seq_non_boolean
    2. Line 9, column 9 to line 9, column 45 in select_seq_non_boolean
    3. Line 9, column 9 to line 9, column 38 in select_seq_non_boolean
next:
  exit: 255
  transcript: |-
    2169:1 The second argument of SelectSeq should be a boolean-valued operator, but instead it is:
    <Operator LAMBDA>
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in select_seq_non_boolean
    1. Line 12, column 30 to line 12, column 33 in select_seq_non_boolean
    2. Line 9, column 9 to line 9, column 45 in select_seq_non_boolean
    3. Line 9, column 9 to line 9, column 38 in select_seq_non_boolean
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of SelectSeq should be a boolean-valued operator, but instead it is:
    <Operator LAMBDA>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in select_seq_non_boolean
    1. Line 13, column 8 to line 13, column 32 in select_seq_non_boolean
    2. Line 13, column 29 to line 13, column 32 in select_seq_non_boolean
    3. Line 9, column 9 to line 9, column 45 in select_seq_non_boolean
    4. Line 9, column 9 to line 9, column 38 in select_seq_non_boolean
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of SelectSeq should be a boolean-valued operator, but instead it is:
    <Operator LAMBDA>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in select_seq_non_boolean
    1. Line 12, column 12 to line 12, column 36 in select_seq_non_boolean
    2. Line 12, column 33 to line 12, column 36 in select_seq_non_boolean
    3. Line 9, column 9 to line 9, column 45 in select_seq_non_boolean
    4. Line 9, column 9 to line 9, column 38 in select_seq_non_boolean
---*)
