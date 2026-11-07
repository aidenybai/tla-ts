(*---
description: Evaluates a random function expression, seed 262, number 5028.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05028 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(<<(CHOOSE b7818 \in 1..3 : <<5, 6>>), (-0)>>) :> ((([x \in Nat |-> x + 1] @@ (1 :> 2)))[Len(<<>>)] + Len(Tail(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 25 to line 14, col 56 of module random_05028
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 25 to line 14, col 56 of module random_05028
---*)
