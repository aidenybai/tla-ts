(*---
description: Evaluates a random seq expression, seed 262, number 2830.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02830 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq((SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) \o SortSeq(2..1, LAMBDA p, q : p < q)), IF (TRUE <=> TRUE) THEN ([a |-> 1]).a ELSE (CHOOSE b4499 \in SUBSET {1} : FALSE), (-IF FALSE THEN 1 ELSE 3)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {}
---*)
