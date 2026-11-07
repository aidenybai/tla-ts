(*---
description: "A function on an interval rejects a non-integer argument with its own message."
ref: "tlc2/value/impl/FcnRcdValue.java#select"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE interval_domain_non_integer ----
EXTENDS Integers
F == [x \in 1..2 |-> x]
Test == F["a"] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 11 of module interval_domain_non_integer failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to apply function with integer domain to the non-integer argument "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in interval_domain_non_integer
    1. Line 12, column 29 to line 12, column 32 in interval_domain_non_integer
    2. Line 10, column 9 to line 10, column 18 in interval_domain_non_integer
    3. Line 10, column 9 to line 10, column 14 in interval_domain_non_integer
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to apply function with integer domain to the non-integer argument "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 33 in interval_domain_non_integer
    1. Line 13, column 30 to line 13, column 33 in interval_domain_non_integer
    2. Line 10, column 9 to line 10, column 18 in interval_domain_non_integer
    3. Line 10, column 9 to line 10, column 14 in interval_domain_non_integer
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply function with integer domain to the non-integer argument "a"
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in interval_domain_non_integer
    1. Line 14, column 8 to line 14, column 32 in interval_domain_non_integer
    2. Line 14, column 29 to line 14, column 32 in interval_domain_non_integer
    3. Line 10, column 9 to line 10, column 18 in interval_domain_non_integer
    4. Line 10, column 9 to line 10, column 14 in interval_domain_non_integer
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply function with integer domain to the non-integer argument "a"
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in interval_domain_non_integer
    1. Line 13, column 12 to line 13, column 36 in interval_domain_non_integer
    2. Line 13, column 33 to line 13, column 36 in interval_domain_non_integer
    3. Line 10, column 9 to line 10, column 18 in interval_domain_non_integer
    4. Line 10, column 9 to line 10, column 14 in interval_domain_non_integer
---*)
