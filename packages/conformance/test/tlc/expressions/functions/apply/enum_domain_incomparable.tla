(*---
description: "A short enumerated domain searches linearly, so a string argument hits the equality error."
ref: "tlc2/value/impl/FcnRcdValue.java#selectLinearSearch"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE enum_domain_incomparable ----
EXTENDS Integers
F == [x \in {1, 3} |-> x]
Test == F["a"] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 11 of module enum_domain_incomparable failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in enum_domain_incomparable
    1. Line 12, column 29 to line 12, column 32 in enum_domain_incomparable
    2. Line 10, column 9 to line 10, column 18 in enum_domain_incomparable
    3. Line 10, column 9 to line 10, column 14 in enum_domain_incomparable
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check equality of integer 1 with non-integer:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 33 in enum_domain_incomparable
    1. Line 13, column 30 to line 13, column 33 in enum_domain_incomparable
    2. Line 10, column 9 to line 10, column 18 in enum_domain_incomparable
    3. Line 10, column 9 to line 10, column 14 in enum_domain_incomparable
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in enum_domain_incomparable
    1. Line 14, column 8 to line 14, column 32 in enum_domain_incomparable
    2. Line 14, column 29 to line 14, column 32 in enum_domain_incomparable
    3. Line 10, column 9 to line 10, column 18 in enum_domain_incomparable
    4. Line 10, column 9 to line 10, column 14 in enum_domain_incomparable
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in enum_domain_incomparable
    1. Line 13, column 12 to line 13, column 36 in enum_domain_incomparable
    2. Line 13, column 33 to line 13, column 36 in enum_domain_incomparable
    3. Line 10, column 9 to line 10, column 18 in enum_domain_incomparable
    4. Line 10, column 9 to line 10, column 14 in enum_domain_incomparable
---*)
