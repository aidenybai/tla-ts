(*---
description: Evaluates a random seq expression, seed 262, number 1283.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01283 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq((CASE TRUE -> 1 [] OTHER -> -1 < (CHOOSE b2039 \in {1} : FALSE)), LAMBDA e : e > 0), (CHOOSE b2040 \in {b2041 \in UNION {(1 :> 2), SUBSET {1}} : (1..3 = {})} : ((2147483647 \in {1, 2}) => ([a |-> 1, b |-> TRUE] = [a |-> 1]))), Head(SortSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    1
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    1
---*)
