(*---
description: "A function on an interval rejects even an untyped model value as a non-integer argument."
ref: "tlc2/value/impl/FcnRcdValue.java#select"
flags: [expression]
outcome: evaluation-failure
config: |
  CONSTANT mv = mv
---*)
---- MODULE interval_domain_model_value ----
EXTENDS Integers
CONSTANT mv
F == [x \in 1..2 |-> x]
Test == F[mv] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 14, col 8 to line 14, col 11 of module interval_domain_model_value failed.
    Attempted to apply function with integer domain to the non-integer argument mv
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to apply function with integer domain to the non-integer argument mv
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in interval_domain_model_value
    1. Line 15, column 29 to line 15, column 32 in interval_domain_model_value
    2. Line 13, column 9 to line 13, column 17 in interval_domain_model_value
    3. Line 13, column 9 to line 13, column 13 in interval_domain_model_value
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to apply function with integer domain to the non-integer argument mv
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 33 in interval_domain_model_value
    1. Line 16, column 30 to line 16, column 33 in interval_domain_model_value
    2. Line 13, column 9 to line 13, column 17 in interval_domain_model_value
    3. Line 13, column 9 to line 13, column 13 in interval_domain_model_value
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply function with integer domain to the non-integer argument mv
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in interval_domain_model_value
    1. Line 17, column 8 to line 17, column 32 in interval_domain_model_value
    2. Line 17, column 29 to line 17, column 32 in interval_domain_model_value
    3. Line 13, column 9 to line 13, column 17 in interval_domain_model_value
    4. Line 13, column 9 to line 13, column 13 in interval_domain_model_value
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply function with integer domain to the non-integer argument mv
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in interval_domain_model_value
    1. Line 16, column 12 to line 16, column 36 in interval_domain_model_value
    2. Line 16, column 33 to line 16, column 36 in interval_domain_model_value
    3. Line 13, column 9 to line 13, column 17 in interval_domain_model_value
    4. Line 13, column 9 to line 13, column 13 in interval_domain_model_value
---*)
