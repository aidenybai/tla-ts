(*---
description: A non-empty tuple tests its elements against the range, here an integer.
ref: tlc2/module/Sequences.java#member
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE seq_bad_range_element ----
EXTENDS Sequences, Naturals
Test == <<1>> \in Seq(3)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module seq_bad_range_element failed.
    Attempted to check if the value:
    1
    is an element of the integer 3
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check if the value:
    1
    is an element of the integer 3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_bad_range_element
    1. Line 14, column 29 to line 14, column 32 in seq_bad_range_element
    2. Line 12, column 9 to line 12, column 24 in seq_bad_range_element
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check if the value:
    1
    is an element of the integer 3
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in seq_bad_range_element
    1. Line 15, column 30 to line 15, column 33 in seq_bad_range_element
    2. Line 12, column 9 to line 12, column 24 in seq_bad_range_element
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if the value:
    1
    is an element of the integer 3
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_bad_range_element
    1. Line 16, column 8 to line 16, column 32 in seq_bad_range_element
    2. Line 16, column 29 to line 16, column 32 in seq_bad_range_element
    3. Line 12, column 9 to line 12, column 24 in seq_bad_range_element
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if the value:
    1
    is an element of the integer 3
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_bad_range_element
    1. Line 15, column 12 to line 15, column 36 in seq_bad_range_element
    2. Line 15, column 33 to line 15, column 36 in seq_bad_range_element
    3. Line 12, column 9 to line 12, column 24 in seq_bad_range_element
---*)
