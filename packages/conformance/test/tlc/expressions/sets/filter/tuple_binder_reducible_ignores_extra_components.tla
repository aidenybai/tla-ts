(*---
description: "A filter binder over a Reducible set does not check tuple length, so a longer tuple is accepted and its extra component ignored. TLC should report a mismatch here, as the lazy path does."
ref: "tlc2/tool/impl/Tool.java#OPCODE_sso"
features: [tlc-bug]
flags: [expression]
outcome: success
correct:
  assume:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 72, col 8 to line 72, col 11 of module tuple_binder_reducible_ignores_extra_components failed.
      2170:0 Argument mismatch in operator application.line 71, col 12 to line 71, col 12 of module tuple_binder_reducible_ignores_extra_components
  init:
    exit: 75
    transcript: |-
      1000:1 
      2170:0 Argument mismatch in operator application.line 71, col 12 to line 71, col 12 of module tuple_binder_reducible_ignores_extra_components
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 73, column 9 to line 73, column 32 in tuple_binder_reducible_ignores_extra_components
      1. Line 73, column 29 to line 73, column 32 in tuple_binder_reducible_ignores_extra_components
      2. Line 71, column 9 to line 71, column 60 in tuple_binder_reducible_ignores_extra_components
      3. Line 71, column 9 to line 71, column 44 in tuple_binder_reducible_ignores_extra_components
  invariant:
    exit: 75
    transcript: |-
      2102:1 While working on the initial state:
      conformance_state = TRUE
      2170:0 Argument mismatch in operator application.line 71, col 12 to line 71, col 12 of module tuple_binder_reducible_ignores_extra_components
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 73, column 9 to line 73, column 32 in tuple_binder_reducible_ignores_extra_components
      1. Line 75, column 8 to line 75, column 32 in tuple_binder_reducible_ignores_extra_components
      2. Line 75, column 29 to line 75, column 32 in tuple_binder_reducible_ignores_extra_components
      3. Line 71, column 9 to line 71, column 60 in tuple_binder_reducible_ignores_extra_components
      4. Line 71, column 9 to line 71, column 44 in tuple_binder_reducible_ignores_extra_components
  next:
    exit: 75
    transcript: |-
      1000:1 TLC threw an unexpected exception.
      This was probably caused by an error in the spec or model.
      See the User Output or TLC Console for clues to what happened.
      The exception was a java.lang.RuntimeException
      :
      2170:0 Argument mismatch in operator application.line 71, col 12 to line 71, col 12 of module tuple_binder_reducible_ignores_extra_components
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 33 in tuple_binder_reducible_ignores_extra_components
      1. Line 74, column 30 to line 74, column 33 in tuple_binder_reducible_ignores_extra_components
      2. Line 71, column 9 to line 71, column 60 in tuple_binder_reducible_ignores_extra_components
      3. Line 71, column 9 to line 71, column 44 in tuple_binder_reducible_ignores_extra_components
  property:
    exit: 75
    transcript: |-
      2102:1 While working on the initial state:
      conformance_state = TRUE
      2170:0 Argument mismatch in operator application.line 71, col 12 to line 71, col 12 of module tuple_binder_reducible_ignores_extra_components
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 73, column 9 to line 73, column 32 in tuple_binder_reducible_ignores_extra_components
      1. Line 74, column 12 to line 74, column 36 in tuple_binder_reducible_ignores_extra_components
      2. Line 74, column 33 to line 74, column 36 in tuple_binder_reducible_ignores_extra_components
      3. Line 71, column 9 to line 71, column 60 in tuple_binder_reducible_ignores_extra_components
      4. Line 71, column 9 to line 71, column 44 in tuple_binder_reducible_ignores_extra_components
---*)
---- MODULE tuple_binder_reducible_ignores_extra_components ----
EXTENDS Integers
Test == {<<a, b>> \in {<<1, 2, 3>>} : a < b} = {<<1, 2, 3>>}
====

(*--- recorded
all:
  exit: 0
---*)
