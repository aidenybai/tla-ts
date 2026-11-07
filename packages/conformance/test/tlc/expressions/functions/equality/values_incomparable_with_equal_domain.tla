(*---
description: "A function record compares values when the keys agree."
ref: "tlc2/value/impl/FcnRcdValue.java#equals"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE values_incomparable_with_equal_domain ----
EXTENDS Integers
Test == [x \in {1} |-> "a"] = [x \in {1} |-> 1]
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module values_incomparable_with_equal_domain failed.
    Attempted to check equality of string "a" with non-string:
    1
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in values_incomparable_with_equal_domain
    1. Line 11, column 29 to line 11, column 32 in values_incomparable_with_equal_domain
    2. Line 9, column 9 to line 9, column 47 in values_incomparable_with_equal_domain
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check equality of string "a" with non-string:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in values_incomparable_with_equal_domain
    1. Line 12, column 30 to line 12, column 33 in values_incomparable_with_equal_domain
    2. Line 9, column 9 to line 9, column 47 in values_incomparable_with_equal_domain
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of string "a" with non-string:
    1
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in values_incomparable_with_equal_domain
    1. Line 13, column 8 to line 13, column 32 in values_incomparable_with_equal_domain
    2. Line 13, column 29 to line 13, column 32 in values_incomparable_with_equal_domain
    3. Line 9, column 9 to line 9, column 47 in values_incomparable_with_equal_domain
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of string "a" with non-string:
    1
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in values_incomparable_with_equal_domain
    1. Line 12, column 12 to line 12, column 36 in values_incomparable_with_equal_domain
    2. Line 12, column 33 to line 12, column 36 in values_incomparable_with_equal_domain
    3. Line 9, column 9 to line 9, column 47 in values_incomparable_with_equal_domain
---*)
