(*---
description: "[Any -> {}] asks whether Any is empty, which AnySet deliberately does not answer."
ref: tlc2/module/AnySet.java#isEmpty
features:
  - AnySet
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE is_empty_refused ----
EXTENDS TLC
Test == [Any -> {}] = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module is_empty_refused failed.
    Shouldn't call isEmpty() on value ANY
init:
  exit: 75
  transcript: |-
    1000:1 Shouldn't call isEmpty() on value ANY
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in is_empty_refused
    1. Line 14, column 29 to line 14, column 32 in is_empty_refused
    2. Line 12, column 9 to line 12, column 24 in is_empty_refused
    3. Line 12, column 9 to line 12, column 19 in is_empty_refused


    Reason:
    Shouldn't call isEmpty() on value ANY
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Shouldn't call isEmpty() on value ANY
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 15, column 9 to line 15, column 33 in is_empty_refused
    1. Line 15, column 30 to line 15, column 33 in is_empty_refused
    2. Line 12, column 9 to line 12, column 24 in is_empty_refused
    3. Line 12, column 9 to line 12, column 19 in is_empty_refused


    Reason:
    Shouldn't call isEmpty() on value ANY
invariant:
  exit: 75
  transcript: |-
    2102:1 Shouldn't call isEmpty() on value ANY
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in is_empty_refused
    1. Line 16, column 8 to line 16, column 32 in is_empty_refused
    2. Line 16, column 29 to line 16, column 32 in is_empty_refused
    3. Line 12, column 9 to line 12, column 24 in is_empty_refused
    4. Line 12, column 9 to line 12, column 19 in is_empty_refused


    Reason:
    Shouldn't call isEmpty() on value ANY
property:
  exit: 75
  transcript: |-
    2102:1 Shouldn't call isEmpty() on value ANY
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in is_empty_refused
    1. Line 15, column 12 to line 15, column 36 in is_empty_refused
    2. Line 15, column 33 to line 15, column 36 in is_empty_refused
    3. Line 12, column 9 to line 12, column 24 in is_empty_refused
    4. Line 12, column 9 to line 12, column 19 in is_empty_refused


    Reason:
    Shouldn't call isEmpty() on value ANY
---*)
