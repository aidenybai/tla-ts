(*---
description: Evaluates a random seq expression, seed 262, number 1769.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01769 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([SubSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), Cardinality({2, 1, 3}), (1 + 2)) EXCEPT ![1] = ((0 * 0) * IF TRUE THEN [a |-> 1, b |-> TRUE] ELSE -1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    3
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    3
---*)
