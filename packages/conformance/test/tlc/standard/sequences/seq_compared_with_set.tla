(*---
description: Comparing Seq with a finite set is an error.
ref: tlc2/value/impl/UserValue.java#compareTo
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE seq_compared_with_set ----
EXTENDS Sequences, Naturals
Test == Seq({1}) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module seq_compared_with_set failed.
    Attempted to compare overridden value Seq({1}) with non-overridden value:
    {}
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to compare overridden value Seq({1}) with non-overridden value:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_compared_with_set
    1. Line 14, column 29 to line 14, column 32 in seq_compared_with_set
    2. Line 12, column 9 to line 12, column 21 in seq_compared_with_set
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compare overridden value Seq({1}) with non-overridden value:
    {}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in seq_compared_with_set
    1. Line 15, column 30 to line 15, column 33 in seq_compared_with_set
    2. Line 12, column 9 to line 12, column 21 in seq_compared_with_set
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare overridden value Seq({1}) with non-overridden value:
    {}
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_compared_with_set
    1. Line 16, column 8 to line 16, column 32 in seq_compared_with_set
    2. Line 16, column 29 to line 16, column 32 in seq_compared_with_set
    3. Line 12, column 9 to line 12, column 21 in seq_compared_with_set
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare overridden value Seq({1}) with non-overridden value:
    {}
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_compared_with_set
    1. Line 15, column 12 to line 15, column 36 in seq_compared_with_set
    2. Line 15, column 33 to line 15, column 36 in seq_compared_with_set
    3. Line 12, column 9 to line 12, column 21 in seq_compared_with_set
---*)
