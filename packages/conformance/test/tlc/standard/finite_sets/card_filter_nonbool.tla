(*---
description: A non-Boolean filter predicate fails during the size computation.
ref: tlc2/value/impl/SetPredValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE card_filter_nonbool ----
EXTENDS FiniteSets, Naturals
Test == Cardinality({n \in 1..2 : 1}) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module card_filter_nonbool failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    1
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_filter_nonbool
    1. Line 14, column 29 to line 14, column 32 in card_filter_nonbool
    2. Line 12, column 9 to line 12, column 41 in card_filter_nonbool
    3. Line 12, column 9 to line 12, column 37 in card_filter_nonbool
    4. Line 12, column 21 to line 12, column 36 in card_filter_nonbool
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in card_filter_nonbool
    1. Line 15, column 30 to line 15, column 33 in card_filter_nonbool
    2. Line 12, column 9 to line 12, column 41 in card_filter_nonbool
    3. Line 12, column 9 to line 12, column 37 in card_filter_nonbool
    4. Line 12, column 21 to line 12, column 36 in card_filter_nonbool
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    1
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_filter_nonbool
    1. Line 16, column 8 to line 16, column 32 in card_filter_nonbool
    2. Line 16, column 29 to line 16, column 32 in card_filter_nonbool
    3. Line 12, column 9 to line 12, column 41 in card_filter_nonbool
    4. Line 12, column 9 to line 12, column 37 in card_filter_nonbool
    5. Line 12, column 21 to line 12, column 36 in card_filter_nonbool
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    1
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_filter_nonbool
    1. Line 15, column 12 to line 15, column 36 in card_filter_nonbool
    2. Line 15, column 33 to line 15, column 36 in card_filter_nonbool
    3. Line 12, column 9 to line 12, column 41 in card_filter_nonbool
    4. Line 12, column 9 to line 12, column 37 in card_filter_nonbool
    5. Line 12, column 21 to line 12, column 36 in card_filter_nonbool
---*)
