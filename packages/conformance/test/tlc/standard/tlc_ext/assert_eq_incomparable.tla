(*---
description: "AssertEq has no protection against incomparable values: the # at the start fails."
ref: tla2sany/StandardModules/TLCExt.tla
features:
  - TLCExt
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE assert_eq_incomparable ----
EXTENDS TLCExt, TLC, Naturals
Test == AssertEq(1, "a")
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module assert_eq_incomparable failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in assert_eq_incomparable
    1. Line 14, column 29 to line 14, column 32 in assert_eq_incomparable
    2. Line 12, column 9 to line 12, column 24 in assert_eq_incomparable
    3. Line 15, column 5 to line 20, column 14 in TLCExt
    4. Line 15, column 8 to line 15, column 12 in TLCExt
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
    0. Line 15, column 9 to line 15, column 33 in assert_eq_incomparable
    1. Line 15, column 30 to line 15, column 33 in assert_eq_incomparable
    2. Line 12, column 9 to line 12, column 24 in assert_eq_incomparable
    3. Line 15, column 5 to line 20, column 14 in TLCExt
    4. Line 15, column 8 to line 15, column 12 in TLCExt
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in assert_eq_incomparable
    1. Line 16, column 8 to line 16, column 32 in assert_eq_incomparable
    2. Line 16, column 29 to line 16, column 32 in assert_eq_incomparable
    3. Line 12, column 9 to line 12, column 24 in assert_eq_incomparable
    4. Line 15, column 5 to line 20, column 14 in TLCExt
    5. Line 15, column 8 to line 15, column 12 in TLCExt
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in assert_eq_incomparable
    1. Line 15, column 12 to line 15, column 36 in assert_eq_incomparable
    2. Line 15, column 33 to line 15, column 36 in assert_eq_incomparable
    3. Line 12, column 9 to line 12, column 24 in assert_eq_incomparable
    4. Line 15, column 5 to line 20, column 14 in TLCExt
    5. Line 15, column 8 to line 15, column 12 in TLCExt
---*)
