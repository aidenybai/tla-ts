(*---
description: x \in Real fails, because a string is not a set.
ref: tlc2/value/impl/StringValue.java#member
features:
  - Reals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE real_membership ----
EXTENDS Reals
Test == 1 \in Real
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module real_membership failed.
    Attempted to check if the value:
    1
    is an element of the string "Reals"
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check if the value:
    1
    is an element of the string "Reals"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in real_membership
    1. Line 14, column 29 to line 14, column 32 in real_membership
    2. Line 12, column 9 to line 12, column 18 in real_membership
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check if the value:
    1
    is an element of the string "Reals"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in real_membership
    1. Line 15, column 30 to line 15, column 33 in real_membership
    2. Line 12, column 9 to line 12, column 18 in real_membership
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if the value:
    1
    is an element of the string "Reals"
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in real_membership
    1. Line 16, column 8 to line 16, column 32 in real_membership
    2. Line 16, column 29 to line 16, column 32 in real_membership
    3. Line 12, column 9 to line 12, column 18 in real_membership
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if the value:
    1
    is an element of the string "Reals"
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in real_membership
    1. Line 15, column 12 to line 15, column 36 in real_membership
    2. Line 15, column 33 to line 15, column 36 in real_membership
    3. Line 12, column 9 to line 12, column 18 in real_membership
---*)
