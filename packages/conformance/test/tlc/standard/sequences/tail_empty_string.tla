(*---
description: Tail of the empty string gives the same empty sequence message.
ref: tlc2/module/Sequences.java#Tail
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE tail_empty_string ----
EXTENDS Sequences, Naturals
Test == Tail("") = ""
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
init:
  exit: 75
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in tail_empty_string
    1. Line 14, column 29 to line 14, column 32 in tail_empty_string
    2. Line 12, column 9 to line 12, column 21 in tail_empty_string
    3. Line 12, column 9 to line 12, column 16 in tail_empty_string
next:
  exit: 255
  transcript: |-
    2184:1 Attempted to apply Tail to the empty sequence.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in tail_empty_string
    1. Line 15, column 30 to line 15, column 33 in tail_empty_string
    2. Line 12, column 9 to line 12, column 21 in tail_empty_string
    3. Line 12, column 9 to line 12, column 16 in tail_empty_string
invariant:
  exit: 75
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in tail_empty_string
    1. Line 16, column 8 to line 16, column 32 in tail_empty_string
    2. Line 16, column 29 to line 16, column 32 in tail_empty_string
    3. Line 12, column 9 to line 12, column 21 in tail_empty_string
    4. Line 12, column 9 to line 12, column 16 in tail_empty_string
property:
  exit: 75
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in tail_empty_string
    1. Line 15, column 12 to line 15, column 36 in tail_empty_string
    2. Line 15, column 33 to line 15, column 36 in tail_empty_string
    3. Line 12, column 9 to line 12, column 21 in tail_empty_string
    4. Line 12, column 9 to line 12, column 16 in tail_empty_string
---*)
