(*---
description: The message prints a named operator when its result is not Boolean.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE selectseq_non_boolean_named ----
EXTENDS Sequences, Naturals
NotBool(e) == e
Test == SelectSeq(<<1>>, NotBool) = <<>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 14, col 8 to line 14, col 11 of module selectseq_non_boolean_named failed.
    2169:0 The second argument of SelectSeq should be a boolean-valued operator, but instead it is:
    <Operator NotBool>
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of SelectSeq should be a boolean-valued operator, but instead it is:
    <Operator NotBool>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in selectseq_non_boolean_named
    1. Line 15, column 29 to line 15, column 32 in selectseq_non_boolean_named
    2. Line 13, column 9 to line 13, column 40 in selectseq_non_boolean_named
    3. Line 13, column 9 to line 13, column 33 in selectseq_non_boolean_named
next:
  exit: 255
  transcript: |-
    2169:1 The second argument of SelectSeq should be a boolean-valued operator, but instead it is:
    <Operator NotBool>
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 33 in selectseq_non_boolean_named
    1. Line 16, column 30 to line 16, column 33 in selectseq_non_boolean_named
    2. Line 13, column 9 to line 13, column 40 in selectseq_non_boolean_named
    3. Line 13, column 9 to line 13, column 33 in selectseq_non_boolean_named
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of SelectSeq should be a boolean-valued operator, but instead it is:
    <Operator NotBool>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in selectseq_non_boolean_named
    1. Line 17, column 8 to line 17, column 32 in selectseq_non_boolean_named
    2. Line 17, column 29 to line 17, column 32 in selectseq_non_boolean_named
    3. Line 13, column 9 to line 13, column 40 in selectseq_non_boolean_named
    4. Line 13, column 9 to line 13, column 33 in selectseq_non_boolean_named
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of SelectSeq should be a boolean-valued operator, but instead it is:
    <Operator NotBool>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in selectseq_non_boolean_named
    1. Line 16, column 12 to line 16, column 36 in selectseq_non_boolean_named
    2. Line 16, column 33 to line 16, column 36 in selectseq_non_boolean_named
    3. Line 13, column 9 to line 13, column 40 in selectseq_non_boolean_named
    4. Line 13, column 9 to line 13, column 33 in selectseq_non_boolean_named
---*)
