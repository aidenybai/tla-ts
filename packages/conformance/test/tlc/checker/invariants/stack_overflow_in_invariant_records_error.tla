(*---
description: A stack overflow in an invariant on an initial state is a Throwable the functor keeps, so it keeps generating and reports the first error state.
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE stack_overflow_in_invariant_records_error ----
EXTENDS Naturals, TLC
VARIABLE x
RECURSIVE F(_)
F(n) == F(n + 1)
Init == x \in 1..2
Next == x' = x
Inv == F(x) = 0
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 This was a Java StackOverflowError. It was probably the result
    of an incorrect recursive function definition that caused TLC to enter
    an infinite loop when trying to compute the function or its application
    to an element in its putative domain.
    While working on the initial state:
    x = 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
    2199:0 2 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
