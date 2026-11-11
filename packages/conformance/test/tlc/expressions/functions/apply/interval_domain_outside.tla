(*---
description: "Applying a function on an interval outside it reports the function and argument."
ref: "tlc2/value/impl/FcnRcdValue.java#apply"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE interval_domain_outside ----
EXTENDS Integers
Test == [x \in 1..2 |-> x][3] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module interval_domain_outside failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
init:
  exit: 75
  transcript: |-
    1000:1 In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in interval_domain_outside
    1. Line 11, column 29 to line 11, column 32 in interval_domain_outside
    2. Line 9, column 9 to line 9, column 33 in interval_domain_outside
    3. Line 9, column 9 to line 9, column 29 in interval_domain_outside
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in interval_domain_outside
    1. Line 12, column 30 to line 12, column 33 in interval_domain_outside
    2. Line 9, column 9 to line 9, column 33 in interval_domain_outside
    3. Line 9, column 9 to line 9, column 29 in interval_domain_outside
invariant:
  exit: 75
  transcript: |-
    2102:1 In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.

    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in interval_domain_outside
    1. Line 13, column 8 to line 13, column 32 in interval_domain_outside
    2. Line 13, column 29 to line 13, column 32 in interval_domain_outside
    3. Line 9, column 9 to line 9, column 33 in interval_domain_outside
    4. Line 9, column 9 to line 9, column 29 in interval_domain_outside
property:
  exit: 75
  transcript: |-
    2102:1 In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.

    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in interval_domain_outside
    1. Line 12, column 12 to line 12, column 36 in interval_domain_outside
    2. Line 12, column 33 to line 12, column 36 in interval_domain_outside
    3. Line 9, column 9 to line 9, column 33 in interval_domain_outside
    4. Line 9, column 9 to line 9, column 29 in interval_domain_outside
---*)
