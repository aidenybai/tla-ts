(*---
description: Evaluates a random function expression, seed 262, number 57.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00057 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((CHOOSE r \in [a : 1..2] : TRUE)).a, (-(7 + 1))} @@ (((2147483647 :> 0))[LET b82 == 7 IN b82] :> Len(SortSeq(<<>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00057 failed.
    Attempted to apply function:
    (2147483647 :> 0)
    to argument 7, which is not in the domain of the function.
---*)
