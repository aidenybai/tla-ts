(*---
description: "Tail of the empty string reports the empty sequence error."
ref: "tlc2/module/Sequences.java#Tail"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE tail_of_empty ----
EXTENDS Integers, Sequences
Test == Tail("") = ""
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module tail_of_empty failed.
    2184:0 Attempted to apply Tail to the empty sequence.
init:
  exit: 75
  transcript: |-
    1000:1 
    2184:0 Attempted to apply Tail to the empty sequence.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in tail_of_empty
    1. Line 11, column 29 to line 11, column 32 in tail_of_empty
    2. Line 9, column 9 to line 9, column 21 in tail_of_empty
    3. Line 9, column 9 to line 9, column 16 in tail_of_empty
next:
  exit: 255
  transcript: |-
    2184:1 Attempted to apply Tail to the empty sequence.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in tail_of_empty
    1. Line 12, column 30 to line 12, column 33 in tail_of_empty
    2. Line 9, column 9 to line 9, column 21 in tail_of_empty
    3. Line 9, column 9 to line 9, column 16 in tail_of_empty
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2184:0 Attempted to apply Tail to the empty sequence.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in tail_of_empty
    1. Line 13, column 8 to line 13, column 32 in tail_of_empty
    2. Line 13, column 29 to line 13, column 32 in tail_of_empty
    3. Line 9, column 9 to line 9, column 21 in tail_of_empty
    4. Line 9, column 9 to line 9, column 16 in tail_of_empty
property:
  exit: 75
  transcript: |-
    1000:1 
    2184:0 Attempted to apply Tail to the empty sequence.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in tail_of_empty
    1. Line 12, column 12 to line 12, column 36 in tail_of_empty
    2. Line 12, column 33 to line 12, column 36 in tail_of_empty
    3. Line 9, column 9 to line 9, column 21 in tail_of_empty
    4. Line 9, column 9 to line 9, column 16 in tail_of_empty
---*)
