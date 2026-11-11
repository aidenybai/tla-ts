(*---
description: Evaluates a random seq expression, seed 262, number 899.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00899 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq([<<TRUE, 2147483647>> EXCEPT ![1] = DOMAIN [x \in 1..2 |-> x]], LAMBDA p, q : p < q) \o {(((1 :> 2) @@ (1 :> 2)))[Len(<<1, 2>>)] : b1447 \in {b1448 \in ({x \in 1..3 : x > 1} \cup {1, 2}) : (b1448 = 1)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00899 failed.
    2266:0 The second argument of < should be an integer, but instead it is:
    1..2
---*)
