(*---
description: Evaluates a random bool expression, seed 262, number 7274.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07274 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(({b11200 : b11200 \in {x \in 1..3 : x > 1}} \cap ({1, 2} \cap 1..3))) = Head(SubSeq([<<1, 2>> EXCEPT ![1] = 1], SubSeq(<<3, 1, 2>>, 3, 7), CASE TRUE -> 2147483647 [] OTHER -> -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
---*)
