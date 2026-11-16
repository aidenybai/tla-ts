(*---
description: "\\E reaches a non-Boolean body value if no earlier witness exists."
ref: "tlc2/tool/impl/Tool.java#OPCODE_be"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE exists_reaches_non_boolean ----
EXTENDS Integers
Test == \E x \in 1..2 : IF x = 2 THEN TRUE ELSE 7
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module exists_reaches_non_boolean failed.
    2215:0 TLC expected a boolean value, but did not find one. line 9, col 9 to line 9, col 49 of module exists_reaches_non_boolean
init:
  exit: 75
  transcript: |-
    1000:1 
    2215:0 TLC expected a boolean value, but did not find one. line 9, col 9 to line 9, col 49 of module exists_reaches_non_boolean
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in exists_reaches_non_boolean
    1. Line 11, column 29 to line 11, column 32 in exists_reaches_non_boolean
    2. Line 9, column 9 to line 9, column 49 in exists_reaches_non_boolean
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2215:0 TLC expected a boolean value, but did not find one. line 9, col 9 to line 9, col 49 of module exists_reaches_non_boolean
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in exists_reaches_non_boolean
    1. Line 12, column 30 to line 12, column 33 in exists_reaches_non_boolean
    2. Line 9, column 9 to line 9, column 49 in exists_reaches_non_boolean
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2215:0 TLC expected a boolean value, but did not find one. line 9, col 9 to line 9, col 49 of module exists_reaches_non_boolean
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in exists_reaches_non_boolean
    1. Line 13, column 8 to line 13, column 32 in exists_reaches_non_boolean
    2. Line 13, column 29 to line 13, column 32 in exists_reaches_non_boolean
    3. Line 9, column 9 to line 9, column 49 in exists_reaches_non_boolean
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2215:0 TLC expected a boolean value, but did not find one. line 9, col 9 to line 9, col 49 of module exists_reaches_non_boolean
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in exists_reaches_non_boolean
    1. Line 12, column 12 to line 12, column 36 in exists_reaches_non_boolean
    2. Line 12, column 33 to line 12, column 36 in exists_reaches_non_boolean
    3. Line 9, column 9 to line 9, column 49 in exists_reaches_non_boolean
---*)
