(*---
description: "Binary search uses compareTo, so a string on a long domain reports the compare message against the middle key, unlike a short domain."
ref: "tlc2/value/impl/FcnRcdValue.java#selectBinarySearch"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE long_domain_compare_error ----
EXTENDS Integers
F == [x \in {y * 2 : y \in 1..40} |-> x]
Test == F["a"] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 11 of module long_domain_compare_error failed.
    Attempted to compare integer 40 with non-integer:
    "a"
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to compare integer 40 with non-integer:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in long_domain_compare_error
    1. Line 12, column 29 to line 12, column 32 in long_domain_compare_error
    2. Line 10, column 9 to line 10, column 18 in long_domain_compare_error
    3. Line 10, column 9 to line 10, column 14 in long_domain_compare_error
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compare integer 40 with non-integer:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 33 in long_domain_compare_error
    1. Line 13, column 30 to line 13, column 33 in long_domain_compare_error
    2. Line 10, column 9 to line 10, column 18 in long_domain_compare_error
    3. Line 10, column 9 to line 10, column 14 in long_domain_compare_error
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare integer 40 with non-integer:
    "a"
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in long_domain_compare_error
    1. Line 14, column 8 to line 14, column 32 in long_domain_compare_error
    2. Line 14, column 29 to line 14, column 32 in long_domain_compare_error
    3. Line 10, column 9 to line 10, column 18 in long_domain_compare_error
    4. Line 10, column 9 to line 10, column 14 in long_domain_compare_error
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare integer 40 with non-integer:
    "a"
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in long_domain_compare_error
    1. Line 13, column 12 to line 13, column 36 in long_domain_compare_error
    2. Line 13, column 33 to line 13, column 36 in long_domain_compare_error
    3. Line 10, column 9 to line 10, column 18 in long_domain_compare_error
    4. Line 10, column 9 to line 10, column 14 in long_domain_compare_error
---*)
