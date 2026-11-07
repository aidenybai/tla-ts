(*---
description: Evaluates a random bool expression, seed 262, number 792.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00792 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b1302 \in (0 .. 2) : (7 < [a |-> 1, b |-> TRUE])) .. Cardinality(<<7, 2>>)) = ((CHOOSE b1303 \in (2..1 \cup {x \in 1..3 : x > 1}) : (~TRUE)) .. Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    [a |-> 1, b |-> TRUE]
    2266:0 The second argument of < should be an integer, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
