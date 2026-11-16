(*---
description: "A string is not a tuple to Seq, even Seq(STRING): the membership is an error."
ref: tlc2/module/Sequences.java#member
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE seq_string_member ----
EXTENDS Sequences, Naturals
Test == "abc" \in Seq(STRING)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module seq_string_member failed.
    2158:0 Attempted to check if the value:
    "abc"
    is an element of Seq(STRING).
init:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    "abc"
    is an element of Seq(STRING).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_string_member
    1. Line 14, column 29 to line 14, column 32 in seq_string_member
    2. Line 12, column 9 to line 12, column 29 in seq_string_member
next:
  exit: 255
  transcript: |-
    2158:1 Attempted to check if the value:
    "abc"
    is an element of Seq(STRING).
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in seq_string_member
    1. Line 15, column 30 to line 15, column 33 in seq_string_member
    2. Line 12, column 9 to line 12, column 29 in seq_string_member
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    "abc"
    is an element of Seq(STRING).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_string_member
    1. Line 16, column 8 to line 16, column 32 in seq_string_member
    2. Line 16, column 29 to line 16, column 32 in seq_string_member
    3. Line 12, column 9 to line 12, column 29 in seq_string_member
property:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    "abc"
    is an element of Seq(STRING).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_string_member
    1. Line 15, column 12 to line 15, column 36 in seq_string_member
    2. Line 15, column 33 to line 15, column 36 in seq_string_member
    3. Line 12, column 9 to line 12, column 29 in seq_string_member
---*)
