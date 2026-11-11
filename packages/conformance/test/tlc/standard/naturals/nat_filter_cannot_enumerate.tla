(*---
description: Enumerating a filter over Nat fails.
ref: tlc2/value/impl/SetPredValue.java#elements
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE nat_filter_cannot_enumerate ----
EXTENDS Naturals
Test == {n \in Nat : n < 2} = {0, 1}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module nat_filter_cannot_enumerate failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nat_filter_cannot_enumerate
    1. Line 14, column 29 to line 14, column 32 in nat_filter_cannot_enumerate
    2. Line 12, column 9 to line 12, column 36 in nat_filter_cannot_enumerate
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in nat_filter_cannot_enumerate
    1. Line 15, column 30 to line 15, column 33 in nat_filter_cannot_enumerate
    2. Line 12, column 9 to line 12, column 36 in nat_filter_cannot_enumerate
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nat_filter_cannot_enumerate
    1. Line 16, column 8 to line 16, column 32 in nat_filter_cannot_enumerate
    2. Line 16, column 29 to line 16, column 32 in nat_filter_cannot_enumerate
    3. Line 12, column 9 to line 12, column 36 in nat_filter_cannot_enumerate
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nat_filter_cannot_enumerate
    1. Line 15, column 12 to line 15, column 36 in nat_filter_cannot_enumerate
    2. Line 15, column 33 to line 15, column 36 in nat_filter_cannot_enumerate
    3. Line 12, column 9 to line 12, column 36 in nat_filter_cannot_enumerate
---*)
