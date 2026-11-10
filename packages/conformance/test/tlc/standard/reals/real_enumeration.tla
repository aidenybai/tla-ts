(*---
description: \A over Real fails, because a string cannot be enumerated.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - Reals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE real_enumeration ----
EXTENDS Reals
Test == \A x \in Real : x = x
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module real_enumeration failed.
    TLC encountered a non-enumerable quantifier bound
    "Reals".
    line 12, col 18 to line 12, col 21 of module real_enumeration
init:
  exit: 75
  transcript: |-
    1000:1 TLC encountered a non-enumerable quantifier bound
    "Reals".
    line 12, col 18 to line 12, col 21 of module real_enumeration
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in real_enumeration
    1. Line 14, column 29 to line 14, column 32 in real_enumeration
    2. Line 12, column 9 to line 12, column 29 in real_enumeration
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : TLC encountered a non-enumerable quantifier bound
    "Reals".
    line 12, col 18 to line 12, col 21 of module real_enumeration
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in real_enumeration
    1. Line 15, column 30 to line 15, column 33 in real_enumeration
    2. Line 12, column 9 to line 12, column 29 in real_enumeration
invariant:
  exit: 75
  transcript: |-
    2102:1 TLC encountered a non-enumerable quantifier bound
    "Reals".
    line 12, col 18 to line 12, col 21 of module real_enumeration
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in real_enumeration
    1. Line 16, column 8 to line 16, column 32 in real_enumeration
    2. Line 16, column 29 to line 16, column 32 in real_enumeration
    3. Line 12, column 9 to line 12, column 29 in real_enumeration
property:
  exit: 75
  transcript: |-
    2102:1 TLC encountered a non-enumerable quantifier bound
    "Reals".
    line 12, col 18 to line 12, col 21 of module real_enumeration
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in real_enumeration
    1. Line 15, column 12 to line 15, column 36 in real_enumeration
    2. Line 15, column 33 to line 15, column 36 in real_enumeration
    3. Line 12, column 9 to line 12, column 29 in real_enumeration
---*)
