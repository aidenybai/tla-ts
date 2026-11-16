(*---
description: Evaluates a random set expression, seed 262, number 7873.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07873 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b12156 \in (((-1 % 3) % Head(<<3, 1, 2>>)) .. Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))) : [a |-> (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE), b |-> ((FALSE <=> FALSE) /\ (FALSE => FALSE))]})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
