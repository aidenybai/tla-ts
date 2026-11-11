(*---
description: Evaluates a random seq expression, seed 262, number 4137.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04137 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([SelectSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0) EXCEPT ![1] = (((1 :> 2))[0] \div (0 :> 2))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04137 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)
