(*---
description: Evaluates a random int expression, seed 262, number 9473.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09473 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((((1 :> 2))[7] \div (2147483647 - 7)) * Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))) \div Len(SelectSeq(Append(<<1, 2>>, 1), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09473 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
