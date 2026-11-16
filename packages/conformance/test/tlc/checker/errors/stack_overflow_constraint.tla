(*---
description: An infinitely recursive constraint reports the stack overflow message.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
---*)
---- MODULE stack_overflow_constraint ----
EXTENDS Naturals, TLC
VARIABLE x
RECURSIVE F(_)
F(n) == F(n + 1)
Init == x = 0
Next == x' = x
Con == F(0) = 0
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
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
