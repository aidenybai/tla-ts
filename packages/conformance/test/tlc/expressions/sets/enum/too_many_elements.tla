(*---
description: "Building a set with more than TLCGlobals.setBound elements fails in ValueVec.ensureCapacity."
ref: "tlc2/value/impl/ValueVec.java#ensureCapacity"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE too_many_elements ----
EXTENDS Integers
Test == {x : x \in 1..1000001} # {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module too_many_elements failed.
    Attempted to construct a set with too many elements (>1000000).
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to construct a set with too many elements (>1000000).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a util.WrongInvocationException
    : Attempted to construct a set with too many elements (>1000000).
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to construct a set with too many elements (>1000000).
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to construct a set with too many elements (>1000000).
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
---*)
