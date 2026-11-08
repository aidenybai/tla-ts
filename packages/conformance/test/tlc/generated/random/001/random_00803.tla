(*---
description: Evaluates a random seq expression, seed 262, number 803.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00803 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((Tail((2147483647 :> 0)) \o <<Head(<<1>>), ((1 :> 2))[2147483647]>>), ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a, (Head(Append(<<1, 2>>, 3)) + Len(<<1, 0>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00803 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    (2147483647 :> 0)
---*)
