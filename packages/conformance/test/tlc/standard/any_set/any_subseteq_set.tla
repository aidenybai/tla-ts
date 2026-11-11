(*---
description: Any \subseteq S cannot enumerate Any.
ref: tlc2/value/impl/UserValue.java#isSubsetEq
features:
  - AnySet
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE any_subseteq_set ----
EXTENDS TLC
Test == Any \subseteq {1}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module any_subseteq_set failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 12, col 9 to line 12, col 25 of module any_subseteq_set
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 12, col 9 to line 12, col 25 of module any_subseteq_set
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in any_subseteq_set
    1. Line 14, column 29 to line 14, column 32 in any_subseteq_set
    2. Line 12, column 9 to line 12, column 25 in any_subseteq_set
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 12, col 9 to line 12, col 25 of module any_subseteq_set
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in any_subseteq_set
    1. Line 15, column 30 to line 15, column 33 in any_subseteq_set
    2. Line 12, column 9 to line 12, column 25 in any_subseteq_set
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 12, col 9 to line 12, col 25 of module any_subseteq_set
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in any_subseteq_set
    1. Line 16, column 8 to line 16, column 32 in any_subseteq_set
    2. Line 16, column 29 to line 16, column 32 in any_subseteq_set
    3. Line 12, column 9 to line 12, column 25 in any_subseteq_set
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 12, col 9 to line 12, col 25 of module any_subseteq_set
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in any_subseteq_set
    1. Line 15, column 12 to line 15, column 36 in any_subseteq_set
    2. Line 15, column 33 to line 15, column 36 in any_subseteq_set
    3. Line 12, column 9 to line 12, column 25 in any_subseteq_set
---*)
