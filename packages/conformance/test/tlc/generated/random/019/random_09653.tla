(*---
description: Evaluates a random seq expression, seed 262, number 9653.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09653 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(Append(SubSeq(<<1, 2>>, 0, <<>>), Cardinality(1..3)), LAMBDA p, q : p < q), ([a |-> (1 \div (1 :> 2)), b |-> (2147483647 \in Nat)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    <<>>
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    <<>>
---*)
