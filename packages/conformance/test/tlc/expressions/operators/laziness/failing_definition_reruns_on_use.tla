(*---
description: "A definition that fails at startup keeps no value and runs again where it is used, so its side effect repeats."
ref: "tlc2/tool/impl/SpecProcessor.java#processConstantDefns"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE failing_definition_reruns_on_use ----
EXTENDS Integers, TLC
Bad == IF PrintT(1) THEN CHOOSE x \in {} : TRUE ELSE 0
Test == Bad = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    | 1
    | 1
    | 1
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 11 of module failing_definition_reruns_on_use failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 9, col 26 to line 9, col 47 of module failing_definition_reruns_on_use
init:
  exit: 75
  transcript: |-
    | 1
    | 1
    | 1
    1000:1 Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 9, col 26 to line 9, col 47 of module failing_definition_reruns_on_use
    | 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in failing_definition_reruns_on_use
    1. Line 12, column 29 to line 12, column 32 in failing_definition_reruns_on_use
    2. Line 10, column 9 to line 10, column 15 in failing_definition_reruns_on_use
    3. Line 10, column 9 to line 10, column 11 in failing_definition_reruns_on_use
    4. Line 9, column 8 to line 9, column 54 in failing_definition_reruns_on_use
    5. Line 9, column 26 to line 9, column 47 in failing_definition_reruns_on_use
next:
  exit: 75
  transcript: |-
    | 1
    | 1
    | 1
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 9, col 26 to line 9, col 47 of module failing_definition_reruns_on_use
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    | 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 33 in failing_definition_reruns_on_use
    1. Line 13, column 30 to line 13, column 33 in failing_definition_reruns_on_use
    2. Line 10, column 9 to line 10, column 15 in failing_definition_reruns_on_use
    3. Line 10, column 9 to line 10, column 11 in failing_definition_reruns_on_use
    4. Line 9, column 8 to line 9, column 54 in failing_definition_reruns_on_use
    5. Line 9, column 26 to line 9, column 47 in failing_definition_reruns_on_use
invariant:
  exit: 75
  transcript: |-
    | 1
    | 1
    | 1
    2102:1 Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 9, col 26 to line 9, col 47 of module failing_definition_reruns_on_use
    While working on the initial state:
    conformance_state = TRUE
    | 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in failing_definition_reruns_on_use
    1. Line 14, column 8 to line 14, column 32 in failing_definition_reruns_on_use
    2. Line 14, column 29 to line 14, column 32 in failing_definition_reruns_on_use
    3. Line 10, column 9 to line 10, column 15 in failing_definition_reruns_on_use
    4. Line 10, column 9 to line 10, column 11 in failing_definition_reruns_on_use
    5. Line 9, column 8 to line 9, column 54 in failing_definition_reruns_on_use
    6. Line 9, column 26 to line 9, column 47 in failing_definition_reruns_on_use
property:
  exit: 75
  transcript: |-
    | 1
    | 1
    | 1
    2102:1 Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 9, col 26 to line 9, col 47 of module failing_definition_reruns_on_use
    While working on the initial state:
    conformance_state = TRUE
    | 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in failing_definition_reruns_on_use
    1. Line 13, column 12 to line 13, column 36 in failing_definition_reruns_on_use
    2. Line 13, column 33 to line 13, column 36 in failing_definition_reruns_on_use
    3. Line 10, column 9 to line 10, column 15 in failing_definition_reruns_on_use
    4. Line 10, column 9 to line 10, column 11 in failing_definition_reruns_on_use
    5. Line 9, column 8 to line 9, column 54 in failing_definition_reruns_on_use
    6. Line 9, column 26 to line 9, column 47 in failing_definition_reruns_on_use
---*)
