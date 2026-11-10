(*---
description: "A set map whose tuple binder meets a tuple of the wrong length reports an argument mismatch."
ref: "tlc2/tool/ContextEnumerator.java#nextElement"
features:
  - tlc-bug
flags: [expression]
outcome: evaluation-failure
correct:
  assume:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 73, col 8 to line 73, col 11 of module tuple_binder_wrong_length failed.
      2170:0 Argument mismatch in operator application.line 72, col 16 to line 72, col 16 of module tuple_binder_wrong_length
  init:
    exit: 75
    transcript: |-
      1000:1 
      2170:0 Argument mismatch in operator application.line 72, col 16 to line 72, col 16 of module tuple_binder_wrong_length
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 32 in tuple_binder_wrong_length
      1. Line 74, column 29 to line 74, column 32 in tuple_binder_wrong_length
      2. Line 72, column 9 to line 72, column 45 in tuple_binder_wrong_length
      3. Line 72, column 9 to line 72, column 40 in tuple_binder_wrong_length
  invariant:
    exit: 75
    transcript: |-
      2102:1 While working on the initial state:
      conformance_state = TRUE
      2170:0 Argument mismatch in operator application.line 72, col 16 to line 72, col 16 of module tuple_binder_wrong_length
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 32 in tuple_binder_wrong_length
      1. Line 76, column 8 to line 76, column 32 in tuple_binder_wrong_length
      2. Line 76, column 29 to line 76, column 32 in tuple_binder_wrong_length
      3. Line 72, column 9 to line 72, column 45 in tuple_binder_wrong_length
      4. Line 72, column 9 to line 72, column 40 in tuple_binder_wrong_length
  next:
    exit: 75
    transcript: |-
      1000:1 TLC threw an unexpected exception.
      This was probably caused by an error in the spec or model.
      See the User Output or TLC Console for clues to what happened.
      The exception was a java.lang.RuntimeException
      :
      2170:0 Argument mismatch in operator application.line 72, col 16 to line 72, col 16 of module tuple_binder_wrong_length
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 75, column 9 to line 75, column 33 in tuple_binder_wrong_length
      1. Line 75, column 30 to line 75, column 33 in tuple_binder_wrong_length
      2. Line 72, column 9 to line 72, column 45 in tuple_binder_wrong_length
      3. Line 72, column 9 to line 72, column 40 in tuple_binder_wrong_length
  property:
    exit: 75
    transcript: |-
      2102:1 While working on the initial state:
      conformance_state = TRUE
      2170:0 Argument mismatch in operator application.line 72, col 16 to line 72, col 16 of module tuple_binder_wrong_length
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 32 in tuple_binder_wrong_length
      1. Line 75, column 12 to line 75, column 36 in tuple_binder_wrong_length
      2. Line 75, column 33 to line 75, column 36 in tuple_binder_wrong_length
      3. Line 72, column 9 to line 72, column 45 in tuple_binder_wrong_length
      4. Line 72, column 9 to line 72, column 40 in tuple_binder_wrong_length
---*)
---- MODULE tuple_binder_wrong_length ----
EXTENDS Integers
Test == {a : <<a, b>> \in {<<1, 2, 3>>}} # {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 11 of module tuple_binder_wrong_length failed.
    2170:0 Argument mismatch in operator application.%1
init:
  exit: 75
  transcript: |-
    1000:1 
    2170:0 Argument mismatch in operator application.%1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 32 in tuple_binder_wrong_length
    1. Line 13, column 29 to line 13, column 32 in tuple_binder_wrong_length
    2. Line 11, column 9 to line 11, column 45 in tuple_binder_wrong_length
    3. Line 11, column 9 to line 11, column 40 in tuple_binder_wrong_length
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2170:0 Argument mismatch in operator application.%1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 33 in tuple_binder_wrong_length
    1. Line 14, column 30 to line 14, column 33 in tuple_binder_wrong_length
    2. Line 11, column 9 to line 11, column 45 in tuple_binder_wrong_length
    3. Line 11, column 9 to line 11, column 40 in tuple_binder_wrong_length
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2170:0 Argument mismatch in operator application.%1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 32 in tuple_binder_wrong_length
    1. Line 15, column 8 to line 15, column 32 in tuple_binder_wrong_length
    2. Line 15, column 29 to line 15, column 32 in tuple_binder_wrong_length
    3. Line 11, column 9 to line 11, column 45 in tuple_binder_wrong_length
    4. Line 11, column 9 to line 11, column 40 in tuple_binder_wrong_length
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2170:0 Argument mismatch in operator application.%1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 32 in tuple_binder_wrong_length
    1. Line 14, column 12 to line 14, column 36 in tuple_binder_wrong_length
    2. Line 14, column 33 to line 14, column 36 in tuple_binder_wrong_length
    3. Line 11, column 9 to line 11, column 45 in tuple_binder_wrong_length
    4. Line 11, column 9 to line 11, column 40 in tuple_binder_wrong_length
---*)
