(*---
description: Evaluates a random bool expression, seed 262, number 1832.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01832 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b2903 \in SortSeq(SortSeq(<<1, [a |-> 1]>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q) : (((b2903 :> 2147483647))[(b2903 * 2)] = ([b2904 \in Nat |-> 7])[(2 + b2903)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 1]
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 1]
---*)
