(*---
description: Infinity is an unbounded CHOOSE, which TLC cannot evaluate.
ref: tla2sany/StandardModules/Reals.tla#Infinity
features:
  - Reals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE infinity_unbounded_choose ----
EXTENDS Reals
Test == Infinity = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module infinity_unbounded_choose failed.
    TLC attempted to evaluate an unbounded CHOOSE.
    Make sure that the expression is of form CHOOSE x \in S: P(x).
    line 17, col 13 to line 17, col 65 of module Reals
init:
  exit: 75
  transcript: |-
    1000:1 TLC attempted to evaluate an unbounded CHOOSE.
    Make sure that the expression is of form CHOOSE x \in S: P(x).
    line 17, col 13 to line 17, col 65 of module Reals
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in infinity_unbounded_choose
    1. Line 14, column 29 to line 14, column 32 in infinity_unbounded_choose
    2. Line 12, column 9 to line 12, column 20 in infinity_unbounded_choose
    3. Line 12, column 9 to line 12, column 16 in infinity_unbounded_choose
    4. Line 17, column 13 to line 17, column 65 in Reals
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : TLC attempted to evaluate an unbounded CHOOSE.
    Make sure that the expression is of form CHOOSE x \in S: P(x).
    line 17, col 13 to line 17, col 65 of module Reals
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in infinity_unbounded_choose
    1. Line 15, column 30 to line 15, column 33 in infinity_unbounded_choose
    2. Line 12, column 9 to line 12, column 20 in infinity_unbounded_choose
    3. Line 12, column 9 to line 12, column 16 in infinity_unbounded_choose
    4. Line 17, column 13 to line 17, column 65 in Reals
invariant:
  exit: 75
  transcript: |-
    2102:1 TLC attempted to evaluate an unbounded CHOOSE.
    Make sure that the expression is of form CHOOSE x \in S: P(x).
    line 17, col 13 to line 17, col 65 of module Reals
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in infinity_unbounded_choose
    1. Line 16, column 8 to line 16, column 32 in infinity_unbounded_choose
    2. Line 16, column 29 to line 16, column 32 in infinity_unbounded_choose
    3. Line 12, column 9 to line 12, column 20 in infinity_unbounded_choose
    4. Line 12, column 9 to line 12, column 16 in infinity_unbounded_choose
    5. Line 17, column 13 to line 17, column 65 in Reals
property:
  exit: 75
  transcript: |-
    2102:1 TLC attempted to evaluate an unbounded CHOOSE.
    Make sure that the expression is of form CHOOSE x \in S: P(x).
    line 17, col 13 to line 17, col 65 of module Reals
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in infinity_unbounded_choose
    1. Line 15, column 12 to line 15, column 36 in infinity_unbounded_choose
    2. Line 15, column 33 to line 15, column 36 in infinity_unbounded_choose
    3. Line 12, column 9 to line 12, column 20 in infinity_unbounded_choose
    4. Line 12, column 9 to line 12, column 16 in infinity_unbounded_choose
    5. Line 17, column 13 to line 17, column 65 in Reals
---*)
