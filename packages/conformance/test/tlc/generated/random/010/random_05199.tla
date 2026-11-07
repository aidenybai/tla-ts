(*---
description: Evaluates a random seq expression, seed 262, number 5199.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05199 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Tail((<<1, 1>> \o [<<1, 2>> EXCEPT ![1] = [a |-> 1, b |-> TRUE]])), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 1, b |-> TRUE]
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
