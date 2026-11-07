(*---
description: "TLC cannot evaluate an unbounded \\A."
ref: "tlc2/tool/impl/Tool.java#OPCODE_uf"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE unbounded_forall ----
EXTENDS Integers
Test == \A x : TRUE
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module unbounded_forall failed.
    TLC attempted to evaluate an unbounded \A.
    Make sure that the expression is of form \A x \in S: P(x).
    line 9, col 9 to line 9, col 19 of module unbounded_forall
init:
  exit: 75
  transcript: |-
    1000:1 TLC attempted to evaluate an unbounded \A.
    Make sure that the expression is of form \A x \in S: P(x).
    line 9, col 9 to line 9, col 19 of module unbounded_forall
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in unbounded_forall
    1. Line 11, column 29 to line 11, column 32 in unbounded_forall
    2. Line 9, column 9 to line 9, column 19 in unbounded_forall
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : TLC attempted to evaluate an unbounded \A.
    Make sure that the expression is of form \A x \in S: P(x).
    line 9, col 9 to line 9, col 19 of module unbounded_forall
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in unbounded_forall
    1. Line 12, column 30 to line 12, column 33 in unbounded_forall
    2. Line 9, column 9 to line 9, column 19 in unbounded_forall
invariant:
  exit: 75
  transcript: |-
    2102:1 TLC attempted to evaluate an unbounded \A.
    Make sure that the expression is of form \A x \in S: P(x).
    line 9, col 9 to line 9, col 19 of module unbounded_forall
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in unbounded_forall
    1. Line 13, column 8 to line 13, column 32 in unbounded_forall
    2. Line 13, column 29 to line 13, column 32 in unbounded_forall
    3. Line 9, column 9 to line 9, column 19 in unbounded_forall
property:
  exit: 75
  transcript: |-
    2102:1 TLC attempted to evaluate an unbounded \A.
    Make sure that the expression is of form \A x \in S: P(x).
    line 9, col 9 to line 9, col 19 of module unbounded_forall
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in unbounded_forall
    1. Line 12, column 12 to line 12, column 36 in unbounded_forall
    2. Line 12, column 33 to line 12, column 36 in unbounded_forall
    3. Line 9, column 9 to line 9, column 19 in unbounded_forall
---*)
