(*---
description: Evaluates a random seq expression, seed 262, number 1508.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01508 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append(<<(<<5, 6>>)[1], (1 - 7)>>, ((CHOOSE f \in [2..1 -> {1}] : TRUE))[(2147483647 * 0)]), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01508 failed.
    Attempted to apply function:
    <<>>
    to argument 0, which is not in the domain of the function.
---*)
