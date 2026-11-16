(*---
description: "A filter binder over a Reducible set casts elements to TupleValue, so an integer surfaces as a ClassCastException."
ref: "tlc2/tool/impl/Tool.java#OPCODE_sso"
features: [tlc-bug]
flags: [expression]
outcome: evaluation-failure
correct:
  assume:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 72, col 8 to line 72, col 11 of module tuple_binder_reducible_non_tuple failed.
      2170:0 Argument mismatch in operator application.line 71, col 12 to line 71, col 12 of module tuple_binder_reducible_non_tuple
  init:
    exit: 75
    transcript: |-
      1000:1 
      2170:0 Argument mismatch in operator application.line 71, col 12 to line 71, col 12 of module tuple_binder_reducible_non_tuple
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 73, column 9 to line 73, column 32 in tuple_binder_reducible_non_tuple
      1. Line 73, column 29 to line 73, column 32 in tuple_binder_reducible_non_tuple
      2. Line 71, column 9 to line 71, column 38 in tuple_binder_reducible_non_tuple
      3. Line 71, column 9 to line 71, column 33 in tuple_binder_reducible_non_tuple
  invariant:
    exit: 75
    transcript: |-
      2102:1 While working on the initial state:
      conformance_state = TRUE
      2170:0 Argument mismatch in operator application.line 71, col 12 to line 71, col 12 of module tuple_binder_reducible_non_tuple
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 73, column 9 to line 73, column 32 in tuple_binder_reducible_non_tuple
      1. Line 75, column 8 to line 75, column 32 in tuple_binder_reducible_non_tuple
      2. Line 75, column 29 to line 75, column 32 in tuple_binder_reducible_non_tuple
      3. Line 71, column 9 to line 71, column 38 in tuple_binder_reducible_non_tuple
      4. Line 71, column 9 to line 71, column 33 in tuple_binder_reducible_non_tuple
  next:
    exit: 75
    transcript: |-
      1000:1 TLC threw an unexpected exception.
      This was probably caused by an error in the spec or model.
      See the User Output or TLC Console for clues to what happened.
      The exception was a java.lang.RuntimeException
      :
      2170:0 Argument mismatch in operator application.line 71, col 12 to line 71, col 12 of module tuple_binder_reducible_non_tuple
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 33 in tuple_binder_reducible_non_tuple
      1. Line 74, column 30 to line 74, column 33 in tuple_binder_reducible_non_tuple
      2. Line 71, column 9 to line 71, column 38 in tuple_binder_reducible_non_tuple
      3. Line 71, column 9 to line 71, column 33 in tuple_binder_reducible_non_tuple
  property:
    exit: 75
    transcript: |-
      2102:1 While working on the initial state:
      conformance_state = TRUE
      2170:0 Argument mismatch in operator application.line 71, col 12 to line 71, col 12 of module tuple_binder_reducible_non_tuple
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 73, column 9 to line 73, column 32 in tuple_binder_reducible_non_tuple
      1. Line 74, column 12 to line 74, column 36 in tuple_binder_reducible_non_tuple
      2. Line 74, column 33 to line 74, column 36 in tuple_binder_reducible_non_tuple
      3. Line 71, column 9 to line 71, column 38 in tuple_binder_reducible_non_tuple
      4. Line 71, column 9 to line 71, column 33 in tuple_binder_reducible_non_tuple
---*)
---- MODULE tuple_binder_reducible_non_tuple ----
EXTENDS Integers
Test == {<<a, b>> \in {1} : TRUE} # {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 72, col 8 to line 72, col 11 of module tuple_binder_reducible_non_tuple failed.
    class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.TupleValue (tlc2.value.impl.IntValue and tlc2.value.impl.TupleValue are in unnamed module of loader 'app')
init:
  exit: 75
  transcript: |-
    1000:1 class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.TupleValue (tlc2.value.impl.IntValue and tlc2.value.impl.TupleValue are in unnamed module of loader 'app')
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.ClassCastException
    : class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.TupleValue (tlc2.value.impl.IntValue and tlc2.value.impl.TupleValue are in unnamed module of loader 'app')
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
invariant:
  exit: 75
  transcript: |-
    2102:1 class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.TupleValue (tlc2.value.impl.IntValue and tlc2.value.impl.TupleValue are in unnamed module of loader 'app')
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
property:
  exit: 75
  transcript: |-
    2102:1 class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.TupleValue (tlc2.value.impl.IntValue and tlc2.value.impl.TupleValue are in unnamed module of loader 'app')
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
---*)
