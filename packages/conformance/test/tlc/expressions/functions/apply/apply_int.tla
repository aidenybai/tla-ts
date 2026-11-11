(*---
description: "Applying an integer reports a non-function."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fa"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE apply_int ----
EXTENDS Integers
Test == LET n == 1 IN n[1] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module apply_int failed.
    A non-function (an integer) was applied as a function.
    line 9, col 23 to line 9, col 26 of module apply_int
init:
  exit: 75
  transcript: |-
    1000:1 A non-function (an integer) was applied as a function.
    line 9, col 23 to line 9, col 26 of module apply_int
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in apply_int
    1. Line 11, column 29 to line 11, column 32 in apply_int
    2. Line 9, column 9 to line 9, column 30 in apply_int
    3. Line 9, column 23 to line 9, column 30 in apply_int
    4. Line 9, column 23 to line 9, column 26 in apply_int
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : A non-function (an integer) was applied as a function.
    line 9, col 23 to line 9, col 26 of module apply_int
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in apply_int
    1. Line 12, column 30 to line 12, column 33 in apply_int
    2. Line 9, column 9 to line 9, column 30 in apply_int
    3. Line 9, column 23 to line 9, column 30 in apply_int
    4. Line 9, column 23 to line 9, column 26 in apply_int
invariant:
  exit: 75
  transcript: |-
    2102:1 A non-function (an integer) was applied as a function.
    line 9, col 23 to line 9, col 26 of module apply_int
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in apply_int
    1. Line 13, column 8 to line 13, column 32 in apply_int
    2. Line 13, column 29 to line 13, column 32 in apply_int
    3. Line 9, column 9 to line 9, column 30 in apply_int
    4. Line 9, column 23 to line 9, column 30 in apply_int
    5. Line 9, column 23 to line 9, column 26 in apply_int
property:
  exit: 75
  transcript: |-
    2102:1 A non-function (an integer) was applied as a function.
    line 9, col 23 to line 9, col 26 of module apply_int
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in apply_int
    1. Line 12, column 12 to line 12, column 36 in apply_int
    2. Line 12, column 33 to line 12, column 36 in apply_int
    3. Line 9, column 9 to line 9, column 30 in apply_int
    4. Line 9, column 23 to line 9, column 30 in apply_int
    5. Line 9, column 23 to line 9, column 26 in apply_int
---*)
