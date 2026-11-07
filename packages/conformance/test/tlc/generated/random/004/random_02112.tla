(*---
description: Evaluates a random seq expression, seed 262, number 2112.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02112 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(((SubSeq(<<1>>, 1, 0) \o Append(<<3, 1, 2>>, 2)) \o SortSeq(<<(1 :> 2), 7>>, LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    <<2>>
    2266:0 The second argument of < should be an integer, but instead it is:
    <<2>>
---*)
