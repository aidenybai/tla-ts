(*---
description: Evaluates a random seq expression, seed 262, number 261.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00261 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(Tail({b440 \in {1, 2} : TRUE}), LAMBDA e : e > 0), Cardinality([[[a |-> 1] EXCEPT !.a = 0] EXCEPT !.a = @ + LET b441 == 1 IN b441]), Len(SubSeq(Tail(<<1>>), Len(<<3, 1, 2>>), (7 - [x \in 1..2 |-> x])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {1, 2}
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {1, 2}
---*)
