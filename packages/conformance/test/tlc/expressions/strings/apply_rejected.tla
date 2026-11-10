(*---
description: "A string is not a function in TLC, so \"ab\"[1] is an error."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fa"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE apply_rejected ----
EXTENDS Integers
Test == "ab"[1] = "a"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module apply_rejected failed.
    A non-function (a string) was applied as a function.
    line 9, col 9 to line 9, col 15 of module apply_rejected
init:
  exit: 75
  transcript: |-
    1000:1 A non-function (a string) was applied as a function.
    line 9, col 9 to line 9, col 15 of module apply_rejected
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in apply_rejected
    1. Line 11, column 29 to line 11, column 32 in apply_rejected
    2. Line 9, column 9 to line 9, column 21 in apply_rejected
    3. Line 9, column 9 to line 9, column 15 in apply_rejected
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : A non-function (a string) was applied as a function.
    line 9, col 9 to line 9, col 15 of module apply_rejected
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in apply_rejected
    1. Line 12, column 30 to line 12, column 33 in apply_rejected
    2. Line 9, column 9 to line 9, column 21 in apply_rejected
    3. Line 9, column 9 to line 9, column 15 in apply_rejected
invariant:
  exit: 75
  transcript: |-
    2102:1 A non-function (a string) was applied as a function.
    line 9, col 9 to line 9, col 15 of module apply_rejected
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in apply_rejected
    1. Line 13, column 8 to line 13, column 32 in apply_rejected
    2. Line 13, column 29 to line 13, column 32 in apply_rejected
    3. Line 9, column 9 to line 9, column 21 in apply_rejected
    4. Line 9, column 9 to line 9, column 15 in apply_rejected
property:
  exit: 75
  transcript: |-
    2102:1 A non-function (a string) was applied as a function.
    line 9, col 9 to line 9, col 15 of module apply_rejected
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in apply_rejected
    1. Line 12, column 12 to line 12, column 36 in apply_rejected
    2. Line 12, column 33 to line 12, column 36 in apply_rejected
    3. Line 9, column 9 to line 9, column 21 in apply_rejected
    4. Line 9, column 9 to line 9, column 15 in apply_rejected
---*)
