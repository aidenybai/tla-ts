(*---
description: "\\E over STRING fails with the general message: Strings has no getNonEnumerableErrorMsg."
ref: tlc2/value/impl/UserObj.java#getNonEnumerableErrorMsg
features:
  - Strings
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE exists_not_enumerable ----
EXTENDS TLC
Test == \E s \in STRING : s = "a"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module exists_not_enumerable failed.
    TLC encountered a non-enumerable quantifier bound
    STRING.
    line 12, col 18 to line 12, col 23 of module exists_not_enumerable
init:
  exit: 75
  transcript: |-
    1000:1 TLC encountered a non-enumerable quantifier bound
    STRING.
    line 12, col 18 to line 12, col 23 of module exists_not_enumerable
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in exists_not_enumerable
    1. Line 14, column 29 to line 14, column 32 in exists_not_enumerable
    2. Line 12, column 9 to line 12, column 33 in exists_not_enumerable
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : TLC encountered a non-enumerable quantifier bound
    STRING.
    line 12, col 18 to line 12, col 23 of module exists_not_enumerable
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in exists_not_enumerable
    1. Line 15, column 30 to line 15, column 33 in exists_not_enumerable
    2. Line 12, column 9 to line 12, column 33 in exists_not_enumerable
invariant:
  exit: 75
  transcript: |-
    2102:1 TLC encountered a non-enumerable quantifier bound
    STRING.
    line 12, col 18 to line 12, col 23 of module exists_not_enumerable
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in exists_not_enumerable
    1. Line 16, column 8 to line 16, column 32 in exists_not_enumerable
    2. Line 16, column 29 to line 16, column 32 in exists_not_enumerable
    3. Line 12, column 9 to line 12, column 33 in exists_not_enumerable
property:
  exit: 75
  transcript: |-
    2102:1 TLC encountered a non-enumerable quantifier bound
    STRING.
    line 12, col 18 to line 12, col 23 of module exists_not_enumerable
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in exists_not_enumerable
    1. Line 15, column 12 to line 15, column 36 in exists_not_enumerable
    2. Line 15, column 33 to line 15, column 36 in exists_not_enumerable
    3. Line 12, column 9 to line 12, column 33 in exists_not_enumerable
---*)
