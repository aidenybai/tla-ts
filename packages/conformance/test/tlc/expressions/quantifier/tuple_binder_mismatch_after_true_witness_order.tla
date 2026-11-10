(*---
description: "A tuple binder checks the next element only when enumeration reaches it, in normalized order."
ref: "tlc2/tool/ContextEnumerator.java#nextElement"
features:
  - tlc-bug
flags: [expression]
outcome: evaluation-failure
correct:
  assume:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 69, col 8 to line 69, col 11 of module tuple_binder_mismatch_after_true_witness_order failed.
      2170:0 Argument mismatch in operator application.line 68, col 14 to line 68, col 14 of module tuple_binder_mismatch_after_true_witness_order
  init:
    exit: 75
    transcript: |-
      1000:1 
      2170:0 Argument mismatch in operator application.line 68, col 14 to line 68, col 14 of module tuple_binder_mismatch_after_true_witness_order
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 70, column 9 to line 70, column 32 in tuple_binder_mismatch_after_true_witness_order
      1. Line 70, column 29 to line 70, column 32 in tuple_binder_mismatch_after_true_witness_order
      2. Line 68, column 9 to line 68, column 55 in tuple_binder_mismatch_after_true_witness_order
  invariant:
    exit: 75
    transcript: |-
      2102:1 While working on the initial state:
      conformance_state = TRUE
      2170:0 Argument mismatch in operator application.line 68, col 14 to line 68, col 14 of module tuple_binder_mismatch_after_true_witness_order
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 70, column 9 to line 70, column 32 in tuple_binder_mismatch_after_true_witness_order
      1. Line 72, column 8 to line 72, column 32 in tuple_binder_mismatch_after_true_witness_order
      2. Line 72, column 29 to line 72, column 32 in tuple_binder_mismatch_after_true_witness_order
      3. Line 68, column 9 to line 68, column 55 in tuple_binder_mismatch_after_true_witness_order
  next:
    exit: 75
    transcript: |-
      1000:1 TLC threw an unexpected exception.
      This was probably caused by an error in the spec or model.
      See the User Output or TLC Console for clues to what happened.
      The exception was a java.lang.RuntimeException
      :
      2170:0 Argument mismatch in operator application.line 68, col 14 to line 68, col 14 of module tuple_binder_mismatch_after_true_witness_order
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 71, column 9 to line 71, column 33 in tuple_binder_mismatch_after_true_witness_order
      1. Line 71, column 30 to line 71, column 33 in tuple_binder_mismatch_after_true_witness_order
      2. Line 68, column 9 to line 68, column 55 in tuple_binder_mismatch_after_true_witness_order
  property:
    exit: 75
    transcript: |-
      2102:1 While working on the initial state:
      conformance_state = TRUE
      2170:0 Argument mismatch in operator application.line 68, col 14 to line 68, col 14 of module tuple_binder_mismatch_after_true_witness_order
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 70, column 9 to line 70, column 32 in tuple_binder_mismatch_after_true_witness_order
      1. Line 71, column 12 to line 71, column 36 in tuple_binder_mismatch_after_true_witness_order
      2. Line 71, column 33 to line 71, column 36 in tuple_binder_mismatch_after_true_witness_order
      3. Line 68, column 9 to line 68, column 55 in tuple_binder_mismatch_after_true_witness_order
---*)
---- MODULE tuple_binder_mismatch_after_true_witness_order ----
EXTENDS Integers
Test == \A <<a, b>> \in {<<1, 2>>, <<1, 2, 3>>} : a = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 11 of module tuple_binder_mismatch_after_true_witness_order failed.
    2170:0 Argument mismatch in operator application.%1
init:
  exit: 75
  transcript: |-
    1000:1 
    2170:0 Argument mismatch in operator application.%1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 32 in tuple_binder_mismatch_after_true_witness_order
    1. Line 13, column 29 to line 13, column 32 in tuple_binder_mismatch_after_true_witness_order
    2. Line 11, column 9 to line 11, column 55 in tuple_binder_mismatch_after_true_witness_order
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
    0. Line 14, column 9 to line 14, column 33 in tuple_binder_mismatch_after_true_witness_order
    1. Line 14, column 30 to line 14, column 33 in tuple_binder_mismatch_after_true_witness_order
    2. Line 11, column 9 to line 11, column 55 in tuple_binder_mismatch_after_true_witness_order
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2170:0 Argument mismatch in operator application.%1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 32 in tuple_binder_mismatch_after_true_witness_order
    1. Line 15, column 8 to line 15, column 32 in tuple_binder_mismatch_after_true_witness_order
    2. Line 15, column 29 to line 15, column 32 in tuple_binder_mismatch_after_true_witness_order
    3. Line 11, column 9 to line 11, column 55 in tuple_binder_mismatch_after_true_witness_order
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2170:0 Argument mismatch in operator application.%1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 32 in tuple_binder_mismatch_after_true_witness_order
    1. Line 14, column 12 to line 14, column 36 in tuple_binder_mismatch_after_true_witness_order
    2. Line 14, column 33 to line 14, column 36 in tuple_binder_mismatch_after_true_witness_order
    3. Line 11, column 9 to line 11, column 55 in tuple_binder_mismatch_after_true_witness_order
---*)
