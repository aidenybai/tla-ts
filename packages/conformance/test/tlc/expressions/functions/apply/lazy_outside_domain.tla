(*---
description: "Applying a lazy function outside its domain reports a different message from a function record."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE lazy_outside_domain ----
EXTENDS Integers
Test == [x \in Nat |-> x][-1] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module lazy_outside_domain failed.
    In applying the function
    [x \in Nat |-> <expression line 9, col 24 to line 9, col 24 of module lazy_outside_domain>],
    the first argument is:
    -1
    which is not in its domain.
init:
  exit: 75
  transcript: |-
    1000:1 In applying the function
    [x \in Nat |-> <expression line 9, col 24 to line 9, col 24 of module lazy_outside_domain>],
    the first argument is:
    -1
    which is not in its domain.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_outside_domain
    1. Line 11, column 29 to line 11, column 32 in lazy_outside_domain
    2. Line 9, column 9 to line 9, column 33 in lazy_outside_domain
    3. Line 9, column 9 to line 9, column 29 in lazy_outside_domain
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : In applying the function
    [x \in Nat |-> <expression line 9, col 24 to line 9, col 24 of module lazy_outside_domain>],
    the first argument is:
    -1
    which is not in its domain.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in lazy_outside_domain
    1. Line 12, column 30 to line 12, column 33 in lazy_outside_domain
    2. Line 9, column 9 to line 9, column 33 in lazy_outside_domain
    3. Line 9, column 9 to line 9, column 29 in lazy_outside_domain
invariant:
  exit: 75
  transcript: |-
    2102:1 In applying the function
    [x \in Nat |-> <expression line 9, col 24 to line 9, col 24 of module lazy_outside_domain>],
    the first argument is:
    -1
    which is not in its domain.

    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_outside_domain
    1. Line 13, column 8 to line 13, column 32 in lazy_outside_domain
    2. Line 13, column 29 to line 13, column 32 in lazy_outside_domain
    3. Line 9, column 9 to line 9, column 33 in lazy_outside_domain
    4. Line 9, column 9 to line 9, column 29 in lazy_outside_domain
property:
  exit: 75
  transcript: |-
    2102:1 In applying the function
    [x \in Nat |-> <expression line 9, col 24 to line 9, col 24 of module lazy_outside_domain>],
    the first argument is:
    -1
    which is not in its domain.

    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_outside_domain
    1. Line 12, column 12 to line 12, column 36 in lazy_outside_domain
    2. Line 12, column 33 to line 12, column 36 in lazy_outside_domain
    3. Line 9, column 9 to line 9, column 33 in lazy_outside_domain
    4. Line 9, column 9 to line 9, column 29 in lazy_outside_domain
---*)
