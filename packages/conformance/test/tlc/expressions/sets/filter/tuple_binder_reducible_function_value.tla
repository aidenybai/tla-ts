(*---
description: "A filter binder over a Reducible set casts elements to TupleValue, so a function equal to a tuple also throws ClassCastException, although <<1, 2>> and that function are the same value."
ref: "tlc2/tool/impl/Tool.java#OPCODE_sso"
features: [tlc-bug]
flags: [expression]
outcome: evaluation-failure
correct:
  all:
    exit: 0
---*)
---- MODULE tuple_binder_reducible_function_value ----
EXTENDS Integers
Test == {<<a, b>> \in {[i \in 1..2 |-> i]} : TRUE} # {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 14, col 8 to line 14, col 11 of module tuple_binder_reducible_function_value failed.
    class tlc2.value.impl.FcnRcdValue cannot be cast to class tlc2.value.impl.TupleValue (tlc2.value.impl.FcnRcdValue and tlc2.value.impl.TupleValue are in unnamed module of loader 'app')
init:
  exit: 75
  transcript: |-
    1000:1 class tlc2.value.impl.FcnRcdValue cannot be cast to class tlc2.value.impl.TupleValue (tlc2.value.impl.FcnRcdValue and tlc2.value.impl.TupleValue are in unnamed module of loader 'app')
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
    : class tlc2.value.impl.FcnRcdValue cannot be cast to class tlc2.value.impl.TupleValue (tlc2.value.impl.FcnRcdValue and tlc2.value.impl.TupleValue are in unnamed module of loader 'app')
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
invariant:
  exit: 75
  transcript: |-
    2102:1 class tlc2.value.impl.FcnRcdValue cannot be cast to class tlc2.value.impl.TupleValue (tlc2.value.impl.FcnRcdValue and tlc2.value.impl.TupleValue are in unnamed module of loader 'app')
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
property:
  exit: 75
  transcript: |-
    2102:1 class tlc2.value.impl.FcnRcdValue cannot be cast to class tlc2.value.impl.TupleValue (tlc2.value.impl.FcnRcdValue and tlc2.value.impl.TupleValue are in unnamed module of loader 'app')
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
---*)
