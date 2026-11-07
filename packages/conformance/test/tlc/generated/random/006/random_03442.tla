(*---
description: Evaluates a random function expression, seed 262, number 3442.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03442 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((2 % 0) :> Head(<<1, 2>>)) @@ (CHOOSE r \in [a : {}] : TRUE)) EXCEPT ![Head(SubSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), (0 % -1), ([x \in 1..2 |-> x])[-1]))] = (((1 * 7) .. (CHOOSE b5455 \in 1..3 : FALSE)) \div LET b5456 == (-7) IN (b5456 + b5456))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
