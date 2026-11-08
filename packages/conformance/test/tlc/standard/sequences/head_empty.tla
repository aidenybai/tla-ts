(*---
description: Head of the empty sequence names Head in its own message.
ref: tlc2/module/Sequences.java#Head
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE head_empty ----
EXTENDS Sequences, Naturals
Test == Head(<<>>) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module head_empty failed.
    2184:0 Attempted to apply Head to the empty sequence.
init:
  exit: 75
  transcript: |-
    1000:1 
    2184:0 Attempted to apply Head to the empty sequence.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in head_empty
    1. Line 14, column 29 to line 14, column 32 in head_empty
    2. Line 12, column 9 to line 12, column 22 in head_empty
    3. Line 12, column 9 to line 12, column 18 in head_empty
next:
  exit: 255
  transcript: |-
    2184:1 Attempted to apply Head to the empty sequence.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in head_empty
    1. Line 15, column 30 to line 15, column 33 in head_empty
    2. Line 12, column 9 to line 12, column 22 in head_empty
    3. Line 12, column 9 to line 12, column 18 in head_empty
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2184:0 Attempted to apply Head to the empty sequence.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in head_empty
    1. Line 16, column 8 to line 16, column 32 in head_empty
    2. Line 16, column 29 to line 16, column 32 in head_empty
    3. Line 12, column 9 to line 12, column 22 in head_empty
    4. Line 12, column 9 to line 12, column 18 in head_empty
property:
  exit: 75
  transcript: |-
    1000:1 
    2184:0 Attempted to apply Head to the empty sequence.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in head_empty
    1. Line 15, column 12 to line 15, column 36 in head_empty
    2. Line 15, column 33 to line 15, column 36 in head_empty
    3. Line 12, column 9 to line 12, column 22 in head_empty
    4. Line 12, column 9 to line 12, column 18 in head_empty
---*)
