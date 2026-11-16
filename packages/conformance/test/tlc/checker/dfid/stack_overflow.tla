(*---
description: An infinitely recursive operator in Next stops -dfid with the stack overflow message.
ref: tlc2/tool/DFIDModelChecker.java#doNext
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "10"
---*)
---- MODULE stack_overflow ----
EXTENDS Naturals, TLC
VARIABLE x
RECURSIVE F(_)
F(n) == F(n + 1)
Init == x = 0
Next == x' = F(0)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 1 states generated, 1 distinct states found.
    1005:1 This was a Java StackOverflowError. It was probably the result
    of an incorrect recursive function definition that caused TLC to enter
    an infinite loop when trying to compute the function or its application
    to an element in its putative domain.
    2121:1 The behavior up to this point is:
    2216:4 1:
    x = 0
    2206:0 Progress(-1) at <date>: 1 states generated, 1 distinct states found, -1 states left on queue.
    2204:0 1 states generated, 1 distinct states found.
---*)
