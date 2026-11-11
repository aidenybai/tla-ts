(*---
description: "The lazy path checks tuple length and reports it when enumerating."
ref: "tlc2/value/impl/SetPredValue.java#Enumerator"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE tuple_binder_lazy_wrong_length ----
EXTENDS Integers
Test == {<<a, b>> \in {1} \X {2} \X {3} : TRUE} # {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module tuple_binder_lazy_wrong_length failed.
    Attempted to check if the value:
    <<1, 2, 3>>
    is an element of a set of 2-tuples.
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check if the value:
    <<1, 2, 3>>
    is an element of a set of 2-tuples.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in tuple_binder_lazy_wrong_length
    1. Line 11, column 29 to line 11, column 32 in tuple_binder_lazy_wrong_length
    2. Line 9, column 9 to line 9, column 52 in tuple_binder_lazy_wrong_length
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check if the value:
    <<1, 2, 3>>
    is an element of a set of 2-tuples.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in tuple_binder_lazy_wrong_length
    1. Line 12, column 30 to line 12, column 33 in tuple_binder_lazy_wrong_length
    2. Line 9, column 9 to line 9, column 52 in tuple_binder_lazy_wrong_length
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if the value:
    <<1, 2, 3>>
    is an element of a set of 2-tuples.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in tuple_binder_lazy_wrong_length
    1. Line 13, column 8 to line 13, column 32 in tuple_binder_lazy_wrong_length
    2. Line 13, column 29 to line 13, column 32 in tuple_binder_lazy_wrong_length
    3. Line 9, column 9 to line 9, column 52 in tuple_binder_lazy_wrong_length
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if the value:
    <<1, 2, 3>>
    is an element of a set of 2-tuples.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in tuple_binder_lazy_wrong_length
    1. Line 12, column 12 to line 12, column 36 in tuple_binder_lazy_wrong_length
    2. Line 12, column 33 to line 12, column 36 in tuple_binder_lazy_wrong_length
    3. Line 9, column 9 to line 9, column 52 in tuple_binder_lazy_wrong_length
---*)
