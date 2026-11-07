(*---
description: Evaluates a random int expression, seed 262, number 3588.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03588 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 3 ELSE 1 \div Head(<<>>)) * ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a) + ((SortSeq(<<>>, LAMBDA p, q : p < q) @@ ([x \in Nat |-> x + 1] @@ <<5, 6>>)))[Cardinality(({2, 1, 3} \ {}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
