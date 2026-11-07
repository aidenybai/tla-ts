(*---
description: "Membership in a normalized set uses compareTo, so an incomparable probe reports the compare message instead of the equality message."
ref: "tlc2/value/impl/ValueVec.java#search"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE member_normalized_reports_compare_error ----
EXTENDS Integers
S == {1, 2}
Test == "a" \in S
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 11 of module member_normalized_reports_compare_error failed.
    Attempted to compare string "a" with non-string:
    2
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to compare string "a" with non-string:
    2
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in member_normalized_reports_compare_error
    1. Line 12, column 29 to line 12, column 32 in member_normalized_reports_compare_error
    2. Line 10, column 9 to line 10, column 17 in member_normalized_reports_compare_error
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compare string "a" with non-string:
    2
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 33 in member_normalized_reports_compare_error
    1. Line 13, column 30 to line 13, column 33 in member_normalized_reports_compare_error
    2. Line 10, column 9 to line 10, column 17 in member_normalized_reports_compare_error
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare string "a" with non-string:
    2
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in member_normalized_reports_compare_error
    1. Line 14, column 8 to line 14, column 32 in member_normalized_reports_compare_error
    2. Line 14, column 29 to line 14, column 32 in member_normalized_reports_compare_error
    3. Line 10, column 9 to line 10, column 17 in member_normalized_reports_compare_error
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare string "a" with non-string:
    2
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in member_normalized_reports_compare_error
    1. Line 13, column 12 to line 13, column 36 in member_normalized_reports_compare_error
    2. Line 13, column 33 to line 13, column 36 in member_normalized_reports_compare_error
    3. Line 10, column 9 to line 10, column 17 in member_normalized_reports_compare_error
---*)
