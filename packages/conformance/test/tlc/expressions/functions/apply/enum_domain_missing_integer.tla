(*---
description: "A function on an enumerated domain reports a missing integer."
ref: "tlc2/value/impl/FcnRcdValue.java#apply"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE enum_domain_missing_integer ----
EXTENDS Integers
F == [x \in {1, 3} |-> x]
Test == F[2] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 11 of module enum_domain_missing_integer failed.
    Attempted to apply function:
    (1 :> 1 @@ 3 :> 3)
    to argument 2, which is not in the domain of the function.
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to apply function:
    (1 :> 1 @@ 3 :> 3)
    to argument 2, which is not in the domain of the function.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in enum_domain_missing_integer
    1. Line 12, column 29 to line 12, column 32 in enum_domain_missing_integer
    2. Line 10, column 9 to line 10, column 16 in enum_domain_missing_integer
    3. Line 10, column 9 to line 10, column 12 in enum_domain_missing_integer
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to apply function:
    (1 :> 1 @@ 3 :> 3)
    to argument 2, which is not in the domain of the function.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 33 in enum_domain_missing_integer
    1. Line 13, column 30 to line 13, column 33 in enum_domain_missing_integer
    2. Line 10, column 9 to line 10, column 16 in enum_domain_missing_integer
    3. Line 10, column 9 to line 10, column 12 in enum_domain_missing_integer
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply function:
    (1 :> 1 @@ 3 :> 3)
    to argument 2, which is not in the domain of the function.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in enum_domain_missing_integer
    1. Line 14, column 8 to line 14, column 32 in enum_domain_missing_integer
    2. Line 14, column 29 to line 14, column 32 in enum_domain_missing_integer
    3. Line 10, column 9 to line 10, column 16 in enum_domain_missing_integer
    4. Line 10, column 9 to line 10, column 12 in enum_domain_missing_integer
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply function:
    (1 :> 1 @@ 3 :> 3)
    to argument 2, which is not in the domain of the function.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in enum_domain_missing_integer
    1. Line 13, column 12 to line 13, column 36 in enum_domain_missing_integer
    2. Line 13, column 33 to line 13, column 36 in enum_domain_missing_integer
    3. Line 10, column 9 to line 10, column 16 in enum_domain_missing_integer
    4. Line 10, column 9 to line 10, column 12 in enum_domain_missing_integer
---*)
