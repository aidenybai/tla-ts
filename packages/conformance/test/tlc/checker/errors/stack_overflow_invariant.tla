(*---
description: An infinitely recursive invariant on a successor reports the stack overflow message.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE stack_overflow_invariant ----
EXTENDS Naturals, TLC
VARIABLE x
RECURSIVE F(_)
F(n) == F(n + 1)
Init == x = 0
Next == x' = 1
Inv == x = 0 \/ F(0) = 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1005:1 This was a Java StackOverflowError. It was probably the result
    of an incorrect recursive function definition that caused TLC to enter
    an infinite loop when trying to compute the function or its application
    to an element in its putative domain.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
