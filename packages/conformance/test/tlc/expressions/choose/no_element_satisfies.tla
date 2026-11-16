(*---
description: "CHOOSE with no satisfying element is an error."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE no_element_satisfies ----
EXTENDS Integers
Test == (CHOOSE x \in 1..3 : x > 3) = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module no_element_satisfies failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 9, col 10 to line 9, col 34 of module no_element_satisfies
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 9, col 10 to line 9, col 34 of module no_element_satisfies
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in no_element_satisfies
    1. Line 11, column 29 to line 11, column 32 in no_element_satisfies
    2. Line 9, column 9 to line 9, column 39 in no_element_satisfies
    3. Line 9, column 10 to line 9, column 34 in no_element_satisfies
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 9, col 10 to line 9, col 34 of module no_element_satisfies
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in no_element_satisfies
    1. Line 12, column 30 to line 12, column 33 in no_element_satisfies
    2. Line 9, column 9 to line 9, column 39 in no_element_satisfies
    3. Line 9, column 10 to line 9, column 34 in no_element_satisfies
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 9, col 10 to line 9, col 34 of module no_element_satisfies
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in no_element_satisfies
    1. Line 13, column 8 to line 13, column 32 in no_element_satisfies
    2. Line 13, column 29 to line 13, column 32 in no_element_satisfies
    3. Line 9, column 9 to line 9, column 39 in no_element_satisfies
    4. Line 9, column 10 to line 9, column 34 in no_element_satisfies
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 9, col 10 to line 9, col 34 of module no_element_satisfies
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in no_element_satisfies
    1. Line 12, column 12 to line 12, column 36 in no_element_satisfies
    2. Line 12, column 33 to line 12, column 36 in no_element_satisfies
    3. Line 9, column 9 to line 9, column 39 in no_element_satisfies
    4. Line 9, column 10 to line 9, column 34 in no_element_satisfies
---*)
