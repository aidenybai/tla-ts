(*---
description: "Unbounded recursion of an operator ends in a reported stack overflow, not a hang."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE infinite_operator_recursion ----
EXTENDS Integers
RECURSIVE R(_)
R(n) == R(n + 1)
Test == R(0) = 0
====

(*--- recorded
assume:
  exit: 255
  transcript: |-
    1005:1 This was a Java StackOverflowError. It was probably the result
    of an incorrect recursive function definition that caused TLC to enter
    an infinite loop when trying to compute the function or its application
    to an element in its putative domain.
init:
  exit: 75
  transcript: |-
    1000:1 This was a Java StackOverflowError. It was probably the result
    of an incorrect recursive function definition that caused TLC to enter
    an infinite loop when trying to compute the function or its application
    to an element in its putative domain.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
next:
  exit: 255
  transcript: |-
    1005:1 This was a Java StackOverflowError. It was probably the result
    of an incorrect recursive function definition that caused TLC to enter
    an infinite loop when trying to compute the function or its application
    to an element in its putative domain.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
invariant:
  exit: 75
  transcript: |-
    2102:1 This was a Java StackOverflowError. It was probably the result
    of an incorrect recursive function definition that caused TLC to enter
    an infinite loop when trying to compute the function or its application
    to an element in its putative domain.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
property:
  exit: 75
  transcript: |-
    2102:1 This was a Java StackOverflowError. It was probably the result
    of an incorrect recursive function definition that caused TLC to enter
    an infinite loop when trying to compute the function or its application
    to an element in its putative domain.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
---*)
