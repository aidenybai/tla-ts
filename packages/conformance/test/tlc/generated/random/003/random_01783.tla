(*---
description: Evaluates a random int expression, seed 262, number 1783.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01783 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0)) % Cardinality(({b2821 \in {x \in 1..3 : x > 1} : FALSE} \cap [b2822 \in {x \in 1..3 : x > 1} |-> b2822]))))
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
