(*---
description: Evaluates a random seq expression, seed 262, number 4822.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04822 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(Tail(SubSeq(<<1>>, 2, 3)), LAMBDA e : e > 0) \o SubSeq(SortSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q), (-(3 - 0)), Cardinality([<<3, 1, 2>> EXCEPT ![1] = 0]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2
---*)
