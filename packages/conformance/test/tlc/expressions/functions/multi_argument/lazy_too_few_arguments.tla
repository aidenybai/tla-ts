(*---
description: "A lazy multi-bound function indexes past a short argument tuple, which surfaces as ArrayIndexOutOfBoundsException."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
features: [tlc-bug]
flags: [expression]
outcome: evaluation-failure
correct:
  assume:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 92, col 8 to line 92, col 11 of module lazy_too_few_arguments failed.
      In applying the function
      [x \in Nat |-> <expression line 91, col 27 to line 91, col 31 of module lazy_too_few_arguments>],
      the argument list is:
      <<1>>
      which does not match its formal parameter.
  init:
    exit: 75
    transcript: |-
      1000:1 In applying the function
      [x \in Nat |-> <expression line 91, col 27 to line 91, col 31 of module lazy_too_few_arguments>],
      the argument list is:
      <<1>>
      which does not match its formal parameter.
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 93, column 9 to line 93, column 32 in lazy_too_few_arguments
      1. Line 93, column 29 to line 93, column 32 in lazy_too_few_arguments
      2. Line 91, column 9 to line 91, column 43 in lazy_too_few_arguments
      3. Line 91, column 9 to line 91, column 39 in lazy_too_few_arguments
  invariant:
    exit: 75
    transcript: |-
      2102:1 In applying the function
      [x \in Nat |-> <expression line 91, col 27 to line 91, col 31 of module lazy_too_few_arguments>],
      the argument list is:
      <<1>>
      which does not match its formal parameter.

      While working on the initial state:
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 93, column 9 to line 93, column 32 in lazy_too_few_arguments
      1. Line 95, column 8 to line 95, column 32 in lazy_too_few_arguments
      2. Line 95, column 29 to line 95, column 32 in lazy_too_few_arguments
      3. Line 91, column 9 to line 91, column 43 in lazy_too_few_arguments
      4. Line 91, column 9 to line 91, column 39 in lazy_too_few_arguments
  next:
    exit: 75
    transcript: |-
      1000:1 TLC threw an unexpected exception.
      This was probably caused by an error in the spec or model.
      See the User Output or TLC Console for clues to what happened.
      The exception was a java.lang.RuntimeException
      : In applying the function
      [x \in Nat |-> <expression line 91, col 27 to line 91, col 31 of module lazy_too_few_arguments>],
      the argument list is:
      <<1>>
      which does not match its formal parameter.
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 94, column 9 to line 94, column 33 in lazy_too_few_arguments
      1. Line 94, column 30 to line 94, column 33 in lazy_too_few_arguments
      2. Line 91, column 9 to line 91, column 43 in lazy_too_few_arguments
      3. Line 91, column 9 to line 91, column 39 in lazy_too_few_arguments
  property:
    exit: 75
    transcript: |-
      2102:1 In applying the function
      [x \in Nat |-> <expression line 91, col 27 to line 91, col 31 of module lazy_too_few_arguments>],
      the argument list is:
      <<1>>
      which does not match its formal parameter.

      While working on the initial state:
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 93, column 9 to line 93, column 32 in lazy_too_few_arguments
      1. Line 94, column 12 to line 94, column 36 in lazy_too_few_arguments
      2. Line 94, column 33 to line 94, column 36 in lazy_too_few_arguments
      3. Line 91, column 9 to line 91, column 43 in lazy_too_few_arguments
      4. Line 91, column 9 to line 91, column 39 in lazy_too_few_arguments
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
