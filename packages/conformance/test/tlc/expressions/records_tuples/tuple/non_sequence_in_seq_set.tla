(*---
description: "A function that is not a tuple cannot be checked against Seq."
ref: "tlc2/module/Sequences.java#member"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE non_sequence_in_seq_set ----
EXTENDS Integers, Sequences, TLC
Test == (2 :> 1) \in Seq(Nat)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    (2 :> 1)
    is an element of Seq(Nat).
    2158:0 Attempted to check if the value:
    (2 :> 1)
    is an element of Seq(Nat).
init:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    (2 :> 1)
    is an element of Seq(Nat).
    2158:0 Attempted to check if the value:
    (2 :> 1)
    is an element of Seq(Nat).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in non_sequence_in_seq_set
    1. Line 11, column 29 to line 11, column 32 in non_sequence_in_seq_set
    2. Line 9, column 9 to line 9, column 29 in non_sequence_in_seq_set
next:
  exit: 255
  transcript: |-
    2158:1 Attempted to check if the value:
    (2 :> 1)
    is an element of Seq(Nat).
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in non_sequence_in_seq_set
    1. Line 12, column 30 to line 12, column 33 in non_sequence_in_seq_set
    2. Line 9, column 9 to line 9, column 29 in non_sequence_in_seq_set
invariant:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    (2 :> 1)
    is an element of Seq(Nat).
    2158:0 Attempted to check if the value:
    (2 :> 1)
    is an element of Seq(Nat).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in non_sequence_in_seq_set
    1. Line 13, column 8 to line 13, column 32 in non_sequence_in_seq_set
    2. Line 13, column 29 to line 13, column 32 in non_sequence_in_seq_set
    3. Line 9, column 9 to line 9, column 29 in non_sequence_in_seq_set
property:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    (2 :> 1)
    is an element of Seq(Nat).
    2158:0 Attempted to check if the value:
    (2 :> 1)
    is an element of Seq(Nat).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in non_sequence_in_seq_set
    1. Line 12, column 12 to line 12, column 36 in non_sequence_in_seq_set
    2. Line 12, column 33 to line 12, column 36 in non_sequence_in_seq_set
    3. Line 9, column 9 to line 9, column 29 in non_sequence_in_seq_set
---*)
