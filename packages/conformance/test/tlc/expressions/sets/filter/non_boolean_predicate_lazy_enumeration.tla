(*---
description: "Enumerating a lazy filter rejects a non-Boolean predicate with the SetPredValue message."
ref: "tlc2/value/impl/SetPredValue.java#Enumerator"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE non_boolean_predicate_lazy_enumeration ----
EXTENDS Integers
Test == {s \in SUBSET {1} : s} # {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module non_boolean_predicate_lazy_enumeration failed.
    Evaluating predicate line 9, col 29 to line 9, col 29 of module non_boolean_predicate_lazy_enumeration yielded non-Boolean value.
init:
  exit: 75
  transcript: |-
    1000:1 Evaluating predicate line 9, col 29 to line 9, col 29 of module non_boolean_predicate_lazy_enumeration yielded non-Boolean value.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in non_boolean_predicate_lazy_enumeration
    1. Line 11, column 29 to line 11, column 32 in non_boolean_predicate_lazy_enumeration
    2. Line 9, column 9 to line 9, column 35 in non_boolean_predicate_lazy_enumeration
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Evaluating predicate line 9, col 29 to line 9, col 29 of module non_boolean_predicate_lazy_enumeration yielded non-Boolean value.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in non_boolean_predicate_lazy_enumeration
    1. Line 12, column 30 to line 12, column 33 in non_boolean_predicate_lazy_enumeration
    2. Line 9, column 9 to line 9, column 35 in non_boolean_predicate_lazy_enumeration
invariant:
  exit: 75
  transcript: |-
    2102:1 Evaluating predicate line 9, col 29 to line 9, col 29 of module non_boolean_predicate_lazy_enumeration yielded non-Boolean value.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in non_boolean_predicate_lazy_enumeration
    1. Line 13, column 8 to line 13, column 32 in non_boolean_predicate_lazy_enumeration
    2. Line 13, column 29 to line 13, column 32 in non_boolean_predicate_lazy_enumeration
    3. Line 9, column 9 to line 9, column 35 in non_boolean_predicate_lazy_enumeration
property:
  exit: 75
  transcript: |-
    2102:1 Evaluating predicate line 9, col 29 to line 9, col 29 of module non_boolean_predicate_lazy_enumeration yielded non-Boolean value.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in non_boolean_predicate_lazy_enumeration
    1. Line 12, column 12 to line 12, column 36 in non_boolean_predicate_lazy_enumeration
    2. Line 12, column 33 to line 12, column 36 in non_boolean_predicate_lazy_enumeration
    3. Line 9, column 9 to line 9, column 35 in non_boolean_predicate_lazy_enumeration
---*)
