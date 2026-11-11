(*---
description: Evaluates a random set expression, seed 262, number 9163.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09163 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((0 \div 3) + (2147483647 \div 2147483647)) + ((CHOOSE r \in [a : {1}] : TRUE)).a), (-((CHOOSE f \in [{2, 1, 3} -> {1, 2} \cap {2}] : TRUE))[(-0)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09163 failed.
    Attempted to apply function:
    <<2, 2, 2>>
    to argument 0, which is not in the domain of the function.
---*)
