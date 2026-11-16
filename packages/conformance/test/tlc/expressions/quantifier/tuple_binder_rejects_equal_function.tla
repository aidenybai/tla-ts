(*---
description: "TLC rejects a tuple binder on a function value whose domain is 1..2, although that function equals a tuple in TLA+."
ref: "tlc2/tool/ContextEnumerator.java#nextElement"
features: [tlc-bug, tlc-bug]
flags: [expression]
outcome: evaluation-failure
correct:
  all:
    exit: 0
---*)
---- MODULE tuple_binder_rejects_equal_function ----
EXTENDS Integers
Test == \E <<a, b>> \in {[i \in 1..2 |-> i]} : a = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 14, col 8 to line 14, col 11 of module tuple_binder_rejects_equal_function failed.
    2170:0 Argument mismatch in operator application.%1
init:
  exit: 75
  transcript: |-
    1000:1 
    2170:0 Argument mismatch in operator application.%1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in tuple_binder_rejects_equal_function
    1. Line 15, column 29 to line 15, column 32 in tuple_binder_rejects_equal_function
    2. Line 13, column 9 to line 13, column 52 in tuple_binder_rejects_equal_function
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
    0. Line 16, column 9 to line 16, column 33 in tuple_binder_rejects_equal_function
    1. Line 16, column 30 to line 16, column 33 in tuple_binder_rejects_equal_function
    2. Line 13, column 9 to line 13, column 52 in tuple_binder_rejects_equal_function
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2170:0 Argument mismatch in operator application.%1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in tuple_binder_rejects_equal_function
    1. Line 17, column 8 to line 17, column 32 in tuple_binder_rejects_equal_function
    2. Line 17, column 29 to line 17, column 32 in tuple_binder_rejects_equal_function
    3. Line 13, column 9 to line 13, column 52 in tuple_binder_rejects_equal_function
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2170:0 Argument mismatch in operator application.%1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in tuple_binder_rejects_equal_function
    1. Line 16, column 12 to line 16, column 36 in tuple_binder_rejects_equal_function
    2. Line 16, column 33 to line 16, column 36 in tuple_binder_rejects_equal_function
    3. Line 13, column 9 to line 13, column 52 in tuple_binder_rejects_equal_function
---*)
