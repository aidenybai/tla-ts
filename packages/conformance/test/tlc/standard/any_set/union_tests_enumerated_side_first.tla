(*---
description: Tool's OPCODE_cup lets the Reducible right side build the union, so {1} is tested first and comparing 1 with a string fails before Any can accept it.
ref: tlc2/tool/impl/Tool.java#evalAppl
features:
  - AnySet
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE union_tests_enumerated_side_first ----
EXTENDS TLC
Test == "q" \in Any \cup {1}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module union_tests_enumerated_side_first failed.
    Attempted to check equality of integer 1 with non-integer:
    "q"
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of integer 1 with non-integer:
    "q"
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in union_tests_enumerated_side_first
    1. Line 14, column 29 to line 14, column 32 in union_tests_enumerated_side_first
    2. Line 12, column 9 to line 12, column 28 in union_tests_enumerated_side_first
    3. Line 12, column 17 to line 12, column 28 in union_tests_enumerated_side_first
    4. Line 12, column 26 to line 12, column 28 in union_tests_enumerated_side_first


    Reason:
    Attempted to check equality of integer 1 with non-integer:
    "q"
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check equality of integer 1 with non-integer:
    "q"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 15, column 9 to line 15, column 33 in union_tests_enumerated_side_first
    1. Line 15, column 30 to line 15, column 33 in union_tests_enumerated_side_first
    2. Line 12, column 9 to line 12, column 28 in union_tests_enumerated_side_first
    3. Line 12, column 17 to line 12, column 28 in union_tests_enumerated_side_first
    4. Line 12, column 26 to line 12, column 28 in union_tests_enumerated_side_first


    Reason:
    Attempted to check equality of integer 1 with non-integer:
    "q"
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of integer 1 with non-integer:
    "q"
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in union_tests_enumerated_side_first
    1. Line 16, column 8 to line 16, column 32 in union_tests_enumerated_side_first
    2. Line 16, column 29 to line 16, column 32 in union_tests_enumerated_side_first
    3. Line 12, column 9 to line 12, column 28 in union_tests_enumerated_side_first
    4. Line 12, column 17 to line 12, column 28 in union_tests_enumerated_side_first
    5. Line 12, column 26 to line 12, column 28 in union_tests_enumerated_side_first


    Reason:
    Attempted to check equality of integer 1 with non-integer:
    "q"
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of integer 1 with non-integer:
    "q"
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in union_tests_enumerated_side_first
    1. Line 15, column 12 to line 15, column 36 in union_tests_enumerated_side_first
    2. Line 15, column 33 to line 15, column 36 in union_tests_enumerated_side_first
    3. Line 12, column 9 to line 12, column 28 in union_tests_enumerated_side_first
    4. Line 12, column 17 to line 12, column 28 in union_tests_enumerated_side_first
    5. Line 12, column 26 to line 12, column 28 in union_tests_enumerated_side_first


    Reason:
    Attempted to check equality of integer 1 with non-integer:
    "q"
---*)
