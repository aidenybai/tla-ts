(*---
description: Evaluates a random bool expression, seed 262, number 277.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00277 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SortSeq(<<>>, LAMBDA p, q : p < q)) \div ([(1 :> 2) EXCEPT ![3] = <<>>])[([x \in 1..2 |-> x])[2147483647]]) = (IF ({} <=> <<>>) THEN (1 - 3) ELSE Head(<<>>) * (CHOOSE b471 \in DOMAIN <<5, 6>> : (\E b472 \in {1} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
