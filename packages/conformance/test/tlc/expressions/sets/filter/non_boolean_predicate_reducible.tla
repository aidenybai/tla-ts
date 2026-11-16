(*---
description: "A filter over a Reducible set rejects a non-Boolean predicate with the Tool message."
ref: "tlc2/tool/impl/Tool.java#OPCODE_sso"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE non_boolean_predicate_reducible ----
EXTENDS Integers
Test == {x \in 1..2 : x} # {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module non_boolean_predicate_reducible failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    line 9, col 23 to line 9, col 23 of module non_boolean_predicate_reducible
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    line 9, col 23 to line 9, col 23 of module non_boolean_predicate_reducible
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in non_boolean_predicate_reducible
    1. Line 11, column 29 to line 11, column 32 in non_boolean_predicate_reducible
    2. Line 9, column 9 to line 9, column 29 in non_boolean_predicate_reducible
    3. Line 9, column 9 to line 9, column 24 in non_boolean_predicate_reducible
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    line 9, col 23 to line 9, col 23 of module non_boolean_predicate_reducible
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in non_boolean_predicate_reducible
    1. Line 12, column 30 to line 12, column 33 in non_boolean_predicate_reducible
    2. Line 9, column 9 to line 9, column 29 in non_boolean_predicate_reducible
    3. Line 9, column 9 to line 9, column 24 in non_boolean_predicate_reducible
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    line 9, col 23 to line 9, col 23 of module non_boolean_predicate_reducible
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in non_boolean_predicate_reducible
    1. Line 13, column 8 to line 13, column 32 in non_boolean_predicate_reducible
    2. Line 13, column 29 to line 13, column 32 in non_boolean_predicate_reducible
    3. Line 9, column 9 to line 9, column 29 in non_boolean_predicate_reducible
    4. Line 9, column 9 to line 9, column 24 in non_boolean_predicate_reducible
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    line 9, col 23 to line 9, col 23 of module non_boolean_predicate_reducible
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in non_boolean_predicate_reducible
    1. Line 12, column 12 to line 12, column 36 in non_boolean_predicate_reducible
    2. Line 12, column 33 to line 12, column 36 in non_boolean_predicate_reducible
    3. Line 9, column 9 to line 9, column 29 in non_boolean_predicate_reducible
    4. Line 9, column 9 to line 9, column 24 in non_boolean_predicate_reducible
---*)
