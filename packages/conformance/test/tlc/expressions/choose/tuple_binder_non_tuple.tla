(*---
description: "CHOOSE with a tuple binder rejects a non-tuple."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE tuple_binder_non_tuple ----
EXTENDS Integers
Test == (CHOOSE <<a, b>> \in {1} : TRUE) = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module tuple_binder_non_tuple failed.
    Attempted to compute the value of an expression of form
    CHOOSE <<x1, ... , xN>> \in S: P, but S was not a set
    of N-tuples.
    line 9, col 10 to line 9, col 39 of module tuple_binder_non_tuple
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to compute the value of an expression of form
    CHOOSE <<x1, ... , xN>> \in S: P, but S was not a set
    of N-tuples.
    line 9, col 10 to line 9, col 39 of module tuple_binder_non_tuple
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in tuple_binder_non_tuple
    1. Line 11, column 29 to line 11, column 32 in tuple_binder_non_tuple
    2. Line 9, column 9 to line 9, column 44 in tuple_binder_non_tuple
    3. Line 9, column 10 to line 9, column 39 in tuple_binder_non_tuple
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compute the value of an expression of form
    CHOOSE <<x1, ... , xN>> \in S: P, but S was not a set
    of N-tuples.
    line 9, col 10 to line 9, col 39 of module tuple_binder_non_tuple
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in tuple_binder_non_tuple
    1. Line 12, column 30 to line 12, column 33 in tuple_binder_non_tuple
    2. Line 9, column 9 to line 9, column 44 in tuple_binder_non_tuple
    3. Line 9, column 10 to line 9, column 39 in tuple_binder_non_tuple
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to compute the value of an expression of form
    CHOOSE <<x1, ... , xN>> \in S: P, but S was not a set
    of N-tuples.
    line 9, col 10 to line 9, col 39 of module tuple_binder_non_tuple
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in tuple_binder_non_tuple
    1. Line 13, column 8 to line 13, column 32 in tuple_binder_non_tuple
    2. Line 13, column 29 to line 13, column 32 in tuple_binder_non_tuple
    3. Line 9, column 9 to line 9, column 44 in tuple_binder_non_tuple
    4. Line 9, column 10 to line 9, column 39 in tuple_binder_non_tuple
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to compute the value of an expression of form
    CHOOSE <<x1, ... , xN>> \in S: P, but S was not a set
    of N-tuples.
    line 9, col 10 to line 9, col 39 of module tuple_binder_non_tuple
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in tuple_binder_non_tuple
    1. Line 12, column 12 to line 12, column 36 in tuple_binder_non_tuple
    2. Line 12, column 33 to line 12, column 36 in tuple_binder_non_tuple
    3. Line 9, column 9 to line 9, column 44 in tuple_binder_non_tuple
    4. Line 9, column 10 to line 9, column 39 in tuple_binder_non_tuple
---*)
