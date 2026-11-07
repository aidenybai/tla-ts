(*---
description: Evaluates a random function expression, seed 262, number 7664.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07664 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(SubSeq(<<>>, 3, 2)) :> Head({b11797 : b11797 \in {}})) @@ [[b11798 \in {0, 7} |-> (b11798 \div b11798)] EXCEPT ![Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))] = (-Cardinality({1}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    {}
    2283:0 The argument of Head should be a sequence, but instead it is:
    {}
---*)
