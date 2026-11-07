(*---
description: Evaluates a random seq expression, seed 262, number 8975.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08975 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SortSeq((\E b13928 \in 2..1 : FALSE), LAMBDA p, q : p < q) \o (Append(<<1>>, 3) \o (<<1>> \o <<1>>))) EXCEPT ![1] = (-(CHOOSE b13929 \in {7, 3} : (FALSE /\ FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    FALSE
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    FALSE
---*)
