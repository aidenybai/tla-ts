(*---
description: Applying :> outside its key is an error.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE colon_greater_outside_domain ----
EXTENDS TLC, Naturals
Test == (5 :> "v")[6] = "v"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module colon_greater_outside_domain failed.
    Attempted to apply function:
    (5 :> "v")
    to argument 6, which is not in the domain of the function.
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to apply function:
    (5 :> "v")
    to argument 6, which is not in the domain of the function.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in colon_greater_outside_domain
    1. Line 14, column 29 to line 14, column 32 in colon_greater_outside_domain
    2. Line 12, column 9 to line 12, column 27 in colon_greater_outside_domain
    3. Line 12, column 9 to line 12, column 21 in colon_greater_outside_domain
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to apply function:
    (5 :> "v")
    to argument 6, which is not in the domain of the function.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in colon_greater_outside_domain
    1. Line 15, column 30 to line 15, column 33 in colon_greater_outside_domain
    2. Line 12, column 9 to line 12, column 27 in colon_greater_outside_domain
    3. Line 12, column 9 to line 12, column 21 in colon_greater_outside_domain
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply function:
    (5 :> "v")
    to argument 6, which is not in the domain of the function.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in colon_greater_outside_domain
    1. Line 16, column 8 to line 16, column 32 in colon_greater_outside_domain
    2. Line 16, column 29 to line 16, column 32 in colon_greater_outside_domain
    3. Line 12, column 9 to line 12, column 27 in colon_greater_outside_domain
    4. Line 12, column 9 to line 12, column 21 in colon_greater_outside_domain
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply function:
    (5 :> "v")
    to argument 6, which is not in the domain of the function.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in colon_greater_outside_domain
    1. Line 15, column 12 to line 15, column 36 in colon_greater_outside_domain
    2. Line 15, column 33 to line 15, column 36 in colon_greater_outside_domain
    3. Line 12, column 9 to line 12, column 27 in colon_greater_outside_domain
    4. Line 12, column 9 to line 12, column 21 in colon_greater_outside_domain
---*)
