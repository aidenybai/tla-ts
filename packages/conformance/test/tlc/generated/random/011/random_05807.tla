(*---
description: Evaluates a random seq expression, seed 262, number 5807.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05807 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((SelectSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0) \o DOMAIN ((1 :> 2) @@ <<3, 1, 2>>)), ([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + (2 \div 1)]).a, (Head(<<-1, 7>>) * Cardinality((2147483647 .. 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {1, 2, 3}
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {1, 2, 3}
---*)
