(*---
description: Evaluates a random bool expression, seed 262, number 1073.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01073 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 \div 1) \div Cardinality({2, 1, 3})) .. ((CHOOSE f \in [{1} -> {1, 2}] : TRUE))[Len(<<1, 2>>)]) \ DOMAIN ((-1 + 3) :> (7 + 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01073 failed.
    Attempted to apply function:
    <<1>>
    to argument 2, which is not in the domain of the function.
---*)
