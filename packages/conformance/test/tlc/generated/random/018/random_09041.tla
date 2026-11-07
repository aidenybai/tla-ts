(*---
description: Evaluates a random seq expression, seed 262, number 9041.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09041 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq(DOMAIN ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]), LAMBDA p, q : p < q), (-(-(-2147483647))), (CHOOSE b14044 \in {Len(<<1>>) : b14045 \in {b14046 \in SUBSET {1} : TRUE}} : ((7 < SUBSET {1}) => (TRUE = <<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2}
---*)
