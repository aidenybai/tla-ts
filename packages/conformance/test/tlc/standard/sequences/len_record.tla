(*---
description: A non-empty record is not a sequence.
ref: tlc2/value/impl/RecordValue.java#toTuple
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE len_record ----
EXTENDS Sequences, Naturals
Test == Len([a |-> 1]) = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module len_record failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1]
init:
  exit: 75
  transcript: |-
    1000:1 
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in len_record
    1. Line 14, column 29 to line 14, column 32 in len_record
    2. Line 12, column 9 to line 12, column 26 in len_record
    3. Line 12, column 9 to line 12, column 22 in len_record
next:
  exit: 255
  transcript: |-
    2283:1 The argument of Len should be a sequence, but instead it is:
    [a |-> 1]
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in len_record
    1. Line 15, column 30 to line 15, column 33 in len_record
    2. Line 12, column 9 to line 12, column 26 in len_record
    3. Line 12, column 9 to line 12, column 22 in len_record
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in len_record
    1. Line 16, column 8 to line 16, column 32 in len_record
    2. Line 16, column 29 to line 16, column 32 in len_record
    3. Line 12, column 9 to line 12, column 26 in len_record
    4. Line 12, column 9 to line 12, column 22 in len_record
property:
  exit: 75
  transcript: |-
    1000:1 
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in len_record
    1. Line 15, column 12 to line 15, column 36 in len_record
    2. Line 15, column 33 to line 15, column 36 in len_record
    3. Line 12, column 9 to line 12, column 26 in len_record
    4. Line 12, column 9 to line 12, column 22 in len_record
---*)
