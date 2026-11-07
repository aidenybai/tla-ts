(*---
description: An infinitely recursive constant reports the stack overflow message while processing the spec.
ref: tlc2/tool/impl/SpecProcessor.java#processConstantDefns
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE nonterminal_constant_recursion ----
EXTENDS Naturals, TLC
VARIABLE x
RECURSIVE F(_)
F(n) == F(n + 1)
C == F(0)
Init == x = C
Next == x' = x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 This was a Java StackOverflowError. It was probably the result
    of an incorrect recursive function definition that caused TLC to enter
    an infinite loop when trying to compute the function or its application
    to an element in its putative domain.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
