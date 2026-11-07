(*---
description: "A lazy multi-bound function indexes past a short argument tuple, which surfaces as ArrayIndexOutOfBoundsException."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
features: [tlc-bug]
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE lazy_too_few_arguments ----
EXTENDS Integers
Test == [x, y \in Nat |-> x + y][<<1>>] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 11 of module lazy_too_few_arguments failed.
    Index 1 out of bounds for length 1
init:
  exit: 75
  transcript: |-
    1000:1 Index 1 out of bounds for length 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.ArrayIndexOutOfBoundsException
    : Index 1 out of bounds for length 1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
invariant:
  exit: 75
  transcript: |-
    2102:1 Index 1 out of bounds for length 1
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
property:
  exit: 75
  transcript: |-
    2102:1 Index 1 out of bounds for length 1
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
---*)
