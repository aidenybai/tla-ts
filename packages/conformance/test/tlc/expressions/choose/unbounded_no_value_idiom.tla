(*---
description: "The idiom CHOOSE v : v \\notin S is an error unless a model overrides it."
ref: "tlc2/tool/impl/Tool.java#OPCODE_uc"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE unbounded_no_value_idiom ----
EXTENDS Integers
Test == (CHOOSE v : v \notin {1}) # 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module unbounded_no_value_idiom failed.
    TLC attempted to evaluate an unbounded CHOOSE.
    Make sure that the expression is of form CHOOSE x \in S: P(x).
    line 9, col 10 to line 9, col 32 of module unbounded_no_value_idiom
init:
  exit: 75
  transcript: |-
    1000:1 TLC attempted to evaluate an unbounded CHOOSE.
    Make sure that the expression is of form CHOOSE x \in S: P(x).
    line 9, col 10 to line 9, col 32 of module unbounded_no_value_idiom
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in unbounded_no_value_idiom
    1. Line 11, column 29 to line 11, column 32 in unbounded_no_value_idiom
    2. Line 9, column 9 to line 9, column 37 in unbounded_no_value_idiom
    3. Line 9, column 10 to line 9, column 32 in unbounded_no_value_idiom
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : TLC attempted to evaluate an unbounded CHOOSE.
    Make sure that the expression is of form CHOOSE x \in S: P(x).
    line 9, col 10 to line 9, col 32 of module unbounded_no_value_idiom
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in unbounded_no_value_idiom
    1. Line 12, column 30 to line 12, column 33 in unbounded_no_value_idiom
    2. Line 9, column 9 to line 9, column 37 in unbounded_no_value_idiom
    3. Line 9, column 10 to line 9, column 32 in unbounded_no_value_idiom
invariant:
  exit: 75
  transcript: |-
    2102:1 TLC attempted to evaluate an unbounded CHOOSE.
    Make sure that the expression is of form CHOOSE x \in S: P(x).
    line 9, col 10 to line 9, col 32 of module unbounded_no_value_idiom
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in unbounded_no_value_idiom
    1. Line 13, column 8 to line 13, column 32 in unbounded_no_value_idiom
    2. Line 13, column 29 to line 13, column 32 in unbounded_no_value_idiom
    3. Line 9, column 9 to line 9, column 37 in unbounded_no_value_idiom
    4. Line 9, column 10 to line 9, column 32 in unbounded_no_value_idiom
property:
  exit: 75
  transcript: |-
    2102:1 TLC attempted to evaluate an unbounded CHOOSE.
    Make sure that the expression is of form CHOOSE x \in S: P(x).
    line 9, col 10 to line 9, col 32 of module unbounded_no_value_idiom
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in unbounded_no_value_idiom
    1. Line 12, column 12 to line 12, column 36 in unbounded_no_value_idiom
    2. Line 12, column 33 to line 12, column 36 in unbounded_no_value_idiom
    3. Line 9, column 9 to line 9, column 37 in unbounded_no_value_idiom
    4. Line 9, column 10 to line 9, column 32 in unbounded_no_value_idiom
---*)
