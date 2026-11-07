(*---
description: Evaluates a random set expression, seed 262, number 9374.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09374 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((-3) % (1 \div 7)), Cardinality((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE))} \ {Len(SubSeq(<<1>>, 2147483647, -1)), ((3 + [a |-> 1, b |-> TRUE]) * (2147483647 % -1))}))
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
