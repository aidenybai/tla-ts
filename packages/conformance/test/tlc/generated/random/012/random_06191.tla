(*---
description: Evaluates a random bool expression, seed 262, number 6191.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06191 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(SortSeq(Tail(<<>>), LAMBDA p, q : p < q)) = [b9531 \in DOMAIN [<<5, 6>> EXCEPT ![0] = 2147483647] |-> LET b9532 == (CHOOSE b9533 \in {1} : FALSE) IN (2 % b9531)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
