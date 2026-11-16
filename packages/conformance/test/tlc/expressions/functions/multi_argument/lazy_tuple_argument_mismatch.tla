(*---
description: "A lazy function with a tuple binder reports a mismatch at a position whose bound accepts a shorter tuple."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE lazy_tuple_argument_mismatch ----
EXTENDS Integers, Sequences
Test == [<<a, b>> \in Seq(Nat), c \in Nat |-> a][<<1>>, 2] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module lazy_tuple_argument_mismatch failed.
    In applying the function
    [<<a, b>> \in Seq(Nat), c \in Nat |-> <expression line 9, col 47 to line 9, col 47 of module lazy_tuple_argument_mismatch>],
    the argument number 1 is:
    <<1>>
    which does not match its formal parameter.
init:
  exit: 75
  transcript: |-
    1000:1 In applying the function
    [<<a, b>> \in Seq(Nat), c \in Nat |-> <expression line 9, col 47 to line 9, col 47 of module lazy_tuple_argument_mismatch>],
    the argument number 1 is:
    <<1>>
    which does not match its formal parameter.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_tuple_argument_mismatch
    1. Line 11, column 29 to line 11, column 32 in lazy_tuple_argument_mismatch
    2. Line 9, column 9 to line 9, column 62 in lazy_tuple_argument_mismatch
    3. Line 9, column 9 to line 9, column 58 in lazy_tuple_argument_mismatch
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : In applying the function
    [<<a, b>> \in Seq(Nat), c \in Nat |-> <expression line 9, col 47 to line 9, col 47 of module lazy_tuple_argument_mismatch>],
    the argument number 1 is:
    <<1>>
    which does not match its formal parameter.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in lazy_tuple_argument_mismatch
    1. Line 12, column 30 to line 12, column 33 in lazy_tuple_argument_mismatch
    2. Line 9, column 9 to line 9, column 62 in lazy_tuple_argument_mismatch
    3. Line 9, column 9 to line 9, column 58 in lazy_tuple_argument_mismatch
invariant:
  exit: 75
  transcript: |-
    2102:1 In applying the function
    [<<a, b>> \in Seq(Nat), c \in Nat |-> <expression line 9, col 47 to line 9, col 47 of module lazy_tuple_argument_mismatch>],
    the argument number 1 is:
    <<1>>
    which does not match its formal parameter.

    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_tuple_argument_mismatch
    1. Line 13, column 8 to line 13, column 32 in lazy_tuple_argument_mismatch
    2. Line 13, column 29 to line 13, column 32 in lazy_tuple_argument_mismatch
    3. Line 9, column 9 to line 9, column 62 in lazy_tuple_argument_mismatch
    4. Line 9, column 9 to line 9, column 58 in lazy_tuple_argument_mismatch
property:
  exit: 75
  transcript: |-
    2102:1 In applying the function
    [<<a, b>> \in Seq(Nat), c \in Nat |-> <expression line 9, col 47 to line 9, col 47 of module lazy_tuple_argument_mismatch>],
    the argument number 1 is:
    <<1>>
    which does not match its formal parameter.

    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_tuple_argument_mismatch
    1. Line 12, column 12 to line 12, column 36 in lazy_tuple_argument_mismatch
    2. Line 12, column 33 to line 12, column 36 in lazy_tuple_argument_mismatch
    3. Line 9, column 9 to line 9, column 62 in lazy_tuple_argument_mismatch
    4. Line 9, column 9 to line 9, column 58 in lazy_tuple_argument_mismatch
---*)
