(*---
description: Evaluates a random record expression, seed 262, number 8686.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08686 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(SubSeq(SortSeq(<<>>, LAMBDA p, q : p < q), Len(<<>>), Len(<<3, 1, 2>>))), (-Cardinality((1..3 \ {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
---*)
