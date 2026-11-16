(*---
description: An infinitely recursive ASSUME reports the stack overflow message.
ref: tlc2/tool/AbstractChecker.java#checkAssumptions
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE stack_overflow_assume ----
EXTENDS Naturals, TLC
VARIABLE x
RECURSIVE F(_)
F(n) == F(n + 1)
ASSUME F(0) = 0
Init == x = 0
Next == x' = x
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1005:1 This was a Java StackOverflowError. It was probably the result
    of an incorrect recursive function definition that caused TLC to enter
    an infinite loop when trying to compute the function or its application
    to an element in its putative domain.
---*)
