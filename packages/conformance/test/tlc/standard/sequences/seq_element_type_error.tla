(*---
description: A tuple tested against Seq(Nat) errors on a string element, because Nat.member does.
ref: tlc2/module/Sequences.java#member
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE seq_element_type_error ----
EXTENDS Sequences, Naturals
Test == <<"a">> \in Seq(Nat)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
init:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_element_type_error
    1. Line 14, column 29 to line 14, column 32 in seq_element_type_error
    2. Line 12, column 9 to line 12, column 28 in seq_element_type_error
next:
  exit: 255
  transcript: |-
    2158:1 Attempted to check if the value:
    "a"
    is an element of Nat.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in seq_element_type_error
    1. Line 15, column 30 to line 15, column 33 in seq_element_type_error
    2. Line 12, column 9 to line 12, column 28 in seq_element_type_error
invariant:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_element_type_error
    1. Line 16, column 8 to line 16, column 32 in seq_element_type_error
    2. Line 16, column 29 to line 16, column 32 in seq_element_type_error
    3. Line 12, column 9 to line 12, column 28 in seq_element_type_error
property:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_element_type_error
    1. Line 15, column 12 to line 15, column 36 in seq_element_type_error
    2. Line 15, column 33 to line 15, column 36 in seq_element_type_error
    3. Line 12, column 9 to line 12, column 28 in seq_element_type_error
---*)
