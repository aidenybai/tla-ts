(*---
description: Evaluates a random seq expression, seed 262, number 3272.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03272 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append(SortSeq(Append(<<3, 1, 2>>, 1), LAMBDA p, q : p < q), (([x \in 1..2 |-> x] @@ (1 :> 2)))[(3 % 2147483647)]), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03272 failed.
    Attempted to apply function:
    <<1, 2>>
    to argument 3, which is not in the domain of the function.
---*)
