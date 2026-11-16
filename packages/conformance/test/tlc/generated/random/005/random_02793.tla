(*---
description: Evaluates a random function expression, seed 262, number 2793.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02793 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SubSeq(Append(<<1>>, 0), (1 + 2), (CHOOSE b4425 \in 2..1 : FALSE))) :> (((CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE))[IF TRUE THEN 2147483647 ELSE 0] \div ((\E b4426 \in (1 :> 2) : FALSE) * (CHOOSE b4427 \in {2, 1, 3} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02793 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 56 to line 14, col 84 of module random_02793
---*)
