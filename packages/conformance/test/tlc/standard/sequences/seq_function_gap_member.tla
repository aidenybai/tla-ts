(*---
description: A function that is no sequence makes the membership an error, not FALSE.
ref: tlc2/module/Sequences.java#member
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE seq_function_gap_member ----
EXTENDS Sequences, Naturals, TLC
Test == (2 :> 1) \in Seq({1})
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module seq_function_gap_member failed.
    2158:0 Attempted to check if the value:
    (2 :> 1)
    is an element of Seq({1}).
init:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    (2 :> 1)
    is an element of Seq({1}).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_function_gap_member
    1. Line 14, column 29 to line 14, column 32 in seq_function_gap_member
    2. Line 12, column 9 to line 12, column 29 in seq_function_gap_member
next:
  exit: 255
  transcript: |-
    2158:1 Attempted to check if the value:
    (2 :> 1)
    is an element of Seq({1}).
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in seq_function_gap_member
    1. Line 15, column 30 to line 15, column 33 in seq_function_gap_member
    2. Line 12, column 9 to line 12, column 29 in seq_function_gap_member
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    (2 :> 1)
    is an element of Seq({1}).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_function_gap_member
    1. Line 16, column 8 to line 16, column 32 in seq_function_gap_member
    2. Line 16, column 29 to line 16, column 32 in seq_function_gap_member
    3. Line 12, column 9 to line 12, column 29 in seq_function_gap_member
property:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    (2 :> 1)
    is an element of Seq({1}).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_function_gap_member
    1. Line 15, column 12 to line 15, column 36 in seq_function_gap_member
    2. Line 15, column 33 to line 15, column 36 in seq_function_gap_member
    3. Line 12, column 9 to line 12, column 29 in seq_function_gap_member
---*)
