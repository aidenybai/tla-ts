(*---
description: Evaluates a random seq expression, seed 262, number 814.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00814 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<((CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE))[LET b1332 == -1 IN 0], ((3 + 3) % LET b1333 == 1 IN 2)>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00814 failed.
    Attempted to apply function:
    <<1, 1>>
    to argument 0, which is not in the domain of the function.
---*)
