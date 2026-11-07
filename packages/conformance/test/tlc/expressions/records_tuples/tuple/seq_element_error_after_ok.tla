(*---
description: "Seq(S) reaches a later element that S rejects."
ref: "tlc2/module/Sequences.java#member"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE seq_element_error_after_ok ----
EXTENDS Integers, Sequences
Test == <<1, "a">> \in Seq(Nat)
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
    0. Line 11, column 9 to line 11, column 32 in seq_element_error_after_ok
    1. Line 11, column 29 to line 11, column 32 in seq_element_error_after_ok
    2. Line 9, column 9 to line 9, column 31 in seq_element_error_after_ok
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
    0. Line 12, column 9 to line 12, column 33 in seq_element_error_after_ok
    1. Line 12, column 30 to line 12, column 33 in seq_element_error_after_ok
    2. Line 9, column 9 to line 9, column 31 in seq_element_error_after_ok
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
    0. Line 11, column 9 to line 11, column 32 in seq_element_error_after_ok
    1. Line 13, column 8 to line 13, column 32 in seq_element_error_after_ok
    2. Line 13, column 29 to line 13, column 32 in seq_element_error_after_ok
    3. Line 9, column 9 to line 9, column 31 in seq_element_error_after_ok
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
    0. Line 11, column 9 to line 11, column 32 in seq_element_error_after_ok
    1. Line 12, column 12 to line 12, column 36 in seq_element_error_after_ok
    2. Line 12, column 33 to line 12, column 36 in seq_element_error_after_ok
    3. Line 9, column 9 to line 9, column 31 in seq_element_error_after_ok
---*)
